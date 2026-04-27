import {
  zipFileToMarkdown,
  markdownToZipBlob,
  suggestOutputNames,
  parseMarkdownPackage
} from "./converter.js";

const zipInput = document.getElementById("zipInput");
const mdInput = document.getElementById("mdInput");
const includeTransient = document.getElementById("includeTransient");
const zipToMdBtn = document.getElementById("zipToMdBtn");
const mdToZipBtn = document.getElementById("mdToZipBtn");
const zipToMdSummary = document.getElementById("zipToMdSummary");
const mdToZipSummary = document.getElementById("mdToZipSummary");
const zipToMdDownload = document.getElementById("zipToMdDownload");
const mdToZipDownload = document.getElementById("mdToZipDownload");
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
    if (!file) throw new Error("Select a Markdown package first.");
    mdToZipDownload.classList.add("hidden");
    setBusy(mdToZipBtn, true, "Converting...", "Convert Markdown to ZIP");
    setStatus(`MD→ZIP started for ${file.name}`);

    const markdownText = await file.text();
    const parsed = parseMarkdownPackage(markdownText);
    const outName = suggestOutputNames(file.name, "md-to-zip");
    const { blob, files } = await markdownToZipBlob(markdownText, outName);
    downloadBlob(blob, outName, mdToZipDownload);

    mdToZipSummary.textContent =
      `Output: ${outName}\n` +
      `Validated files: ${files.length}\n` +
      `Format: ${parsed.metadata.magic} v${parsed.metadata.formatVersion}\n` +
      `Source zip name: ${parsed.metadata.sourceZipName ?? "(n/a)"}`;
    setStatus(`MD→ZIP completed for ${file.name}`);
  } catch (err) {
    setStatus(`MD→ZIP failed: ${err.message}`);
    mdToZipSummary.textContent = `Error: ${err.message}`;
  } finally {
    setBusy(mdToZipBtn, false, "Converting...", "Convert Markdown to ZIP");
  }
});

