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

  console.log(
    JSON.stringify(
      {
        test: "roundtrip-basic",
        status: "PASS",
        sourceFileCount: metadata.fileCount,
        rebuiltFileCount: rebuiltEntries.length,
        rebuiltEntries
      },
      null,
      2
    )
  );
}

runRoundtripTest().catch((error) => {
  console.error(
    JSON.stringify(
      {
        test: "roundtrip-basic",
        status: "FAIL",
        error: String(error?.stack || error?.message || error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
