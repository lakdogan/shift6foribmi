// Shift6 Formatter by Levent Akdogan (Lakdogan)
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      // Read configuration
      const spaces = vscode.workspace.getConfiguration().get<number>('shift6.spaces', 6);
      const targetBaseIndent = Math.max(0, spaces);
      const blockIndent = Math.max(
        0,
        vscode.workspace.getConfiguration().get<number>('shift6.blockIndent', 2)
      );

      const startsWithKeyword = (upperText: string, keywords: string[]): boolean =>
        keywords.some((kw) => upperText.startsWith(kw));

      // Preconditions
      if (document.lineCount === 0) {
        return [];
      }

      const firstLineText = document.lineAt(0).text;
      const normalizedFree = '**free';

      const countLeadingSpaces = (text: string): number => {
        let i = 0;
        while (i < text.length && text.charAt(i) === ' ') {
          i++;
        }
        return i;
      };

      const lineCount = document.lineCount;

      const freeNeedsTrim = firstLineText.trim().toLowerCase() !== normalizedFree;

      const closers = [
        'END-PROC',
        'ENDPROC',
        'ENDIF',
        'END-IF',
        'ENDDO',
        'END-DO',
        'ENDSL',
        'END-SELECT',
        'ENDSELECT',
        'ENDMON',
        'END-MON',
        'ENDSR',
        'END-SR',
        'ENDFOR',
        'END-FOR'
      ];

      const openers = ['DCL-PROC', 'IF', 'DOW', 'DOU', 'MONITOR', 'FOR', 'SELECT', 'BEGSR'];
      const midKeywords = ['ELSE', 'ELSEIF', 'ELSE IF', 'WHEN', 'OTHER', 'ON-ERROR'];

      const splitStatements = (line: string): string[] => {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          return [line];
        }
        const trimmedStart = line.trimStart();
        if (trimmedStart.startsWith('//')) {
          return [line];
        }

        const commentIndex = line.indexOf('//');
        const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

        // Collapse repeated semicolons (optionally spaced) into a single semicolon
        // e.g., ";;", ";   ;", ";;;;" all become ";"
        const normalizedCode = codePart.replace(/;[ \t]*;+/g, ';');

        if (!normalizedCode.includes(';')) {
          return [line];
        }

        const lineIndent = line.match(/^ */)?.[0] ?? '';
        const pieces = normalizedCode.split(';');
        const endsWithSemicolon = normalizedCode.trimEnd().endsWith(';');
        const segments: string[] = [];
        let pendingSemicolon = false;

        for (let idx = 0; idx < pieces.length; idx++) {
          const segRaw = pieces[idx];
          const seg = segRaw.trim();
          const segHasSemicolon = seg.endsWith(';');
          const hadSemicolon = idx < pieces.length - 1 || endsWithSemicolon;
          const punctuationOnly = /^[.,]+$/.test(seg);

          if (seg.length === 0 || punctuationOnly) {
            // Skip punctuation/empty parts, but remember if a semicolon separator was present
            pendingSemicolon = pendingSemicolon || hadSemicolon;
            continue;
          }

          const appendSemicolon = !segHasSemicolon && (hadSemicolon || pendingSemicolon);
          const text = lineIndent + seg + (appendSemicolon ? ';' : '');
          segments.push(text);
          pendingSemicolon = false;
        }

        // If there was trailing punctuation/empties with semicolons, attach one to the last segment
        if (pendingSemicolon && segments.length > 0 && !segments[segments.length - 1].trimEnd().endsWith(';')) {
          segments[segments.length - 1] = segments[segments.length - 1] + ';';
        }

        if (commentPart && segments.length > 0) {
          const last = segments.length - 1;
          const spacer = segments[last].endsWith(' ') ? '' : ' ';
          segments[last] = segments[last] + spacer + commentPart;
        }

        // Final cleanup: collapse any accidental multiple semicolons that may remain
        for (let i = 0; i < segments.length; i++) {
          segments[i] = segments[i].replace(/;{2,}/g, ';');
        }

        // Always return split segments when we produced more than one, otherwise keep as-is
        if (segments.length <= 1) {
          return segments;
        }

        return segments;
      };

      const linesToProcess: string[] = [];
      let splitOccurred = false;
      for (let i = 0; i < lineCount; i++) {
        const original = document.lineAt(i).text;
        const trimmedUpper = original.trimStart().toUpperCase();
        if (trimmedUpper.startsWith('**FREE')) {
          // Drop the marker; keep any trailing code after **FREE
          const idx = original.toUpperCase().indexOf('**FREE');
          const after = original.slice(idx + 6).trimStart();
          if (after.length === 0) {
            continue;
          }
          const segments = splitStatements(after);
          const filtered: string[] = [];
          for (const seg of segments) {
            const segUpper = seg.trimStart().toUpperCase();
            if (segUpper.startsWith('**FREE')) {
              splitOccurred = true;
              continue;
            }
            filtered.push(seg);
          }
          if (filtered.length !== segments.length || segments.length > 1 || segments[0] !== after) {
            splitOccurred = true;
          }
          linesToProcess.push(...filtered);
          continue;
        }
        const segments = splitStatements(original);
        const filtered: string[] = [];
        for (const seg of segments) {
          const segUpper = seg.trimStart().toUpperCase();
          if (segUpper.startsWith('**FREE')) {
            splitOccurred = true;
            continue; // drop duplicate **FREE markers even if inline after split
          }
          filtered.push(seg);
        }
        if (filtered.length !== segments.length || segments.length > 1 || segments[0] !== original) {
          splitOccurred = true;
        }
        linesToProcess.push(...filtered);
      }

      // Build result lines
      let resultLines: string[] = [];
      let anyChanged = false;
      let indentLevel = 0;
      let procDepth = 0;

      // First line (**FREE)
      resultLines.push(normalizedFree);
      if (normalizedFree !== firstLineText) {
        anyChanged = true;
      }

      for (const original of linesToProcess) {

        // Already handled line 0 (**FREE)

        const trimmed = original.trim();

        if (trimmed === ';') {
          // Attach stray semicolons to the previous code line (non-comment), only if it
          // doesn't already end with a semicolon. Skip empty and comment-only lines.
          let attached = false;
          for (let back = resultLines.length - 1; back >= 0; back--) {
            const candidate = resultLines[back];
            if (candidate.trim().length === 0) {
              continue;
            }
            const candidateTrimStart = candidate.trimStart();
            if (candidateTrimStart.startsWith('//')) {
              continue;
            }
            const commentIdx = candidate.indexOf('//');
            const codePart = commentIdx >= 0 ? candidate.substring(0, commentIdx) : candidate;
            const suffix = commentIdx >= 0 ? candidate.substring(commentIdx) : '';
            const trimmedCode = codePart.trimEnd();
            if (trimmedCode.endsWith(';')) {
              // Already has a semicolon; nothing to attach
              attached = true;
              break;
            }
            resultLines[back] = trimmedCode + ';' + suffix;
            attached = true;
            anyChanged = true;
            break;
          }
          if (attached) {
            continue;
          }
          // If no previous line, just keep as-is
          resultLines.push(original);
          anyChanged = true;
          continue;
        }

        if (original.trim().length === 0) {
          // keep empty lines unchanged
          resultLines.push(original);
          continue;
        }

        const upper = trimmed.toUpperCase();

        const isCloser = startsWithKeyword(upper, closers);
        const isMid = startsWithKeyword(upper, midKeywords);
        const isOpener = startsWithKeyword(upper, openers);
        const isProcStart = upper.startsWith('DCL-PROC');
        const isProcEnd = upper.startsWith('END-PROC') || upper.startsWith('ENDPROC');

        // Apply dedent for closers/mid before computing target indent for this line
        if (isCloser || isMid) {
          const allowDedent = !(isProcEnd && procDepth === 0);
          if (allowDedent) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          if (isProcEnd && procDepth > 0) {
            procDepth -= 1;
          }
        }

        const currentIndent = countLeadingSpaces(original);
        const effectiveTarget = targetBaseIndent + indentLevel * blockIndent;
        let newText: string;

        if (currentIndent < effectiveTarget) {
          const add = effectiveTarget - currentIndent;
          newText = ' '.repeat(add) + original;
        } else if (currentIndent > effectiveTarget) {
          const remove = currentIndent - effectiveTarget;
          newText = original.substring(remove);
        } else {
          newText = original;
        }

        resultLines.push(newText);
        if (newText !== original) {
          anyChanged = true;
        }

        // Apply indent increase for following lines after this opener/mid
        if (isMid) {
          indentLevel += 1;
        }
        if (isOpener) {
          indentLevel += 1;
          if (isProcStart) {
            procDepth += 1;
          }
        }
      }

      // Remove excess blank lines before closers and collapse duplicate blanks
      const isBlank = (text: string) => text.trim().length === 0;
      const isCloserLine = (text: string) => startsWithKeyword(text.trim().toUpperCase(), closers);

      const compacted: string[] = [];
      for (let i = 0; i < resultLines.length; i++) {
        const line = resultLines[i];
        if (isBlank(line)) {
          // Look ahead to the next non-blank line
          let k = i + 1;
          while (k < resultLines.length && isBlank(resultLines[k])) {
            k++;
          }
          const hasFollowing = k < resultLines.length;
          if (!hasFollowing) {
            // Trailing blanks are trimmed below; skip here
            continue;
          }
          const nextLine = resultLines[k];
          if (isCloserLine(nextLine)) {
            // Drop blanks directly before closers like END-PROC/ENDIF/END-SELECT/etc.
            anyChanged = true;
            continue;
          }
          if (compacted.length > 0 && isBlank(compacted[compacted.length - 1])) {
            // Collapse multiple blank lines into one
            anyChanged = true;
            continue;
          }
        }
        compacted.push(line);
      }
      resultLines = compacted;

      // Trim trailing blank lines (lines that are empty or whitespace only)
      let trimmedTrailing = false;
      while (resultLines.length > 0 && resultLines[resultLines.length - 1].trim().length === 0) {
        resultLines.pop();
        trimmedTrailing = true;
      }
      if (trimmedTrailing) {
        anyChanged = true;
      }

      if (!anyChanged && !freeNeedsTrim && !splitOccurred) {
        return [];
      }

      const first = document.lineAt(0);
      const last = document.lineAt(lineCount - 1);
      const fullRange = new vscode.Range(first.range.start, last.range.end);

      return [vscode.TextEdit.replace(fullRange, resultLines.join('\n'))];
    }
  };

  const patterns = [
    '**/*.rpgle',
    '**/*.sqlrpgle',
    '**/*.rpg',
    '**/*.sqlrpg',
    '**/*.rpginc',
    '**/*.rpgleinc'
  ];

  const languageIds = ['rpgle', 'sqlrpgle', 'rpg', 'sqlrpg', 'rpginc', 'rpgleinc'];

  // Support both saved files (pattern) and untitled buffers by language id
  const selectors: vscode.DocumentSelector = [
    ...patterns.map((pattern) => ({ pattern })),
    ...languageIds.map((language) => ({ language, scheme: 'file' })),
    ...languageIds.map((language) => ({ language, scheme: 'untitled' }))
  ];

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selectors, provider)
  );
}

export function deactivate() { }
