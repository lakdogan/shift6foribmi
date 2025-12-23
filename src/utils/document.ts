import * as vscode from 'vscode';

// Compute the full document range for a replace edit.
export function getFullDocumentRange(
  document: vscode.TextDocument,
  textLength?: number
): vscode.Range {
  const length = textLength ?? document.getText().length;
  const end = document.positionAt(length);
  return new vscode.Range(new vscode.Position(0, 0), end);
}
