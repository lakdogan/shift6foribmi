## Shift6 Formatter: Precision Indentation for IBM i RPG Free Development

---

### I. Executive Summary

The **Shift6 Formatter** is an indispensable tool for developers targeting the IBM i platform using **RPG Total Free**. The Shift6 Formatter ensures IBM i developers can see the full code (including the first 5 columns hidden in PDM/SEU) by applying the required 5+1 space offset: five for the hidden columns and one extra for readability when authoring RPG Free members in VS Code.






This extension completely automates this low-level, time-consuming formatting task, enabling developers to focus exclusively on business logic within Visual Studio Code.

---

### II. Core Features and Operational Benefits

The Shift6 Formatter is engineered for efficiency and code integrity, providing tangible benefits:

**A. Feature Breakdown**

-   **Atomic Formatting Command:** Full document compliance via a single keyboard shortcut or context menu click.
    -   *Developer Value:* **Accelerated Workflow:** Eliminates manual line-by-line adjustment.
-   **Compiler Integrity Logic:** The directive `**FREE` is meticulously preserved in column 1.
    -   *Developer Value:* **Zero Compilation Risk:** Guarantees adherence to stringent IBM i formatting rules.
-   **Intelligent State Preservation:** Indentation is only applied to unformatted lines. Correctly indented code is ignored.
    -   *Developer Value:* **Predictable Results:** Maintains code stability and prevents unnecessary file changes.
-   **Platform Compatibility:** Specifically designed to reconcile VS Code's flexible formatting with PDM's rigid requirements.
    -   *Developer Value:* **Seamless Toolchain:** Ensures source code is valid across both local and remote environments.
-   **Local & Remote Support:** Works on local files (`file:`), unsaved editors, and IBM i remote source members (e.g., Code for IBM i `ibmi:` / `vscode-vfs:` URIs).
    -   *Developer Value:* **Remote-first Ready:** Format members directly on the host without downloading to the workstation.
-   **Whitespace Normalization:** Collapses multiple spaces between tokens to one (e.g., `dcl-pi    *n;` → `dcl-pi *n;`, `if   flag = 0;` → `if flag = 0;`) and trims spaces inside string-only parentheses `(   'error'  )` → `('error')`.
    -   *Developer Value:* **Cleaner Diffs:** Consistent spacing without touching string contents preserves readability and minimizes churn.

**B. Settings**

- `shift6.collapseTokenSpaces` (default: `true`): Controls whether multiple spaces between tokens are collapsed to one.  
- `shift6.trimStringParentheses` (default: `true`): Removes spaces directly inside parentheses when they contain only a single string literal.  
- `shift6.alignPlusContinuation` (default: `true`): Aligns lines that start with `+` to the first `+` operator column in the previous line.  
- `shift6.continuationColumn` (default: `66`): Column limit for wrapping long binary-operator expressions onto a new continuation line.
- `shift6.joinAsteriskTokensInDecl` (default: `true`): Joins `*` tokens in `DCL-PI`/`DCL-PR`/`DCL-PROC`/`CTL-OPT` lines (e.g., `*n`, `*no`, `*new`).

New in 0.1.17: continuation wrapping and special-value `*` token handling.

**C. Git Hook (optional)**

- Pre-commit type check: enable the hook with `git config core.hooksPath .githooks`; it runs `npm run typecheck` and can be skipped via `SKIP_SHIFT6_PRECOMMIT=1`.

---

### III. Implementation and Usage

#### A. Installation

1.  Acquire the extension as a **.vsix** package.
2.  In Visual Studio Code, open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3.  Execute the command `Extensions: Install from VSIX...` and select the downloaded file.

#### B. Execution

Formatting can be executed immediately on any open RPG Free source file:

-   **Keyboard Shortcut (Recommended)**
    -   **Windows / Linux:** `Shift` + `Alt` + `F`
    -   **macOS:** `Shift` + `Option` + `F`
-   **Context Menu**
    -   Right-click in editor → **"Format Document"**
-   **Command Palette**
    -   `Ctrl` + `Shift` + `P` → **"Format Document"**

> **Note on Multiple Formatters:** If alternative formatters are active, use **"Format Document With…"** to explicitly select the **Shift6 Formatter**.

---

### IV. Developer Guidance

To ensure optimal use of this extension, developers must adhere to the following best practice:

> **Development Standard:** When composing RPG Free source code within Visual Studio Code, always begin typing at **column 1 (the start of the line)**. The required 6-space offset will be systematically applied by the Shift6 Formatter upon execution.

> **Green Screen Readability:** If you need to fix code manually on the green screen (without VS Code access), the 6-space offset preserves readability because the first 5 columns are not shown there. The formatter ensures the source stays legible in that environment.

---

### V. Version History and Contribution

**Maintainer**

- Levent Akdogan (Lakdogan) — Author, architecture, maintenance.

#### V.I. Change Log

-   See `CHANGELOG.md` for the full release history.

#### V.II. Contributors

-   [Levent Akdogan aka Lakdogan] - *Principal Architect and Maintainer.*

---

### VI. Contributing & Issue Reporting

Shift6 uses structured GitHub issue templates to streamline communication and keep the development experience smooth.

- 🐛 **Bug Reports:** Please include a reproducible code sample and environment details.  
- ✨ **Feature Requests:** Clearly describe the feature and explain why it benefits the workflow.

You can create a new issue here:  
👉 https://github.com/lakdogan/shift6foribmi/issues/new/choose

---

## VII. Visual Demo

The following animation shows a formatting operation performed by Shift6 within Visual Studio Code.

![Shift6 one-click formatting demo](https://github.com/lakdogan/shift6-formatter/blob/main/raw/HEAD/assets/demo.gif?raw=true)
Direct link (if the image does not load): https://github.com/lakdogan/shift6-formatter/blob/main/raw/HEAD/assets/demo.gif?raw=true

#### Before → Format Document → After (sample)

Before:
```rpg
**free
// messy demo snippet
ctl-opt dftactgrp(*no) actgrp(*new);
  dcl-s counter int(10) inz(0); dcl-s msg varchar(50);;;; // extra semicolons
dcl-proc demoProc; dcl-pi *n; end-pi;
if counter=0; dow counter<3; counter+=1; if counter=2; dsply('midpoint'); endif; enddo; else; dsply('preset'); endif;
end-proc;
```

After (base 6, block 2):
```rpg
**free
      // messy demo snippet
      ctl-opt dftactgrp(*no) actgrp(*new);
      dcl-s counter int(10) inz(0); dcl-s msg varchar(50);
      dcl-proc demoProc;
        dcl-pi *n;
        end-pi;
        if counter = 0;
          dow counter < 3;
            counter += 1;
            if counter = 2;
              dsply('midpoint');
            endif;
          enddo;
        else;
          dsply('preset');
        endif;
      end-proc;
```
