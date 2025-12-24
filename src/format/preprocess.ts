import { Shift6Config } from '../config';
import {
  handleContinuationSegment,
  initContinuationState,
  wrapLongLine
} from './continuations';
import {
  buildLineInfo,
  getLineFlags,
  initFormatContext,
  updateContextAfterLine,
  updateContextBeforeLine
} from './context';

export interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
}

// Normalize multi-line string literals into explicit concatenations.
function normalizeMultilineStringLiterals(lines: string[]): { lines: string[]; changed: boolean } {
  const out: string[] = [];
  let inMultiline = false;
  let baseIndent = '';
  let prefix = '';
  let changed = false;

  const findUnclosedStringStart = (line: string): number | null => {
    let inString = false;
    let openIndex = -1;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (!inString) {
        if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
          break;
        }
        if (ch === '\'') {
          inString = true;
          openIndex = i;
        }
        continue;
      }
      if (ch === '\'') {
        if (i + 1 < line.length && line[i + 1] === '\'') {
          i++;
          continue;
        }
        inString = false;
        openIndex = -1;
      }
    }
    return inString ? openIndex : null;
  };

  const findClosingQuote = (line: string): number | null => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '\'') {
        if (i + 1 < line.length && line[i + 1] === '\'') {
          i++;
          continue;
        }
        return i;
      }
    }
    return null;
  };

  for (const line of lines) {
    if (!inMultiline) {
      const startIndex = findUnclosedStringStart(line);
      if (startIndex !== null) {
        const indentMatch = line.match(/^(\s*)/);
        baseIndent = indentMatch ? indentMatch[1] : '';
        prefix = line.slice(0, startIndex);
        const content = line.slice(startIndex + 1);
        out.push(prefix + '\'' + content + '\'');
        inMultiline = true;
        changed = true;
        continue;
      }
      out.push(line);
      continue;
    }

    const closingIndex = findClosingQuote(line);
    if (closingIndex === null) {
      out.push(baseIndent + '+ \'' + line + '\'');
      changed = true;
      continue;
    }

    const content = line.slice(0, closingIndex);
    const suffix = line.slice(closingIndex + 1);
    out.push(baseIndent + '+ \'' + content + '\'' + suffix);
    inMultiline = false;
    changed = true;
  }

  return { lines: out, changed };
}

// Split multi-statement lines on semicolons while preserving strings and inline comments.
function splitStatements(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) return [line];

  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('//')) return [line];

  let commentIndex = -1;
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }
    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      continue;
    }
    if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
      commentIndex = i;
      break;
    }
  }

  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  if (!codePart.includes(';')) return [line];

  const lineIndent = line.match(/^ */)?.[0] ?? '';
  const pieces: string[] = [];
  inString = false;
  quoteChar = '';
  let segmentStart = 0;

  for (let i = 0; i < codePart.length; i++) {
    const ch = codePart[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < codePart.length && codePart[i + 1] === quoteChar) {
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }
    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      continue;
    }
    if (ch === ';') {
      pieces.push(codePart.substring(segmentStart, i + 1));
      segmentStart = i + 1;
    }
  }
  if (segmentStart < codePart.length) {
    pieces.push(codePart.substring(segmentStart));
  }

  const segments: string[] = [];
  for (const piece of pieces) {
    const seg = piece.trim();
    const punctuationOnly = /^[.,]+$/.test(seg);
    if (seg.length === 0 || punctuationOnly) {
      continue;
    }
    segments.push(lineIndent + seg);
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
  let workingLines = lines;
  let splitOccurred = false;
  if (cfg.fixMultilineStringLiterals) {
    const normalized = normalizeMultilineStringLiterals(lines);
    workingLines = normalized.lines;
    splitOccurred = normalized.changed;
  }

  const lineCount = workingLines.length;
  const firstLineText = lineCount > 0 ? workingLines[0] : '';
  const freeNeedsTrim = firstLineText.trim().toLowerCase() !== cfg.normalizedFree;

  const linesToProcess: string[] = [];
  let localSplitOccurred = false;
  let continuationState = initContinuationState();
  let ctx = initFormatContext();

  const processSegment = (seg: string, lineIndex: number): void => {
    const info = buildLineInfo(seg);
    const flags = getLineFlags(info);
    ctx = updateContextBeforeLine(ctx, flags);
    const targetIndent = cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent;

    const handled = handleContinuationSegment(
      seg,
      lineIndex,
      lineCount,
      continuationState,
      cfg,
      targetIndent
    );
    if (handled.producedLines.length > 0) {
      linesToProcess.push(...handled.producedLines);
    }
    if (handled.splitOccurred) localSplitOccurred = true;
    continuationState = handled.state;
    if (!handled.consumed) {
      const wrapped = wrapLongLine(seg, continuationState, cfg, targetIndent);
      if (wrapped.producedLines.length > 0) {
        linesToProcess.push(...wrapped.producedLines);
      }
      if (wrapped.splitOccurred) localSplitOccurred = true;
      continuationState = wrapped.state;
    }

    ctx = updateContextAfterLine(ctx, flags);
  };

  for (let i = 0; i < lineCount; i++) {
    const original = workingLines[i];
    const upper = original.trimStart().toUpperCase();

    if (upper.startsWith('**FREE')) {
      const after = original.slice(original.toUpperCase().indexOf('**FREE') + 6).trimStart();
      if (after.length === 0) continue;

      const segments = splitStatements(after);
      for (const s of segments) {
        if (!s.trimStart().toUpperCase().startsWith('**FREE')) {
          processSegment(s, i);
        } else {
          localSplitOccurred = true;
        }
      }
      continue;
    }

    const segments = splitStatements(original);
    for (const seg of segments) {
      if (seg.trimStart().toUpperCase().startsWith('**FREE')) {
        localSplitOccurred = true;
        continue;
      }
      processSegment(seg, i);
    }
  }

  if (continuationState.pendingContinuation !== null) {
    linesToProcess.push(continuationState.pendingContinuation);
  }

  return {
    linesToProcess,
    freeNeedsTrim,
    splitOccurred: splitOccurred || localSplitOccurred,
    firstLineText,
    lineCount
  };
}
