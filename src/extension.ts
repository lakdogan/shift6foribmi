import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      const spaces = vscode.workspace.getConfiguration().get<number>('shift6.spaces', 6);
      const pad = ' '.repeat(Math.max(0, spaces));

      // Wenn es keine oder nur 1 Zeile gibt, nichts tun
      if (document.lineCount <= 1) return [];

      // Prüfen: sind ab Zeile 2 bereits alle mit pad eingerückt?
      let alreadyShifted = true;
      for (let i = 1; i < document.lineCount; i++) {
        const text = document.lineAt(i).text;
        if (!text.startsWith(pad)) { // sobald eine Zeile nicht mit pad beginnt -> nicht vollständig eingerückt
          alreadyShifted = false;
          break;
        }
      }
      if (alreadyShifted) return []; // nichts ändern

      // Sonst neu aufbauen: Zeile 1 unverändert, ab Zeile 2 nur einrücken, wenn noch nicht pad
      const first = document.lineAt(0);
      const last  = document.lineAt(document.lineCount - 1);
      const fullRange = new vscode.Range(first.range.start, last.range.end);

      const resultLines: string[] = [];
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text;
        if (i === 0) {
          resultLines.push(line); // erste Zeile bleibt wie sie ist
        } else {
          resultLines.push(line.startsWith(pad) ? line : pad + line);
        }
      }

      return [vscode.TextEdit.replace(fullRange, resultLines.join('\n'))];
    }
  };

  // Für ALLE Sprachen/Schemes (inkl. RPGLE/Remote)
  const selector: vscode.DocumentSelector = [{ language: '*' }];

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selector, provider)
  );
}

export function deactivate() {}
