![Shift6 Logo](assets/shift6-header.png)

# Shift6 for IBM i

Formatter for free-format RPGLE in VS Code. Keeps `**FREE` at column 1, applies a configurable base indent, and adds block-aware indentation for IF/ELSE/WHEN, loops, SELECT, MONITOR, BEGSR, and procedures. It also splits semicolon-separated statements so each ends the line (inline blocks included), and corrects both under- and over-indented lines.

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://marketplace.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Features

- `**FREE` forced to column 1 (case-insensitive).
- Ensures the first line is `**FREE` (uppercase) and removes any duplicate `**FREE` markers that appear later in the file.
- Base indent configurable via `shift6.spaces` (default 6).
- Block indent configurable via `shift6.blockIndent` (default 2) applied per nesting level for IF/DOW/DOU/FOR/SELECT/MONITOR/BEGSR/DCL-PROC blocks; closers align with their parent.
- Splits inline statements at semicolons so each statement ends its own line (including inline blocks like `dcl-proc ...; end-proc;`, `if ... endif`).
- Adjusts under- and over-indented lines to the target indent; empty lines and comment-only lines remain unchanged.
- Works for saved files and untitled buffers when the language is set to RPGLE/RPG.

---

## Usage

1. Ensure the first line is `**FREE` (any casing). Set the language to RPGLE/RPG if the buffer is untitled.
2. Run Format Document (Shift+Alt+F or Command Palette → Format Document / Format Document With… → Shift6 for IBM i).
3. The formatter will:
   - Snap `**FREE` to column 1.
   - Apply the base indent to top-level lines.
   - Apply `blockIndent` per nesting level for control blocks and procedures.
   - Split semicolon-separated statements so each statement ends its own line (including inline IF/END, DCL-PROC/END-PROC, etc.).
   - Remove extra leading spaces if a line is over-indented.

Running format again on an aligned file makes no changes.

---

## Settings

```json
{
  "shift6.spaces": 6,        // Base indent for non-first lines
  "shift6.blockIndent": 2    // Extra spaces per nested block level
}
```

Both settings are available in VS Code Settings UI (search for “Shift6”).

---

## Installation

1. Build or download the VSIX (e.g., `shift6foribmi-0.0.1.vsix`).
2. In VS Code, Extensions view → menu → “Install from VSIX…” and select the file.
3. Reload the window if prompted.

---

## Example

Before:
```rpg
**free
dcl-proc test; myfunction(); end-proc;
if cond1; if cond2; doStuff(); endif; endif;
```

After (base 6, block 2):
```rpg
**FREE
      dcl-proc test;
        myfunction();
      end-proc;
      if cond1;
        if cond2;
          doStuff();
        endif;
      endif;
```

Semicolons that appear inline are split onto separate lines, with only one `;` kept per statement.

---

## Notes and Limitations

- Whitespace-focused; does not reflow RPG syntax beyond leading indent and splitting lines that contain block keywords.
- Only runs when the first line starts with `**FREE`.
- `//` comments stay attached to their line when splitting statements.

---

## Changelog

See `CHANGELOG.md` for release notes.

---

## License

MIT License. See `LICENSE` for details.
