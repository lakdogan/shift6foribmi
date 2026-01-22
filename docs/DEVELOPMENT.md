# Shift6 Formatter - Development Notes

## Project Layout
- `src/extension.ts` - main formatter implementation.
- `out/extension.js` - transpiled output (built via `tsc`/`vsce`).
- `src/format/tokenize/*` - lightweight tokenizer for line analysis.
- `src/format/context/*` - context analyzer (openers/closers/indent tracking).
- `src/format/rules/*` - rule pipeline for line formatting.
- `src/config/schema.ts` - config defaults and normalization.
- `src/scripts/rule-tests.ts` - fast rule-level sanity tests.
- `src/format/preprocess/exec-sql/*` - exec sql formatter and helpers.
- `docs/exec-sql-scope.md` - exec sql coverage target.
- `assets/demo.gif` - demo animation used in README.
- `demo*.rpgle` - sample inputs for quick manual checks.
- `examples/test*.rpgle` - extended sample inputs for manual checks (if present).
- `README.md`, `README.de.md` - marketplace docs.

## Build & Package
- Install deps once: `npm install`
- Compile TypeScript: `npm run compile`
- Run rule tests: `npm run test:rules`
- Package VSIX (keeps relative GIF links):
  `npx -y vsce@latest package --no-rewrite-relative-links --out shift6foribmi-local.vsix`

## Debugging in VS Code
1. `npm run compile -- --watch` in a terminal.
2. `F5` (Run Extension) to launch the Extension Development Host.
3. Open a `.rpgle`/`.sqlrpgle` file and run **Format Document**.
   - Note: Shift6 does not contribute a language; ensure the editor language mode is `RPGLE` (e.g., via IBMi Languages or `files.associations`).

## Formatting Settings to Verify
- `shift6.continuationColumn` controls wrap width for long operator chains.
- `shift6.alignPlusContinuation` aligns leading `+` continuation lines.
- `shift6.joinAsteriskTokensInDecl` joins `*` tokens in declaration lines (e.g., `*n`).
- `shift6.wrapLongStrings` enables optional long string literal wrapping in concatenations.
- `shift6.fixMultilineStringLiterals` normalizes multi-line single-quote literals into concatenations.
- `shift6.concatStyle` controls concat layout (`compact` vs `one-per-line`).

## Release Checklist
- README links use local assets (no GitHub rewrite).
- Version bump in `package.json` and `CHANGELOG.md`.
- `npm run compile` passes without errors.
- `vsce package` output inspected:
  `tar -xOf shift6foribmi-<version>.vsix extension/README.md | Select-String demo.gif`
