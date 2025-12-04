![SHIFT6 TotalFree Logo](assets/shift6-header.svg)

# SHIFT6 TotalFree RPGLE Formatter

A lightweight Visual Studio Code formatter that indents all lines except the first by a configurable number of spaces to keep free-format RPGLE compatible with green-screen toolchains.

This extension automatically prefixes every line (except the first) with N spaces (default: 6) when you run `Format Document`, preserving the required `**FREE` marker at column 1 so both VS Code and IBM i green-screen/compilation tooling see the source correctly.

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://marketplace.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Marketplace](https://img.shields.io/visual-studio-marketplace/v/your-publisher.shift6-formatter?label=VS%20Marketplace)](https://marketplace.visualstudio.com/)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/your-publisher.shift6-formatter?label=Downloads)](https://marketplace.visualstudio.com/)
[![Build Status](https://img.shields.io/badge/build-%20placeholder%20-lightgrey)](#)

---

## Features

- Keeps the first line unchanged (ensures `**FREE` remains at column 1).
- Indents every subsequent line by a configurable number of spaces (default: 6).
- No-op when target lines already match the configured indentation.
- Integrates with VS Code formatting commands and `Format Document With...`.
- Minimal configuration surface (single setting: `shift6.spaces`).

---

## How It Works

- The formatter reads the document and leaves the first line intact.
- For each remaining line, it checks whether the line already begins with the configured number of spaces.
  - If not, the formatter inserts the configured number of spaces at the line start.
  - If yes, the line is left unchanged.
- Changes are applied as a single edit so the formatter integrates cleanly with VS Code undo/redo.

---

## Before / After Example

### Before (RPGLE)
```rpg
**FREE
ctl-opt dftactgrp(*no) actgrp(*new);
dcl-s myVar int(10);
```

### After (default 6 spaces)
```rpg
**FREE
      ctl-opt dftactgrp(*no) actgrp(*new);
      dcl-s myVar int(10);
```

---

## Why This Extension Exists (Motivation)

When authoring free-format RPGLE on IBM i, the `**FREE` marker must sit exactly at column 1 for the compiler and some green-screen tooling to correctly recognise free-format mode. Some green-screen viewers truncate the displayed line, which can visually hide parts of the marker (you might only see the final `E`), but the token must still be located at column 1 to avoid compilation errors.

This formatter enables developers to write code naturally (starting each line at column 1) and then run a single formatting action to apply consistent indentation for readability and compatibility with both VS Code and IBM i systems.

---

## Installation

1. Build or obtain the `.vsix` package (e.g., `shift6-formatter-x.x.x.vsix`).
2. In Visual Studio Code: Open Extensions (`Ctrl+Shift+X`).
3. Click the menu (`⋯`) → `Install from VSIX...`.
4. Select the downloaded `.vsix` file.

Or install from the Visual Studio Marketplace once published.

---

## Settings Reference

Settings are exposed via VS Code's Settings UI and `settings.json`.

### Settings UI
- Open Settings and search for: `Shift6: Spaces`

### settings.json example
```json
{
  "shift6.spaces": 6
}
```

- `shift6.spaces` (number): Number of spaces to insert at the start of each line (default: `6`).

---

## Usage

1. Open an RPGLE source file in VS Code.
2. Run one of:
   - Right-click in the editor → `Format Document`
   - Keyboard shortcut:
     - Windows / Linux: `Shift + Alt + F`
     - macOS: `Shift + Option + F`
   - Command Palette → `Format Document With...` → select `SHIFT6 TotalFree RPGLE Formatter`
3. The first line (`**FREE`) remains at column 1; all other lines are indented according to `shift6.spaces`.

---

## Supported Scenarios and Limitations

Supported:
- Free-format RPGLE files where the `**FREE` marker appears on the first line.
- Files where you want a consistent, fixed indentation applied after authoring.

Limitations:
- The formatter only adjusts the start of lines — it does not perform language-aware formatting (no token reflow, no alignment of RPGLE statements beyond fixed-space prefix).
- The extension assumes the `**FREE` marker is the only token that must remain at column 1. If your environment requires additional left-margin tokens, handle them before running the formatter or update the workflow accordingly.
- Does not change the file encoding or line endings.
- If users rely on an alternate marker or a different workflow, adapt `shift6.spaces` or workflow steps.

---

## Folder Structure Overview

Typical repository layout:
```text
.
├─ package.json
├─ README.md
├─ src/
│  └─ extension.ts          # extension source (TypeScript)
├─ out/
│  └─ extension.js          # compiled output
├─ assets/
│  └─ shift6-header.svg     # header image used in README
├─ user_readme/
│  └─ README.en.md
└─ CHANGELOG.md             # changelog (placeholder)
```

---

## Changelog

See `CHANGELOG.md` for release notes.

Placeholder example:
```text
## [0.0.1] - 2025-12-04
- Initial release: basic shift formatter, default 6 spaces.
```

---

## FAQ

Q: Why 6 spaces by default?
A: Six spaces provides a visually clear indentation that preserves readable alignment for common RPGLE line layouts while avoiding excessive horizontal shifting in editors.

Q: Can I change the default indentation?
A: Yes — set `shift6.spaces` in VS Code settings.

Q: Will this break existing files?
A: No changes are made if lines already match the configured indentation. Always review the formatter results and use version control to manage changes.

Q: Does the formatter modify the first line?
A: No — the first line is intentionally left unchanged so `**FREE` remains at column 1.

---

## Contributing (Placeholder)

This repository includes a contributing section as a placeholder. If you need changes or fixes, open an issue describing the problem and the desired behavior. Note: maintainers may restrict pull requests if specific test/CI requirements are not followed.

---

## How the Formatter Keeps `**FREE` in Column 1

- The formatter never edits the first line of the document; it uses the document's first line as a hard anchor.
- Example workflow:
  1. Start file with `**FREE` at the beginning of line 1.
  2. Author code starting at column 1 in subsequent lines.
  3. Run the formatter — only lines 2..N are prefixed with spaces.

### Important
Some green-screen viewers show truncated left columns. Even if you visually see only `E`, the `**FREE` token must be physically located at column 1 to ensure compilation succeeds.

---

## Indentation Shift Diagram (ASCII)

```
+-------------------------------------------+
| Line 1: **FREE                            |  <-- unchanged (column 1)
+-------------------------------------------+
| Line 2: ctl-opt dftactgrp...              |  before
|        ------> add 6 spaces               |
| Line 2:       ctl-opt dftactgrp...        |  after
+-------------------------------------------+
| Line 3: dcl-s myVar int(10);              |  before
| Line 3:       dcl-s myVar int(10);        |  after
+-------------------------------------------+
```

- The formatter inserts the configured number of leading spaces for each line except the first.
- If a line already has the required leading spaces, it is not modified.

---

## License

MIT License — see `LICENSE` file for details.

---
