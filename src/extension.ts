// Shift6 Formatter by Levent Akdogan (Lakdogan)
import * as vscode from 'vscode';
import { getConfig } from './config';
import { LANGUAGE_IDS } from './constants';
import { formatCore, postProcessBlankLines, preprocessDocument } from './format';
import { getFullDocumentRange } from './utils/document';

// Format a document and return the replacement edit for the full range.
function provideShift6FormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
  try {
    const fullText = document.getText();
    if (fullText.length === 0) return [];

    const lines = fullText.split(/\r?\n/);
    const cfg = getConfig();
    const pre = preprocessDocument(lines, cfg);

    let { resultLines, anyChanged } = formatCore(pre, cfg);

    const post = postProcessBlankLines(resultLines);
    resultLines = post.resultLines;
    anyChanged ||= post.anyChanged;

    if (!anyChanged && !pre.freeNeedsTrim && !pre.splitOccurred) return [];

    const range = getFullDocumentRange(document, fullText.length);
    return [vscode.TextEdit.replace(range, resultLines.join('\n'))];
  } catch (error) {
    vscode.window.showErrorMessage(`Shift6 formatter error: ${String(error)}`);
    return [];
  }
}

// Register the formatter for RPGLE language selectors.
export function activate(context: vscode.ExtensionContext) {
  const selectors: vscode.DocumentSelector = LANGUAGE_IDS.map((lang) => ({ language: lang }));

  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      return provideShift6FormattingEdits(document);
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selectors, provider)
  );
}

// No-op deactivate hook for VS Code extension lifecycle.
export function deactivate() {}
