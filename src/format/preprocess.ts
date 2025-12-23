import { Shift6Config } from '../config';
import {
  handleContinuationSegment,
  initContinuationState,
  wrapLongLine
} from './continuations';

export interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
}

// Split multi-statement lines on semicolons while preserving inline comments.
function splitStatements(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) return [line];

  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('//')) return [line];

  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const normalizedCode = codePart.replace(/;[ \t]*;+/g, ';');

  if (!normalizedCode.includes(';')) return [line];

  const lineIndent = line.match(/^ */)?.[0] ?? '';
  const pieces = normalizedCode.split(';');
  const endsWithSemicolon = normalizedCode.trimEnd().endsWith(';');
  const segments: string[] = [];
  let pendingSemicolon = false;

  for (let idx = 0; idx < pieces.length; idx++) {
    const seg = pieces[idx].trim();
    const punctuationOnly = /^[.,]+$/.test(seg);
    const hadSemicolon = idx < pieces.length - 1 || endsWithSemicolon;

    if (seg.length === 0 || punctuationOnly) {
      pendingSemicolon ||= hadSemicolon;
      continue;
    }

    const appendSemicolon = hadSemicolon || pendingSemicolon;
    segments.push(lineIndent + seg + (appendSemicolon ? ';' : ''));
    pendingSemicolon = false;
  }

  if (commentPart && segments.length > 0) {
    const last = segments.length - 1;
    const spacer = segments[last].endsWith(' ') ? '' : ' ';
    segments[last] += spacer + commentPart;
  }

  return segments.length <= 1 ? segments : segments;
}

// Normalize **FREE, split inline statements, and prepare lines for formatting.
export function preprocessDocument(lines: string[], cfg: Shift6Config): PreprocessResult {
  const lineCount = lines.length;
  const firstLineText = lineCount > 0 ? lines[0] : '';
  const freeNeedsTrim = firstLineText.trim().toLowerCase() !== cfg.normalizedFree;

  const linesToProcess: string[] = [];
  let splitOccurred = false;
  let continuationState = initContinuationState();

  for (let i = 0; i < lineCount; i++) {
    const original = lines[i];
    const upper = original.trimStart().toUpperCase();

    if (upper.startsWith('**FREE')) {
      const after = original.slice(original.toUpperCase().indexOf('**FREE') + 6).trimStart();
      if (after.length === 0) continue;

      const segments = splitStatements(after);
      for (const s of segments) {
        if (!s.trimStart().toUpperCase().startsWith('**FREE')) {
          linesToProcess.push(s);
        } else {
          splitOccurred = true;
        }
      }
      continue;
    }

    const segments = splitStatements(original);
    for (const seg of segments) {
      if (seg.trimStart().toUpperCase().startsWith('**FREE')) {
        splitOccurred = true;
        continue;
      }
      const handled = handleContinuationSegment(seg, i, lineCount, continuationState, cfg);
      if (handled.producedLines.length > 0) {
        linesToProcess.push(...handled.producedLines);
      }
      if (handled.splitOccurred) splitOccurred = true;
      continuationState = handled.state;
      if (handled.consumed) {
        continue;
      }

      const wrapped = wrapLongLine(seg, continuationState, cfg);
      if (wrapped.producedLines.length > 0) {
        linesToProcess.push(...wrapped.producedLines);
      }
      if (wrapped.splitOccurred) splitOccurred = true;
      continuationState = wrapped.state;
    }
  }

  if (continuationState.pendingContinuation !== null) {
    linesToProcess.push(continuationState.pendingContinuation);
  }

  return {
    linesToProcess,
    freeNeedsTrim,
    splitOccurred,
    firstLineText,
    lineCount
  };
}
