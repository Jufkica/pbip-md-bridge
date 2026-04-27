# PBIP Markdown Bridge
PBIP Markdown Bridge is a static web app that converts:
- **Power BI PBIP ZIP → one Markdown package**
- **Markdown package → PBIP ZIP**

It is designed for AI-assisted workflows where a PBIP project is exchanged as a single editable text file.
Live GitHub Pages site: https://jufkica.github.io/pbip-md-bridge/

## Features
- Browser-only conversion (no backend required)
- Deterministic package format (`PBIPMD` v1)
- UTF-8 and Base64 file payload support
- SHA-256 + byte-size validation on rebuild
- Path safety checks (rejects absolute paths, `..`, duplicates)
- Optional inclusion of transient Power BI artifacts

## Quick start
### Use the app
1. Open `index.html` locally, or deploy to GitHub Pages.
2. Upload a PBIP `.zip` in **ZIP → Markdown** and download the generated `.md`.
3. Edit the `.md` with your AI workflow.
4. Upload edited `.md` in **Markdown → ZIP** and download rebuilt `.zip`.

### Run local verification test
```bash path=null start=null
npm install
npm run test:roundtrip
```

## Project structure
- `index.html` — main UI
- `style.css` — app styling
- `app.js` — UI orchestration and download flow
- `converter.js` — package serializer/parser and validations
- `test/roundtrip.html` — browser-based roundtrip test page
- `test/roundtrip-node.mjs` — Node CLI roundtrip test
- `.github/workflows/pages.yml` — GitHub Pages deploy workflow

## Package format (PBIPMD v1)
Each generated Markdown package contains:
1. Metadata comment block
2. Folder structure tree
3. File index
4. Per-file content blocks

Metadata marker:
```text path=null start=null
<!-- PBIPMD:METADATA
{ ...json... }
PBIPMD:METADATA -->
```

File block structure:
- Header: `### FILE \`relative/path.ext\``
- Metadata lines:
  - `- encoding: utf8|base64`
  - `- bytes: <integer>`
  - `- sha256: <64-hex>`
- Payload in a fenced block (`text` for UTF-8, `base64` for binary)

## Validation behavior
On Markdown → ZIP conversion, invalid packages are rejected for:
- malformed or missing metadata
- duplicate file paths
- unsafe paths (`..`, drive-root/absolute paths, empty segments)
- malformed file block headers
- invalid Base64 payloads
- byte-length mismatch
- SHA-256 mismatch

## Transient Power BI artifacts
The UI toggle can include/exclude:
- `.pbi/cache.abf`
- `.pbi/localSettings.json`
- `.pbi/editorSettings.json`

Include for strict fidelity, or exclude to reduce package noise for AI editing.

## Deploy to GitHub Pages
1. Push repository to GitHub.
2. Ensure GitHub Actions is enabled.
3. The included workflow publishes from repository root.
4. `.nojekyll` is included to avoid Jekyll processing issues.
