# Shift6 Formatter – Testing Guide

## Manual Smoke Tests
- Open `demo.rpgle`, `demo-nested.rpgle`, and `demo-large.rpgle`.
- Run **Format Document** and confirm:
  - First line is `**free` (lowercase).
  - Base indent = `shift6.spaces` (default 6).
  - Block indent = `shift6.blockIndent` (default 2) applied to IF/DOW/DOU/FOR/SELECT/MONITOR/BEGSR/DCL-PROC nesting.
  - Duplicate `**FREE` markers are removed.
  - Inline semicolon splitting creates one statement per line; trailing `//` comments stay on the last segment.
  - Stray `;` lines attach to the previous code line if it lacks a semicolon.

## Settings Regression Checks
- Set `shift6.spaces` to `0` and verify no base padding is added.
- Set `shift6.blockIndent` to `0` and verify nesting does not increase indent.

## Packaging Verification
- Build: `npm run compile`
- Package:\
  `npx -y vsce@latest package --no-rewrite-relative-links --out shift6foribmi-local.vsix`
- Inspect README image path stays relative:\
  `tar -xOf shift6foribmi-local.vsix extension/README.md | Select-String demo.gif`

## Known Edge Cases to Watch
- Lines that are only comments (`// ...`) should not move unless indent differs from target.
- Multiple consecutive semicolons should collapse to single separators.
- Procedure depth tracking: `DCL-PROC` increments; `END-PROC` decrements and dedents.

## Future Automation Ideas
- Add Jest-style unit tests around formatter logic (extract into pure functions).
- Golden-file tests for sample inputs/outputs (compare formatted text snapshots).

