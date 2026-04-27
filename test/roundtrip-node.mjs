import JSZip from "jszip";
import {
  zipFileToMarkdown,
  parseMarkdownPackage,
  markdownToZipBlob
} from "../converter.js";

globalThis.window = { JSZip };

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runRoundtripTest() {
  const seedZip = new JSZip();
  seedZip.file("sample/report.json", "{\"a\":1}\n");
  seedZip.file(".pbi/cache.abf", new Uint8Array([0, 1, 2, 3, 4, 255]));
  seedZip.file("data/binary.bin", new Uint8Array([5, 6, 7, 8, 9]));

  const sourceBytes = await seedZip.generateAsync({ type: "uint8array" });
  const sourceFile = sourceBytes;
  sourceFile.name = "fixture.zip";

  const { markdown, metadata } = await zipFileToMarkdown(sourceFile, {
    includeTransient: true
  });
  const parsed = parseMarkdownPackage(markdown);
  const rebuilt = await markdownToZipBlob(markdown, "fixture-roundtrip.zip");
  const rebuiltZip = await JSZip.loadAsync(await rebuilt.blob.arrayBuffer());
  const rebuiltEntries = Object.keys(rebuiltZip.files)
    .filter((name) => !rebuiltZip.files[name].dir)
    .sort();

  const expectedEntries = [".pbi/cache.abf", "data/binary.bin", "sample/report.json"];
  assert(
    JSON.stringify(rebuiltEntries) === JSON.stringify(expectedEntries),
    `Unexpected entries after roundtrip: ${JSON.stringify(rebuiltEntries)}`
  );
  assert(metadata.fileCount === 3, `Expected metadata.fileCount=3, got ${metadata.fileCount}`);
  assert(parsed.files.length === 3, `Expected parsed.files.length=3, got ${parsed.files.length}`);
  return {
    test: "roundtrip-basic",
    sourceFileCount: metadata.fileCount,
    rebuiltFileCount: rebuiltEntries.length,
    rebuiltEntries
  };
}

function tamperPackageMetadata(markdown) {
  let changed = false;
  const tamperedBytes = markdown.replace(/- bytes: (\d+)/, (_, bytes) => {
    changed = true;
    return `- bytes: ${Number(bytes) + 7}`;
  });
  if (!changed) {
    throw new Error("Unable to tamper bytes metadata in fixture package.");
  }
  return tamperedBytes.replace(
    /- sha256: [a-f0-9]{64}/,
    "- sha256: 0000000000000000000000000000000000000000000000000000000000000000"
  );
}

async function runRecomputeModeTest() {
  const seedZip = new JSZip();
  seedZip.file("sample/report.json", "{\"a\":1}\n");

  const sourceBytes = await seedZip.generateAsync({ type: "uint8array" });
  sourceBytes.name = "fixture-recompute.zip";

  const { markdown } = await zipFileToMarkdown(sourceBytes, { includeTransient: true });
  const tamperedMarkdown = tamperPackageMetadata(markdown);

  let strictFailed = false;
  try {
    await markdownToZipBlob(tamperedMarkdown, "should-fail.zip");
  } catch {
    strictFailed = true;
  }
  assert(strictFailed, "Strict mode should fail when package metadata is stale.");

  const recomputed = await markdownToZipBlob(tamperedMarkdown, "recomputed-ok.zip", {
    recomputeMetadata: true
  });
  assert(
    recomputed.metadataMismatchCount >= 1,
    "Expected recompute mode to detect and handle metadata mismatches."
  );
  assert(
    typeof recomputed.recomputedMarkdown === "string" && recomputed.recomputedMarkdown.length > 0,
    "Expected recompute mode to return a recomputed markdown package."
  );

  return {
    test: "recompute-metadata-mode",
    strictModeFailureConfirmed: strictFailed,
    mismatchesHandled: recomputed.metadataMismatchCount
  };
}

Promise.all([runRoundtripTest(), runRecomputeModeTest()])
  .then((tests) => {
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          tests
        },
        null,
        2
      )
    );
  })
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          status: "FAIL",
          error: String(error?.stack || error?.message || error)
        },
        null,
        2
      )
    );
    process.exit(1);
  });
