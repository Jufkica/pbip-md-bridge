AI Agent Skill: Power BI Project Builder (PBIP + TMDL)
1. Objective and Scope

This skill defines how to create, repair, and validate a Power BI Project (`.pbip`) with AI assistance using file-based artifacts (`.pbip`, `.pbir`, `.pbism`, TMDL, report definition JSON).

Primary goal:

- Produce a loadable Power BI project in Desktop.
- Ensure schema/version compatibility with the target Desktop build.
- Ensure report visuals are pre-defined and bound to semantic model fields/measures.
- Eliminate common project-load failures (encoding, invalid schema shape, broken model references).

2. Core Principles

- Mirror a known-good local PBIP project structure first, then customize.
- Prefer deterministic file edits over manual GUI-only steps for reproducibility.
- Keep all project metadata files UTF-8 **without BOM**.
- Use placeholder secrets in files (`REPLACE_WITH_API_KEY`), never hardcode real keys in skill output.
- Treat Power BI “Frown” details as authoritative diagnostics and patch directly to the reported fault.

3. Required PBIP Structure

Use this root structure:

- `<ProjectName>.pbip` (file, not directory)
- `<ProjectName>.Report/`
- `<ProjectName>.SemanticModel/`

3.1 PBIP shortcut file (`<ProjectName>.pbip`)

Must point to the report folder artifact:

- schema: `fabric/pbip/pbipProperties/1.0.0`
- artifact path: `<ProjectName>.Report`

3.2 Report artifact

- `<ProjectName>.Report/definition.pbir`
  - version should match working local sample (commonly `4.0`)
  - dataset reference path should be `../<ProjectName>.SemanticModel`
- Enhanced report format expected:
  - `definition/version.json`
  - `definition/report.json`
  - `definition/pages/pages.json`
  - `definition/pages/<pageName>/page.json`
  - `definition/pages/<pageName>/visuals/<visualName>/visual.json`
- Static resources required if referenced by `report.json`:
  - `StaticResources/SharedResources/BaseThemes/...`
  - `StaticResources/SharedResources/BuiltInThemes/...`

3.3 Semantic model artifact

For modern Desktop/TMDL projects, use:

- `<ProjectName>.SemanticModel/definition.pbism` (not `definition.pbidataset` with `model` property)
- `<ProjectName>.SemanticModel/definition/database.tmdl`
- `<ProjectName>.SemanticModel/definition/model.tmdl`
- `<ProjectName>.SemanticModel/definition/cultures/en-US.tmdl`
- `<ProjectName>.SemanticModel/definition/tables/*.tmdl`
- Optional: `definition/relationships.tmdl` only when relationship metadata resolves correctly.

4. Known Compatibility Pitfalls (Critical)

4.1 UTF-8 BOM failure

Symptom:

- “Only text with UTF8 encoding without BOM is supported.”

Fix:

- Rewrite all PBIP/Report/SemanticModel text metadata files as UTF-8 **without BOM**.

4.2 Wrong semantic model schema shape

Symptom:

- `definition.pbidataset` rejects property `model` (additional property not allowed).

Fix:

- Replace `definition.pbidataset` approach with `definition.pbism` + split `definition/*` TMDL layout.

4.3 Relationship invalid column ID

Symptom:

- “Relationship '<name>' uses an invalid column ID <n>.”

Fix:

- Remove or rebuild the offending relationship definition.
- If needed, simplify to a single table model first, then reintroduce relationships after successful load.

4.4 Blank report canvas despite model loading

Symptom:

- Report opens but no authored visuals appear.

Fix:

- Use full enhanced report artifact under `definition/pages/.../visuals/...` with valid visual container JSON and bound fields/measures.

5. M Query Pattern for VF Query Endpoints

Recommended partition pattern:

- Use `Web.Contents` with:
  - `RelativePath = "api/public/queries/<QueryName>"`
  - custom `Authorization = "APIKEY " & ApiKey`
- Handle VF double-nested response:
  - `Raw` can be `[[{...}]]`; unwrap with guarded `Raw{0}` when appropriate.
- Expand expected record columns deterministically.
- Type cast columns explicitly.
- Use nullable datetime when source may return null:
  - `type nullable datetime`
- Use null-safe derived date:
  - `each if [OpStartedAt] = null then null else Date.From([OpStartedAt])`
  - `type nullable date`

6. Authentication Guidance

If refresh prompts credentials or returns 403 with custom `Authorization` header:

- In Power BI Desktop:
  - Home -> Transform Data -> Data Source Settings
  - Edit Permissions for base URL
  - Set credential type to **Anonymous**

This prevents Desktop from overriding the custom API header flow.

7. AI Execution Workflow

1) Discover and clone conventions

- Inspect a known-good local PBIP project.
- Match schema versions, folder layout, and artifact naming.

2) Scaffold project

- Create root `.pbip` file.
- Create sibling `.Report` and `.SemanticModel`.
- Wire paths (`.pbip -> .Report`, `.pbir -> .SemanticModel`).

3) Implement semantic model

- Create `definition.pbism` and split TMDL files.
- Add table(s), measures, and M partition source query.
- Keep `ApiKey` placeholder, never real secret.

4) Implement report visuals

- Create report/page/visual JSON in enhanced format.
- Bind visuals to semantic model entities and measure/column names exactly.

5) Validate files

- JSON parse checks for `.pbip`, `.pbir`, `.pbism`, report definition JSON.
- BOM checks for all metadata/text artifacts.

6) Output as PBIPMD Markdown Package

- Output the entire project as a single markdown document using the PBIPMD file block format (see section 8).
- The user will paste this output into https://jufkica.github.io/pbip-md-bridge/ to download a ZIP.
- Do NOT output files individually or as a directory listing; always use the PBIPMD format.

7) Test in Desktop and iterate from errors

- Open `.pbip`.
- Use each Frown error to patch root cause quickly.
- Re-test after every targeted fix.

8. PBIPMD Markdown Package Output Format

When outputting a Power BI project, produce a single markdown document containing all project files. This document can be pasted directly into the PBIP Markdown Bridge converter at https://jufkica.github.io/pbip-md-bridge/ to download a ready-to-use ZIP.

8.1 File block format

Each file in the project is represented as a file block. The minimum required format per file is:

```
### FILE `relative/path/to/file.ext`
```text
(file content here)
```
```

Rules:
- The path must be relative (no leading `/` or drive letter), using forward slashes.
- Use ` ```text ` fence for all text files (`.pbip`, `.pbir`, `.pbism`, `.json`, `.tmdl`).
- Use ` ```base64 ` fence for binary files, with the content as a base64-encoded string.
- No metadata block, file index, or folder tree is required. The converter auto-computes sizes and hashes.
- Optional per-file metadata lines (`- encoding:`, `- bytes:`, `- sha256:`) may appear between the header and the fence but are not required.

8.2 Example output

Below is a minimal example showing the expected output structure for a project called `MyReport`:

```
### FILE `MyReport.pbip`
```text
{
  "version": "1.0",
  "artifacts": [
    {
      "report": {
        "path": "MyReport.Report"
      }
    }
  ],
  "$schema": "https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json"
}
```

### FILE `MyReport.Report/definition.pbir`
```text
{
  "version": "4.0",
  "datasetReference": {
    "byPath": {
      "path": "../MyReport.SemanticModel"
    }
  }
}
```

### FILE `MyReport.Report/definition/version.json`
```text
{
  "version": "5.0"
}
```

### FILE `MyReport.Report/definition/report.json`
```text
{
  "themeCollection": {
    "baseTheme": {
      "name": "CY24SU06",
      "version": "5.54",
      "type": "SharedResources"
    }
  },
  "settings": {
    "useStylableVisualContainerHeader": true
  },
  "filterConfig": {
    "filters": []
  }
}
```

### FILE `MyReport.SemanticModel/definition.pbism`
```text
{
  "version": "4.0",
  "settings": {}
}
```

### FILE `MyReport.SemanticModel/definition/database.tmdl`
```text
database MyReport
	compatibilityLevel: 1605
```

(... remaining files follow the same pattern ...)
```

8.3 Important notes

- Output ALL project files in a single markdown response using consecutive file blocks.
- File order does not matter; the converter sorts them.
- Do not wrap the entire output in an outer code fence. Each file block uses its own fence.
- Ensure JSON files are valid JSON and TMDL files use tab indentation.

9. Minimum Visual Set for "Active lots per workstation" Dashboard

Recommended first page:

- Card: `Active Lots`
- Card: `Active Workstations`
- Bar chart:
  - Category: `WorkStationName`
  - Value: `Active Lots` measure
- Table:
  - `SerialNumber`, `MfgLotID`, `WorkStationCode`, `WorkStationName`, `OperationName`, `CurrentOperator`, `OpStartedAt`, `RouteName`

10. Final Validation Checklist

- `.pbip` is a file (not a folder).
- All metadata files are UTF-8 without BOM.
- Semantic model uses `definition.pbism` + split TMDL layout.
- Report uses enhanced `definition/...` structure with page + visuals.
- Project opens without schema/relationship exceptions.
- Refresh works after credentials are set correctly.