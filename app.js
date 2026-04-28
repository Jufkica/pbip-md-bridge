import {
  zipFileToMarkdown,
  markdownToZipBlob,
  suggestOutputNames,
  parseMarkdownPackage
} from "./converter.js";

const zipInput = document.getElementById("zipInput");
const mdInput = document.getElementById("mdInput");
const mdPasteInput = document.getElementById("mdPasteInput");
const includeTransient = document.getElementById("includeTransient");
const recomputeMetadata = document.getElementById("recomputeMetadata");
const zipToMdBtn = document.getElementById("zipToMdBtn");
const mdToZipBtn = document.getElementById("mdToZipBtn");
const zipToMdSummary = document.getElementById("zipToMdSummary");
const mdToZipSummary = document.getElementById("mdToZipSummary");
const zipToMdDownload = document.getElementById("zipToMdDownload");
const mdToZipDownload = document.getElementById("mdToZipDownload");
const mdRecomputedDownload = document.getElementById("mdRecomputedDownload");
const statusLog = document.getElementById("statusLog");
const zipDrop = document.getElementById("zipDrop");
const mdDrop = document.getElementById("mdDrop");

function setStatus(message) {
  const ts = new Date().toISOString();
  statusLog.textContent = `[${ts}] ${message}\n${statusLog.textContent}`;
}

function setBusy(button, busy, labelBusy, labelIdle) {
  button.disabled = busy;
  button.textContent = busy ? labelBusy : labelIdle;
}

function downloadBlob(blob, fileName, anchorEl) {
  const url = URL.createObjectURL(blob);
  anchorEl.href = url;
  anchorEl.download = fileName;
  anchorEl.classList.remove("hidden");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function setupDropzone(dropEl, inputEl) {
  ["dragenter", "dragover"].forEach((evt) =>
    dropEl.addEventListener(evt, (e) => {
      e.preventDefault();
      dropEl.classList.add("dragging");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropEl.addEventListener(evt, (e) => {
      e.preventDefault();
      dropEl.classList.remove("dragging");
    })
  );
  dropEl.addEventListener("drop", (e) => {
    const files = e.dataTransfer?.files;
    if (files?.length) inputEl.files = files;
  });
}

setupDropzone(zipDrop, zipInput);
setupDropzone(mdDrop, mdInput);

zipToMdBtn.addEventListener("click", async () => {
  try {
    const file = zipInput.files?.[0];
    if (!file) throw new Error("Select a ZIP file first.");
    zipToMdDownload.classList.add("hidden");
    setBusy(zipToMdBtn, true, "Converting...", "Convert ZIP to Markdown");
    setStatus(`ZIP→MD started for ${file.name}`);

    const { markdown, metadata } = await zipFileToMarkdown(file, {
      includeTransient: includeTransient.checked
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const outName = suggestOutputNames(file.name, "zip-to-md");
    downloadBlob(blob, outName, zipToMdDownload);

    zipToMdSummary.textContent =
      `Output: ${outName}\n` +
      `Files: ${metadata.fileCount}\n` +
      `Binary files: ${metadata.binaryCount}\n` +
      `Total bytes: ${metadata.totalBytes}\n` +
      `Excluded transient: ${metadata.excludedTransient}\n` +
      `Generated UTC: ${metadata.generatedUtc}`;
    setStatus(`ZIP→MD completed for ${file.name}`);
  } catch (err) {
    setStatus(`ZIP→MD failed: ${err.message}`);
    zipToMdSummary.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(zipToMdBtn, false, "Converting...", "Convert ZIP to Markdown");
  }
});

mdToZipBtn.addEventListener("click", async () => {
  try {
    const file = mdInput.files?.[0];
    const pastedMarkdown = mdPasteInput.value.trim();
    if (!file && !pastedMarkdown) {
      throw new Error("Paste Markdown package content or select a Markdown package file first.");
    }
    mdToZipDownload.classList.add("hidden");
    mdRecomputedDownload.classList.add("hidden");
    setBusy(mdToZipBtn, true, "Converting...", "Convert Markdown to ZIP");
    const inputSourceName = pastedMarkdown ? "pasted markdown" : file.name;
    setStatus(`MD→ZIP started for ${inputSourceName}`);

    const markdownText = pastedMarkdown || (await file.text());
    const parsed = parseMarkdownPackage(markdownText);
    const outName = suggestOutputNames(file?.name ?? "pasted-package.md", "md-to-zip");
    const {
      blob,
      files,
      metadataMismatchCount,
      recomputedMarkdown,
      recomputeMetadataApplied
    } = await markdownToZipBlob(markdownText, outName, {
      recomputeMetadata: recomputeMetadata.checked
    });
    downloadBlob(blob, outName, mdToZipDownload);

    mdToZipSummary.textContent =
      `Output: ${outName}\n` +
      `Input source: ${pastedMarkdown ? "paste" : "file"}\n` +
      `Validated files: ${files.length}\n` +
      `Metadata mismatches handled: ${metadataMismatchCount}\n` +
      `Recompute mode: ${recomputeMetadataApplied ? "ON" : "OFF"}\n` +
      `Format: ${parsed.metadata.magic} v${parsed.metadata.formatVersion}\n` +
      `Source zip name: ${parsed.metadata.sourceZipName ?? "(n/a)"}`;
    if (recomputeMetadataApplied && recomputedMarkdown && metadataMismatchCount > 0) {
      const repairedName = suggestOutputNames(file?.name ?? "pasted-package.md", "zip-to-md").replace(
        /\.md$/i,
        ".recomputed.md"
      );
      const repairedBlob = new Blob([recomputedMarkdown], {
        type: "text/markdown;charset=utf-8"
      });
      downloadBlob(repairedBlob, repairedName, mdRecomputedDownload);
      mdRecomputedDownload.textContent = `Download recomputed Markdown package (${repairedName})`;
    }
    setStatus(`MD→ZIP completed for ${inputSourceName}`);
  } catch (err) {
    setStatus(`MD→ZIP failed: ${err.message}`);
    mdToZipSummary.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(mdToZipBtn, false, "Converting...", "Convert Markdown to ZIP");
  }
});

