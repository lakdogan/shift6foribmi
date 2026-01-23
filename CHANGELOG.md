# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Released]

## [0.2.4] - 2026-01-23
- Reformatted EXECUTE IMMEDIATE CREATE TABLE string literals into a multi-line, aligned column layout for readability.
- Aligned CREATE TABLE column name/type spacing inside dynamic SQL literals.
- Expanded exec sql CREATE TABLE formatting to keep multi-line column layouts (including global temp tables and options).
- Added rule-test coverage for single-line CREATE TABLE literals in EXECUTE IMMEDIATE.

## [0.2.3] - 2026-01-22
- Preserved multiline SQL literals inside exec sql blocks to avoid forced concatenation.
- Kept exec sql formatting active through SQL BEGIN...END blocks so nested statements format correctly.
- Fixed INSERT ... VALUES ... WITH NC formatting to keep WITH NC on the final line.
- Improved EXECUTE IMMEDIATE formatting to preserve multiline SQL text.
- Added rule-test coverage for exec sql multiline execute immediate and VALUES with WITH NC.

## [0.2.2] - 2026-01-22
- Removed contributed language registrations to avoid collisions with syntax highlighters.
- Formatter now registers only for existing RPGLE/RPG language IDs.

## [0.2.1] - 2026-01-19
- Kept inline `dcl-pr ... end-pr;` prototypes on a single line.
- Kept inline `dcl-ds ... end-ds;` blocks on a single line.
- Auto-closed free-form `exec sql` blocks without `end-exec;` so formatting resumes correctly.
- Preserved SQL `<>` as a single operator during exec sql normalization.
- Split exec sql WHERE/HAVING conditions onto separate lines for top-level AND/OR.
- Skipped RPG operator spacing on inline `exec sql ...;` to avoid breaking SQL tokens like `SCHEMA/TABLE` and `*cs`.
- Aligned full-line `//` comments to the indent of the following code line for tighter grouping.
- Split inline procedure calls into parameter lines when alignment is enabled, while preserving existing multi-line layouts.
- Preserved existing parameter indentation when parameter alignment is disabled.

## [0.2.0] - 2026-01-13
- Added optional alignment for procedure call parameter continuation lines via `shift6.alignProcedureCallParameters`.

## [0.1.23] - 2026-01-12
- Fixed indicator special-value joining so `*INxx` with alphanumeric suffixes (e.g., `*INKC`) stays intact.

## [0.1.22] - 2025-01-05
- Fixed formatter handling of full-line `//` comments to keep them at base indent and avoid continuation/line-wrapping changes.

## [0.1.21] - 2025-12-26
- Added exec sql block formatting with structured SQL layout, including INSERT/VALUES/SELECT/DEFAULT/GET DIAGNOSTICS patterns.
- Preserved SQL identifiers and spacing by skipping RPG operator normalization inside exec sql.
- Applied SQL-aware indentation while keeping RPG block indent stable inside exec sql blocks.
- Added SQL expression spacing for WHERE clauses and diagnostics assignments.
- Added rule-test coverage for exec sql formatting.
- Expanded exec sql coverage: UPDATE/DELETE/MERGE (incl. conditions), SELECT clauses (JOIN/GROUP/HAVING/ORDER/OFFSET/FETCH/READ/UPDATE), VALUES INTO, cursor workflows, dynamic SQL (PREPARE/EXECUTE/EXECUTE IMMEDIATE with INTO/USING), host/connection/session/transaction commands, and lock table.
- Added bundled rule-test blocks for dynamic SQL, DML edge cases, SELECT edge cases, session/transaction, cursor flows, and host/connection commands.
- Added exec sql block formatting with structured SQL layout and preserved Shift6 indentation.
- Fixed JOIN parsing to avoid duplicate JOIN segments on repeated formatting runs.
- Kept star-prefixed SQL options intact (e.g., `*cs`, `*endmod`) and preserved savepoint case.
- Added rule-test support for negative assertions (`mustExclude`) and a join-dedup case.
- Modularized exec sql formatter into small utils and per-statement formatters with a dispatcher.
- Added function header comments across exec sql modules for maintainability.
- Prevented statement splitting inside `BEGIN ... END` procedural SQL blocks.
- Added exec sql test coverage for expressions/functions (e.g., LISTAGG/XMLAGG/JSON_OBJECT/JSON_ARRAY).
- Added exec sql test coverage for PSM blocks and stored routine bodies (BEGIN/END, IF/RETURN).
- Added exec sql test coverage for triggers with inline bodies.
- Added exec sql test coverage for window/OLAP functions with OVER/PARTITION BY.
- Added exec sql test coverage for subqueries in FROM/JOIN and EXISTS clauses.
- Added exec sql test coverage for JSON/XML functions and XMLTABLE usage.
- Added exec sql test coverage for DB2-i DDL options (RCDFMT/CCSID/for system name).
- Added exec sql test coverage for special registers (SET CURRENT ... / CURRENT ...).
- Formatted PSM and trigger bodies as structured BEGIN/END blocks with nested statements.
- Ensured exec sql preprocessing uses the latest utils index after modularization.
- Added exec sql edge-case tests for recursive CTEs, handler blocks, window frames, JSON_TABLE/XMLTABLE namespaces, merge/update/delete subselects, set-operation ordering, and extended special registers/DDL options.

## [0.1.20] - 2025-12-25
- Modularized continuation handling into core/support submodules with smaller focused helpers.
- Split preprocess helpers (multiline normalization, statement splitting, segment processing) into separate files.
- Centralized string scanning utilities and reused them across continuations, preprocess, and operator helpers.
- Refactored operator helpers: consolidated token utilities and spaced-operator scanning logic.
- Built a normalize pipeline with dedicated helper steps for ctl-opt, percent builtins, asterisk rules, and operator replacements.
- Split rule tests into per-case files with shared types and an index loader.
- Added architecture guide with module overview and maintenance guidelines.

## [0.1.19] - 2025-12-24
- Fixed special value joining for `*on`, `*off`, and `*INxx` after operators and `RETURN`.
- Normalized stray spaces after `%` built-ins (e.g., `% timestamp()` -> `%timestamp()`).
- Prevented continuation splitting inside parentheses to avoid breaking expressions.

## [0.1.18] - 2025-12-24
- Added string concatenation wrapping mode config (`shift6.concatStyle`) with `compact` (default) or `one-per-line`.
- Added optional long string literal wrapping in concatenations (`shift6.wrapLongStrings`) with safe word-boundary splits.
- Added multi-line single-quote literal normalization (`shift6.fixMultilineStringLiterals`) to convert pasted strings into concatenations.
- Improved continuation handling: merge trailing `+` lines with following literals and pack concatenations greedily within the column limit.
- Made continuation wrapping account for effective indentation when evaluating column limits.
- Hardened inline statement splitting and comment detection to ignore semicolons and `//` inside strings.
- Ensured operator/asterisk normalization and spacing changes only apply outside string literals; preserved literal contents.
- Fixed spacing around `%` built-ins after operators (e.g., `+ %char(...)`).
- Trim spaces before semicolons in formatted code.
- Added rule-test coverage for string concatenation wrapping.
- Enforced minimum `shift6.continuationColumn` of 40 via config normalization and schema metadata.

## [0.1.17] - 2025-12-23
- Added configurable wrapping for long binary-operator expressions (`shift6.continuationColumn`) with safe multi-split behavior.
- Added alignment for continuation lines and improved operator spacing for `+`, `-`, `*`, `/`, `%`, including string concatenations and parentheses adjacency.
- Added handling for `%` built-ins (e.g., `%int`, `%char`) to prevent breaking.
- Improved joining of `*` special values and context-aware handling in `IF/WHEN/ON-ERROR` and `DCL-PI/DCL-PR/DCL-PROC/CTL-OPT`, plus new `shift6.joinAsteriskTokensInDecl`.
- Added robust formatting for `ctl-opt` parentheses and `*` options (e.g., `*no`, `*new`, `*srcstmt`).
- Refined `dcl-ds` block detection for inline `likeds/extname` vs. multi-line DS.
- Refactored formatter into tokenizer, context analyzer, and rule pipeline modules for scalability.
- Added config schema normalization and shared config typing.
- Added rule test harness with `test:rules` and expanded coverage for core formatting cases.
- Added trimming of leading/trailing whitespace inside parentheses (outside strings).
- Documented functions across the codebase with purpose comments for maintainability.

## [0.1.16] - 2025-12-22
- Prevent block indentation from increasing after single-line open/close blocks (e.g., `DCL-DS ... END-DS;`).

## [0.1.15] - 2025-12-17
- Added block indentation support for preprocessor conditionals (`/IF`, `/ELSE`, `/ELSEIF`, `/ENDIF`).

## [0.1.14] - 2025-12-17
- Formatter now works for IBM i remote source members (e.g., Code for IBM i `ibmi:` / `vscode-vfs:` schemes) via scheme-agnostic registration.
- Formatting operates purely on document text (no `fsPath` reads), covering remote and local files alike.
- Removed stray `onLanguage:rpgleinc` activation event to align with contributed languages.

## [0.1.13] - 2025-12-16
- Added block handling for PR/PI/ENUM declarations by recognizing `DCL-PR`, `DCL-PI`, `DCL-ENUM` openers and `END-PR`, `END-PI`, `END-ENUM` closers for indentation.

## [0.1.12] - 2025-12-16
- Added block handling for data structures by recognizing `DCL-DS` openers and `END-DS` closers for indentation.

## [0.1.8] - 2025-12-11
- Documentation updates across READMEs and docs since 0.1.3.

## [0.1.3] - 2025-12-10
- Normalize token spacing outside of string literals to a single space (e.g., `dcl-pi    *n;` -> `dcl-pi *n;`, `if   flag = 0;` -> `if flag = 0;`).
- Trim whitespace inside parentheses that only wrap a string literal (e.g., `(   'error hit'  )` -> `('error hit')`).
- Added settings `shift6.collapseTokenSpaces` and `shift6.trimStringParentheses` to toggle these whitespace rules.
- Expanded block handling: added mid/closer support for `WHEN-IS`, `WHEN-IN`, `ON-EXIT`, and `ENDON-EXIT`.
- Added optional pre-commit hook (`.githooks/pre-commit`) running `npm run typecheck` via `scripts/pre-commit-check.js`.

## [0.1.2] - 2025-12-05
- Trim trailing blank lines and drop excess blank lines before closers (END-PROC/ENDIF/etc.); collapse multiple blank lines to a single blank.
- Documented maintainer/author metadata in package and READMEs.
- Preserve first-line code when inserting `**FREE` (marker added above existing code instead of dropping it).
- Handle inline `**FREE` markers with trailing statements by splitting and formatting the remaining code.
- Drop duplicate `**FREE` markers even after semicolon splitting on subsequent format runs.

## [0.1.0] - 2025-12-04
- Renamed extension to **Shift6 for IBM i** (`shift6foribmi`).
- Added configurable block indentation via `shift6.blockIndent` (default 2).
- Added block-aware indentation for IF/ELSE/WHEN, loops, SELECT, MONITOR, BEGSR, and procedures.
- Added inline statement splitting so every semicolon-terminated statement goes on its own line (including inline block keywords).
- Improved noisy semicolon handling: collapse repeated `;` runs to one, attach stray `;` to the preceding code line, and clean up punctuation noise.
- Formatter now trims over-indented lines back to the target indent.
- Enforces `**FREE` on the first line (uppercase) and removes duplicate `**FREE` markers below it.

## [0.0.1] - 2025-12-04
- Initial documentation and README rewrite.
- Added `user_readme/README.en.md` (English user instructions).
- Updated `package.json` displayName to "TotalFree RPGLE Formatter" and clarified settings.
- Added `LICENSE` (MIT) and initial `CHANGELOG.md`.
