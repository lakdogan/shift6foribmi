## Shift6 Formatter: Praezise Einrueckung fuer IBM i RPG Free

---

### I. Zusammenfassung

Der **Shift6 Formatter** richtet RPG-Free-Code in VS Code automatisch so ein, wie es der IBM i Compiler erwartet: `**FREE` steht in Zeile 1, alle weiteren Zeilen erhalten den nötigen 6-Spaces-Offset. Das spart manuelle Arbeit, verhindert Formatierungsfehler und hält den Code auch auf dem Green Screen lesbar. Zusätzlich sorgt der Formatter dafür, dass IBM i-Entwickler den vollständigen Code sehen (auch die in PDM/SEU ausgeblendeten ersten 5 Spalten), indem er den notwendigen 5 + 1-Spaces-Offset setzt: fünf für die ausgeblendeten Spalten und ein zusätzliches Space für bessere Lesbarkeit beim Schreiben von RPG-Free-Membern in VS Code.



---

### II. Kernfunktionen und Nutzen

**A. Feature-Übersicht**

- **Ein-Klick-Formatierung:** Shortcut oder Kontextmenue formatiert das gesamte Dokument.  
  - *Mehrwert:* Schneller Workflow, keine manuelle Zeilenkorrektur.
- **Compiler-Sicherheit:** `**FREE` bleibt in Spalte 1, doppelte Marker werden entfernt.  
  - *Mehrwert:* Kein Kompilierungsrisiko durch verrutschte Direktiven.
- **Intelligentes Beibehalten:** Bereits korrekt eingerueckte Zeilen bleiben unberuehrt.  
  - *Mehrwert:* Vorhersehbare Ergebnisse; minimale Diffs.
- **Block-Indent:** Zusaetzliche Einrueckung pro Schachtelung fuer IF/DOW/DOU/FOR/SELECT/MONITOR/BEGSR/DCL-PROC.  
  - *Mehrwert:* Lesbare Schachtelungen, ohne bestehende Struktur zu zerstoeren.
- **Semikolon-Splitting:** Jede Anweisung endet auf eigener Zeile; Mehrfach-`;` werden bereinigt.  
  - *Mehrwert:* Klar getrennte Statements, auch wenn sie inline geschrieben wurden.

---

### III. Implementierung und Nutzung

#### A. Installation
1. VSIX beziehen/bauen (z.B. `shift6foribmi-0.1.0.vsix`).
2. In VS Code: Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) öffnen.
3. `Extensions: Install from VSIX...` ausfuehren und die Datei waehlen.

#### B. Ausfuehrung
Beliebige geoeffnete RPG-Free-Datei formatieren:
- **Shortcut (empfohlen):**  
  - Windows / Linux: `Shift` + `Alt` + `F`  
  - macOS: `Shift` + `Option` + `F`
- **Kontextmenue:** Rechtsklick im Editor -> **Format Document**.
- **Command Palette:** `Ctrl` + `Shift` + `P` -> **Format Document**.

> Wenn mehrere Formatter installiert sind, **Format Document With…** waehlen und **Shift6 Formatter** auswaehlen.

---

### IV. Entwicklerhinweise

> **Arbeitsstandard:** In VS Code immer in Spalte 1 beginnen. Shift6 fuegt beim Formatieren den 6-Spaces-Offset hinzu.  
> **Green-Screen-Lesbarkeit:** Falls ohne VS Code am Green Screen nachgebessert wird, bleibt der Code dank 6-Spaces-Offset lesbar (erste 5 Spalten sind dort ausgeblendet).

---

### V. Version und Beitraege

**Maintainer**

- Levent Akdogan (Lakdogan) — Autor, Architektur, Wartung.

#### V.I. Changelog
- **Version 0.1.0** (2025-12-04): Erste Veroeffentlichung. Erzwingt `**FREE` in Zeile 1, 6-Spaces-Basis, blockabhaengige Einrueckung, Semikolon-Splitting, entfernt doppelte `**FREE`.

#### V.II. Beitragende
- Levent Akdogan (Lakdogan) — Architektur und Wartung.

---

## VI. Visuelle Demo

Die folgende Animation zeigt einen Formatierungslauf mit Shift6 in Visual Studio Code.

![Shift6 one-click formatting demo](assets/demo.gif)

#### Vorher -> Format Document -> Nachher (Beispiel)

Vorher:
```rpg
**free
// messy demo snippet
ctl-opt dftactgrp(*no) actgrp(*new);
  dcl-s counter int(10) inz(0); dcl-s msg varchar(50);;;; // extra semicolons
dcl-proc demoProc; dcl-pi *n; end-pi;
if counter=0; dow counter<3; counter+=1; if counter=2; dsply('midpoint'); endif; enddo; else; dsply('preset'); endif;
end-proc;
```

Nachher (Basis 6, Block 2):
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
