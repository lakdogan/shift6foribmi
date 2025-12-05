## Shift6 Formatter: Precision Indentation for IBM i RPG Free Development

---

### I. Executive Summary

The **Shift6 Formatter** is an indispensable tool for IBM i developers using **RPG Free** in Visual Studio Code. It enforces the mandatory **6-space indentation** required in PDM for correct compilation and display, automating a tedious, error-prone task so you can focus on business logic.

---

### II. Core Features and Operational Benefits

**A. Feature Breakdown**

- **Atomic Formatting Command:** One shortcut or context-menu click formats the entire document.  
  - *Developer Value:* Accelerated workflow—no manual line-by-line fixes.
- **Compiler Integrity Logic:** The `**FREE` directive stays in column 1.  
  - *Developer Value:* Zero compilation risk for IBM i formatting rules.
- **Intelligent State Preservation:** Already-correct lines are left untouched.  
  - *Developer Value:* Predictable results; minimal diffs.
- **Platform Compatibility:** Aligns VS Code editing with PDM’s strict indentation needs.  
  - *Developer Value:* Seamless handoff between local editing and green-screen tooling.

---

### III. Implementation and Usage

#### A. Installation
1. Acquire the extension as a `.vsix` package.
2. In VS Code, open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Run `Extensions: Install from VSIX...` and select the downloaded file.

#### B. Execution
Format any open RPG Free source file:
- **Keyboard Shortcut (recommended):**  
  - Windows / Linux: `Shift` + `Alt` + `F`  
  - macOS: `Shift` + `Option` + `F`
- **Context Menu:** Right-click in the editor → **Format Document**.
- **Command Palette:** `Ctrl` + `Shift` + `P` → **Format Document**.

> If multiple formatters are installed, use **Format Document With…** and select **Shift6 Formatter**.

---

### IV. Developer Guidance

> **Development Standard:** When composing RPG Free source in VS Code, start at column 1. Shift6 will apply the 6-space offset on format.  
> **Green Screen Readability:** If you must patch code on the green screen without VS Code, the 6-space offset keeps code readable (first 5 columns are hidden there).

---

### V. Version History and Contribution

#### V.I. Change Log
- **Version 0.1.0** (2025-12-04): Initial release. Enforces `**FREE` on line 1, 6-space base indent, block-aware indent, semicolon splitting, and duplicate `**FREE` removal.

#### V.II. Contributors
- Levent Akdogan (Lakdogan) — Principal Architect and Maintainer.

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
