export const FORMAT_MAGIC = "PBIPMD";
export const FORMAT_VERSION = 1;

const textDecoder = new TextDecoder("utf-8", { fatal: true });
const textEncoder = new TextEncoder();

const TEXT_EXTENSIONS = new Set([
  "pbip",
  "pbir",
  "pbism",
  "json",
  "tmdl",
  "txt",
  "csv",
  "xml",
  "yaml",
  "yml",
  "md",
  "config",
  "platform",
  "gitignore",
  "js",
  "css",
  "html"
]);

const TRANSIENT_PATTERNS = [
  /(^|\/)\.pbi\/cache\.abf$/i,
  /(^|\/)\.pbi\/localSettings\.json$/i,
  /(^|\/)\.pbi\/editorSettings\.json$/i
];

export function normalizePath(path) {
  return (path || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .trim();
}

export function isSafeRelativePath(path) {
  if (!path) return false;
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) return false;
  if (path.includes("\0")) return false;
  const segments = path.split("/");
  return !segments.some((segment) => segment === ".." || segment === "");
}

export function isTransientPath(path) {
  return TRANSIENT_PATTERNS.some((rx) => rx.test(path));
}

function extensionOf(path) {
  const base = path.split("/").pop() || "";
  const idx = base.lastIndexOf(".");
  return idx < 0 ? base.toLowerCase() : base.slice(idx + 1).toLowerCase();
}

function likelyTextByExtension(path) {
  return TEXT_EXTENSIONS.has(extensionOf(path));
}

function tryDecodeUtf8(bytes) {
  try {
    return textDecoder.decode(bytes);
  } catch {
    return null;
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  return [...view].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function classifyFile(path, bytes) {
  const decoded = tryDecodeUtf8(bytes);
  if (decoded !== null && likelyTextByExtension(path)) {
    return { encoding: "utf8", content: decoded };
  }
  if (decoded !== null) {
    // For unknown extensions, keep human-readable if decodable.
    return { encoding: "utf8", content: decoded };
  }
  return { encoding: "base64", content: bytesToBase64(bytes) };
}

function buildTree(paths) {
  const root = {};
  for (const path of paths) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      if (!node[part]) node[part] = isLeaf ? null : {};
      node = node[part] || {};
    }
  }
  const lines = [];
  const walk = (node, prefix = "") => {
    const names = Object.keys(node).sort((a, b) => a.localeCompare(b));
    names.forEach((name, index) => {
      const last = index === names.length - 1;
      const pointer = last ? "└── " : "├── ";
      const val = node[name];
      lines.push(prefix + pointer + name);
      if (val && typeof val === "object") {
        walk(val, prefix + (last ? "    " : "│   "));
      }
    });
  };
  walk(root);
  return lines.join("\n");
}

function escapeJsonForComment(metadata) {
  return JSON.stringify(metadata, null, 2);
}

function parseMetadata(markdown) {
  const match = markdown.match(
    /<!-- PBIPMD:METADATA\r?\n([\s\S]*?)\r?\nPBIPMD:METADATA -->/
  );
  if (!match) return null;
  const meta = JSON.parse(match[1]);
  if (meta.magic !== FORMAT_MAGIC) throw new Error("Invalid package magic.");
  if (meta.formatVersion !== FORMAT_VERSION) {
    throw new Error(
      `Unsupported formatVersion ${meta.formatVersion}. Expected ${FORMAT_VERSION}.`
    );
  }
  return meta;
}

function chooseFence(content) {
  let ticks = 3;
  while (content.includes("`".repeat(ticks))) ticks += 1;
  return "`".repeat(ticks);
}

function buildMarkdownPackage(entries, metadataInput = {}) {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));
  const fileCount = sorted.length;
  const binaryCount = sorted.filter((e) => e.encoding === "base64").length;
  const totalBytes = sorted.reduce((sum, e) => sum + e.bytes, 0);
  const metadata = {
    magic: FORMAT_MAGIC,
    formatVersion: FORMAT_VERSION,
    generatedUtc: new Date().toISOString(),
    ...metadataInput,
    fileCount,
    binaryCount,
    totalBytes
  };

  const indexLines = sorted.map(
    (e) => `- \`${e.path}\` | ${e.encoding} | ${e.bytes} bytes | ${e.sha256}`
  );
  const tree = buildTree(sorted.map((e) => e.path));

  const fileBlocks = sorted.map((entry) => {
    const lang = entry.encoding === "utf8" ? "text" : "base64";
    const fence = chooseFence(entry.content);
    return [
      `### FILE \`${entry.path}\``,
      `- encoding: ${entry.encoding}`,
      `- bytes: ${entry.bytes}`,
      `- sha256: ${entry.sha256}`,
      `${fence}${lang}`,
      entry.content,
      `${fence}`
    ].join("\n");
  });

  const markdown = [
    "# PBIP Markdown Package",
    "",
    "Generated by PBIP Markdown Bridge. Keep file headers and metadata intact for a valid reverse conversion.",
    "",
    "<!-- PBIPMD:METADATA",
    escapeJsonForComment(metadata),
    "PBIPMD:METADATA -->",
    "",
    "## Folder Structure",
    "```text",
    tree || "(empty)",
    "```",
    "",
    "## File Index",
    ...indexLines,
    "",
    "## Files",
    ...fileBlocks,
    ""
  ].join("\n");

  return { markdown, metadata, files: sorted };
}

export async function zipFileToMarkdown(zipFile, options = {}) {
  const includeTransient = options.includeTransient ?? true;
  if (!window.JSZip) throw new Error("JSZip is not loaded.");

  const zip = await window.JSZip.loadAsync(zipFile);
  const entries = [];
  let excludedTransient = 0;

  const names = Object.keys(zip.files).sort((a, b) => a.localeCompare(b));
  for (const name of names) {
    const file = zip.files[name];
    if (file.dir) continue;
    const path = normalizePath(name);
    if (!isSafeRelativePath(path)) {
      throw new Error(`Unsafe path in ZIP: ${path}`);
    }
    if (!includeTransient && isTransientPath(path)) {
      excludedTransient += 1;
      continue;
    }
    const bytes = await file.async("uint8array");
    const { encoding, content } = classifyFile(path, bytes);
    const sha256 = await sha256Hex(bytes);
    entries.push({
      path,
      encoding,
      bytes: bytes.length,
      sha256,
      content
    });
  }

  const packageBuild = buildMarkdownPackage(entries, {
    sourceZipName: zipFile.name,
    excludedTransient,
    includeTransient
  });

  return {
    markdown: packageBuild.markdown,
    metadata: packageBuild.metadata
  };
}

export function parseMarkdownPackage(markdown) {
  const meta = parseMetadata(markdown);
  const syntheticMetadata = meta === null;
  const effectiveMeta = meta ?? {
    magic: FORMAT_MAGIC,
    formatVersion: FORMAT_VERSION,
    generatedUtc: null,
    fileCount: 0,
    binaryCount: 0,
    totalBytes: 0
  };
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const files = [];
  const fileHeader = /^#{2,3}\s+(?:FILE\s+)?`?([^\s`]+[./][^\s`]+)`?\s*$/;
  const encodingLine = /^- encoding: (utf8|base64)$/;
  const bytesLine = /^- bytes: (\d+)$/;
  const hashLine = /^- sha256: ([a-f0-9]{64})$/;
  const fenceStart = /^(`{3,})([A-Za-z0-9_-]*)$/;

  for (let i = 0; i < lines.length; i++) {
    const headerMatch = lines[i].match(fileHeader);
    if (!headerMatch) continue;
    const path = normalizePath(headerMatch[1]);
    if (!isSafeRelativePath(path)) {
      throw new Error(`Unsafe file path in package: ${path}`);
    }
    let enc = null;
    let byteStr = null;
    let sha = null;
    let fenceMatch = null;
    let fenceLine = -1;
    for (let k = i + 1; k < Math.min(i + 10, lines.length); k++) {
      if (!enc) {
        const m = lines[k].match(encodingLine);
        if (m) { enc = m[1]; continue; }
      }
      if (byteStr === null) {
        const m = lines[k].match(bytesLine);
        if (m) { byteStr = m[1]; continue; }
      }
      if (!sha) {
        const m = lines[k].match(hashLine);
        if (m) { sha = m[1]; continue; }
      }
      fenceMatch = lines[k].match(fenceStart);
      if (fenceMatch) { fenceLine = k; break; }
    }
    if (!fenceMatch) {
      throw new Error(`Missing code fence for file: ${path}`);
    }
    enc = enc || (fenceMatch[2] === "base64" ? "base64" : "utf8");
    const fence = fenceMatch[1];
    let j = fenceLine + 1;
    const payload = [];
    while (j < lines.length && lines[j] !== fence) {
      payload.push(lines[j]);
      j += 1;
    }
    if (j >= lines.length) {
      throw new Error(`Missing closing fence for file: ${path}`);
    }
    files.push({
      path,
      encoding: enc,
      bytes: byteStr !== null ? Number(byteStr) : 0,
      sha256: sha || "",
      content: payload.join("\n")
    });
    i = j;
  }

  if (files.length === 0) {
    throw new Error("No file blocks found in package.");
  }

  const dupes = new Set();
  for (const file of files) {
    if (dupes.has(file.path)) {
      throw new Error(`Duplicate file path in package: ${file.path}`);
    }
    dupes.add(file.path);
  }

  return { metadata: effectiveMeta, files, syntheticMetadata };
}

async function decodeFileToBytes(file) {
  if (file.encoding === "utf8") {
    return textEncoder.encode(file.content);
  }
  if (file.encoding === "base64") {
    try {
      return base64ToBytes(file.content.trim());
    } catch {
      throw new Error(`Invalid base64 content for file: ${file.path}`);
    }
  }
  throw new Error(`Unknown encoding ${file.encoding} for file: ${file.path}`);
}

export async function recomputeMarkdownPackageMetadata(markdownText) {
  const parsed = parseMarkdownPackage(markdownText);
  const recomputedFiles = [];

  for (const file of parsed.files) {
    const bytes = await decodeFileToBytes(file);
    const hash = await sha256Hex(bytes);
    recomputedFiles.push({
      path: file.path,
      encoding: file.encoding,
      bytes: bytes.length,
      sha256: hash,
      content: file.content
    });
  }

  return buildMarkdownPackage(recomputedFiles, parsed.metadata);
}

export async function markdownToZipBlob(
  markdownText,
  outputZipName = "pbip-project.zip",
  options = {}
) {
  if (!window.JSZip) throw new Error("JSZip is not loaded.");
  const parsed = parseMarkdownPackage(markdownText);
  const recomputeMetadata = (options.recomputeMetadata ?? false) || parsed.syntheticMetadata;
  const zip = new window.JSZip();
  const validation = [];
  const recomputedFiles = [];
  let metadataMismatchCount = 0;

  for (const file of parsed.files) {
    const bytes = await decodeFileToBytes(file);
    const hash = await sha256Hex(bytes);
    const byteMismatch = bytes.length !== file.bytes;
    const hashMismatch = hash !== file.sha256;
    const hasMismatch = byteMismatch || hashMismatch;

    if (byteMismatch && !recomputeMetadata) {
      throw new Error(
        `Byte length mismatch for ${file.path}. Package: ${file.bytes}, actual: ${bytes.length}`
      );
    }
    if (hashMismatch && !recomputeMetadata) {
      throw new Error(
        `SHA-256 mismatch for ${file.path}. Package: ${file.sha256}, actual: ${hash}`
      );
    }

    if (hasMismatch) metadataMismatchCount += 1;
    zip.file(file.path, bytes);
    validation.push({
      path: file.path,
      bytes: bytes.length,
      sha256: hash,
      metadataMismatch: hasMismatch
    });
    recomputedFiles.push({
      path: file.path,
      encoding: file.encoding,
      bytes: bytes.length,
      sha256: hash,
      content: file.content
    });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const recomputedPackage = recomputeMetadata
    ? buildMarkdownPackage(recomputedFiles, parsed.metadata)
    : null;

  return {
    blob,
    fileName: outputZipName,
    metadata: parsed.metadata,
    files: validation,
    recomputeMetadataApplied: recomputeMetadata,
    syntheticMetadata: parsed.syntheticMetadata,
    metadataMismatchCount,
    recomputedMarkdown: recomputedPackage?.markdown ?? null,
    recomputedMetadata: recomputedPackage?.metadata ?? null
  };
}

export function suggestOutputNames(inputName, mode) {
  const safe = (inputName || "package").replace(/\.[^.]+$/, "");
  if (mode === "zip-to-md") return `${safe}.md`;
  return `${safe}.zip`;
}

