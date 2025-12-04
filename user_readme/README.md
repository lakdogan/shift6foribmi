# Shift6 Formatter

Der Shift6 Formatter ist eine speziell für RPG Free Entwickler in Visual Studio Code entwickelte Erweiterung.  
Beim Programmieren in RPG Free muss der Quellcode oft um mindestens 6 Leerzeichen eingerückt werden, damit er im PDM (Programming Development Manager) korrekt dargestellt werden kann.  

Normalerweise müsste jede einzelne Zeile manuell um 6 Leerzeichen verschoben werden – eine mühsame und fehleranfällige Arbeit.  
Mit dem Shift6 Formatter kann dieser Schritt automatisch per "Format Document" erledigt werden.  
Das spart Zeit, reduziert Fehlerquellen und sorgt für ein einheitliches Erscheinungsbild des Codes.

Wichtige Hinweise:  
- Die erste Zeile bleibt bewusst unverändert, da `**FREE` exakt am Beginn der Datei stehen muss.  
  Würde diese verschoben werden, könnte das Programm nicht mehr kompiliert werden und es würden zahlreiche Fehlermeldungen entstehen.  
- Beginnen Sie beim Schreiben des Codes in VS Code immer am **Zeilenanfang** (ohne manuelle Leerzeichen).  
  Die Einrückung um 6 Leerzeichen wird später durch den Formatter automatisch vorgenommen.

## Verwendung

1. Installieren Sie die Erweiterung als `.vsix` in VS Code.  
2. Öffnen Sie eine RPG Free Quelldatei.  
3. Führen Sie eine der folgenden Aktionen aus:
   - Rechtsklick im Editor → "Format Document"  
   - Tastenkombination:
     - Windows/Linux: Shift + Alt + F
     - macOS: Shift + Option + F  
   - Oder: "Format Document With…" und **Shift6 Formatter** auswählen, falls mehrere Formatter installiert sind.  

Ergebnis:  
- Die erste Zeile (`**FREE`) bleibt unverändert.  
- Alle weiteren Zeilen werden automatisch um 6 Leerzeichen eingerückt, sofern sie noch nicht eingerückt sind.  
- Bereits korrekt eingerückte Dateien bleiben unverändert.
