# Shift6 Formatter - Development Notes

## Project Layout
- `src/extension.ts` - main formatter implementation.
- `out/extension.js` - transpiled output (built via `tsc`/`vsce`).
- `assets/demo.gif` - demo animation used in README.
- `demo*.rpgle` - sample inputs for quick manual checks.
- `examples/test*.rpgle` - extended sample inputs for manual checks (if present).
- `README.md`, `README.de.md` - marketplace docs.

## Build & Package
- Install deps once: `npm install`
- Compile TypeScript: `npm run compile`
- Package VSIX (keeps relative GIF links):
  `npx -y vsce@latest package --no-rewrite-relative-links --out shift6foribmi-local.vsix`

## Debugging in VS Code
1. `npm run compile -- --watch` in a terminal.
2. `F5` (Run Extension) to launch the Extension Development Host.
3. Open a `.rpgle`/`.sqlrpgle` file and run **Format Document**.

## Formatting Settings to Verify
- `shift6.continuationColumn` controls wrap width for long operator chains.
- `shift6.alignPlusContinuation` aligns leading `+` continuation lines.
- `shift6.joinAsteriskTokensInDecl` joins `*` tokens in declaration lines (e.g., `*n`).

## Release Checklist
- README links use local assets (no GitHub rewrite).
- Version bump in `package.json` and `CHANGELOG.md`.
- `npm run compile` passes without errors.
- `vsce package` output inspected:
  `tar -xOf shift6foribmi-<version>.vsix extension/README.md | Select-String demo.gif`
