Formatting Architecture

Overview
- src/format/preprocess: line splitting and normalization before formatting.
- src/format/format-core: core formatter logic and layout decisions.
- src/format/continuations: wrapping and continuation line handling.
- src/format/operators: operator spacing, token normalization, and related helpers.
- src/format/utils: shared low-level utilities (string scanning, spacing helpers).

Guidelines
- Keep functions short and focused; extract helpers when logic repeats.
- Prefer shared utilities for string scanning and token checks.
- Keep modules stable and avoid cross-layer dependencies.
