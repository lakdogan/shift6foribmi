# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
