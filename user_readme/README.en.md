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

#### V.I. Change Log

-   **Version 0.1.0** (2025-12-04): Initial release. Implements mandatory 6-space indentation for all RPG Free lines, excluding the initial compiler directive.

#### V.II. Contributors

-   [Levent Akdogan aka Lakdogan] - *Principal Architect and Maintainer.*

---

## VI. Visual Demo

The following animation shows a formatting operation performed by Shift6 within Visual Studio Code.

![Shift6 one-click formatting demo](assets/shift6-demo.gif)

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
**FREE
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
