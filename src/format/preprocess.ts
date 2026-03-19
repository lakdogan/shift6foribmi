import { Shift6Config } from '../config';
import { initContinuationState } from './continuations';
import { initFormatContext } from './context';
import { normalizeMultilineStringLiterals } from './preprocess/normalize-multiline';
import { normalizeExecSqlBlocks } from './preprocess/exec-sql';
import { normalizeEmptyDclDsBlocks } from './preprocess/normalize-empty-dcl-ds';
import { processSegment } from './preprocess/process-segment';
import { splitStatements } from './preprocess/split-statements';
import { findCommentIndexOutsideStrings, scanOutsideStrings } from './utils/string-scan';

export interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
}

interface IndexedLine {
  index: number;
  line: string;
  normalized: string;
}

interface MappedOutputLine {
  sourceIndex: number | null;
  line: string;
  normalized: string;
}

const isEmptyStringInitLine = (line: string): boolean =>
  /^\s*(?!\/\/)(?:dcl-[a-z-]+\b|[A-Za-z_@$#%][\w@$#%]*)\b[^=]*\binz\s*\(\s*''\s*\)\s*;\s*(?:\/\/.*)?$/i.test(
    line
  );

const normalizeComparableLine = (line: string): string => line.trim().replace(/\s+/g, ' ').toLowerCase();

const mapOutputLinesToSource = (
  sourceLines: IndexedLine[],
  outputLines: string[]
): MappedOutputLine[] => {
  const usedSourceIndices = new Set<number>();
  const mapped: MappedOutputLine[] = [];
  let sourceCursor = 0;

  for (const line of outputLines) {
    const normalized = normalizeComparableLine(line);
    let matchedSourceIndex: number | null = null;

    for (let i = sourceCursor; i < sourceLines.length; i++) {
      if (usedSourceIndices.has(i)) continue;
      if (sourceLines[i].normalized !== normalized) continue;
      matchedSourceIndex = i;
      sourceCursor = i + 1;
      break;
    }

    if (matchedSourceIndex === null) {
      for (let i = 0; i < sourceCursor; i++) {
        if (usedSourceIndices.has(i)) continue;
        if (sourceLines[i].normalized !== normalized) continue;
        matchedSourceIndex = i;
        break;
      }
    }

    if (matchedSourceIndex !== null) {
      usedSourceIndices.add(matchedSourceIndex);
    }

    mapped.push({
      sourceIndex: matchedSourceIndex,
      line,
      normalized
    });
  }

  return mapped;
};

export const restoreDroppedEmptyStringInitLines = (
  sourceLines: string[],
  outputLines: string[]
): { lines: string[]; restored: boolean } => {
  const indexed: IndexedLine[] = sourceLines.map((line, index) => ({
    index,
    line,
    normalized: normalizeComparableLine(line)
  }));
  const candidates = indexed.filter((entry) => isEmptyStringInitLine(entry.line));
  if (candidates.length === 0) return { lines: outputLines, restored: false };

  const out = mapOutputLinesToSource(indexed, outputLines);
  const findOutIndexBySource = (sourceIndex: number): number =>
    out.findIndex((entry) => entry.sourceIndex === sourceIndex);
  let restored = false;

  for (const candidate of candidates) {
    if (findOutIndexBySource(candidate.index) >= 0) continue;

    let insertAt = -1;

    for (let i = candidate.index + 1; i < indexed.length; i++) {
      const next = indexed[i];
      if (next.normalized.length === 0) continue;
      const outIndex = findOutIndexBySource(next.index);
      if (outIndex >= 0) {
        insertAt = outIndex;
        break;
      }
    }

    if (insertAt < 0) {
      for (let i = candidate.index - 1; i >= 0; i--) {
        const prev = indexed[i];
        if (prev.normalized.length === 0) continue;
        const outIndex = findOutIndexBySource(prev.index);
        if (outIndex >= 0) {
          insertAt = outIndex + 1;
          break;
        }
      }
    }

    if (insertAt < 0) {
      insertAt = out.length > 0 && out[0].line.trim().toLowerCase() === '**free' ? 1 : 0;
    }

    out.splice(insertAt, 0, {
      sourceIndex: candidate.index,
      line: candidate.line,
      normalized: candidate.normalized
    });
    restored = true;
  }

  return { lines: out.map((entry) => entry.line), restored };
};

const splitProcedureParameterClosing = (seg: string): string[] => {
  const trimmedStart = seg.trimStart();
  if (!trimmedStart.startsWith(':')) return [seg];

  const commentIndex = findCommentIndexOutsideStrings(seg);
  const codePart = commentIndex >= 0 ? seg.substring(0, commentIndex) : seg;
  const commentPart = commentIndex >= 0 ? seg.substring(commentIndex).trimStart() : '';
  const codeTrimmed = codePart.trimEnd();

  if (!/\)\s*;$/.test(codeTrimmed)) return [seg];

  const closeIndex = codeTrimmed.lastIndexOf(')');
  const before = codeTrimmed.slice(0, closeIndex).trimEnd();
  if (before.trim().length === 0) return [seg];

  const indent = seg.match(/^\s*/)?.[0] ?? '';
  const spacer = commentPart ? ' ' : '';
  const closeLine = indent + ');' + spacer + commentPart;

  return [before, closeLine];
};

const splitProcedureCallParameters = (seg: string): string[] => {
  const trimmedStart = seg.trimStart();
  if (trimmedStart.startsWith('//') || trimmedStart.startsWith(':')) return [seg];

  const commentIndex = findCommentIndexOutsideStrings(seg);
  const codePart = commentIndex >= 0 ? seg.substring(0, commentIndex) : seg;
  const commentPart = commentIndex >= 0 ? seg.substring(commentIndex) : '';
  if (!codePart.includes(':') || !codePart.includes('(')) return [seg];

  let parenDepth = 0;
  let activeParenIndex = -1;
  let targetParenIndex = -1;
  let closeParenIndex = -1;
  const colonPositions: number[] = [];
  const parenIndices = new Set<number>();

  scanOutsideStrings(codePart, (ch, index) => {
    if (ch === '(') {
      parenDepth++;
      if (parenDepth === 1) {
        activeParenIndex = index;
      }
      return;
    }
    if (ch === ')') {
      if (parenDepth === 1 && activeParenIndex === targetParenIndex && closeParenIndex < 0) {
        closeParenIndex = index;
      }
      parenDepth = Math.max(0, parenDepth - 1);
      if (parenDepth === 0) {
        activeParenIndex = -1;
      }
      return;
    }
    if (ch === ':' && parenDepth === 1 && activeParenIndex >= 0) {
      colonPositions.push(index);
      parenIndices.add(activeParenIndex);
      if (targetParenIndex < 0) {
        targetParenIndex = activeParenIndex;
      }
    }
  });

  if (colonPositions.length === 0) return [seg];
  if (parenIndices.size !== 1 || targetParenIndex < 0 || closeParenIndex < 0) return [seg];

  const beforeParen = codePart.slice(0, targetParenIndex);
  const nameMatch = beforeParen.match(/([A-Za-z0-9_@$#%]+)\s*$/);
  if (nameMatch && nameMatch[1].startsWith('%')) return [seg];

  const tail = codePart.slice(closeParenIndex + 1).trim();
  if (tail.length > 0 && tail !== ';') return [seg];

  const splitPoints = colonPositions.filter(
    (pos) => pos > targetParenIndex && pos < closeParenIndex
  );
  if (splitPoints.length === 0) return [seg];

  const lineIndent = seg.match(/^ */)?.[0] ?? '';
  const segments: string[] = [];
  let start = 0;
  for (const pos of splitPoints) {
    const piece = codePart.slice(start, pos).trimEnd();
    if (piece.trim().length > 0) {
      segments.push(lineIndent + piece.trim());
    }
    start = pos;
  }
  const tailPiece = codePart.slice(start).trimEnd();
  if (tailPiece.trim().length > 0) {
    segments.push(lineIndent + tailPiece.trimStart());
  }

  if (commentPart && segments.length > 0) {
    const last = segments.length - 1;
    const spacer = segments[last].endsWith(' ') ? '' : ' ';
    segments[last] += spacer + commentPart;
  }

  return segments.length > 1 ? segments : [seg];
};

// Normalize **FREE, split inline statements, and prepare lines for formatting.
export function preprocessDocument(lines: string[], cfg: Shift6Config): PreprocessResult {
  let workingLines = lines;
  let splitOccurred = false;
  if (cfg.fixMultilineStringLiterals) {
    const normalized = normalizeMultilineStringLiterals(lines);
    workingLines = normalized.lines;
    splitOccurred = normalized.changed;
  }

  const execSqlNormalized = normalizeExecSqlBlocks(workingLines, cfg);
  workingLines = execSqlNormalized.lines;
  if (execSqlNormalized.changed) splitOccurred = true;

  const emptyDclDsNormalized = normalizeEmptyDclDsBlocks(workingLines);
  workingLines = emptyDclDsNormalized.lines;
  if (emptyDclDsNormalized.changed) splitOccurred = true;

  const lineCount = workingLines.length;
  const firstLineText = lineCount > 0 ? workingLines[0] : '';
  const freeNeedsTrim = firstLineText.trim().toLowerCase() !== cfg.normalizedFree;

  const linesToProcess: string[] = [];
  let localSplitOccurred = false;
  let continuationState = initContinuationState();
  let ctx = initFormatContext();

  for (let i = 0; i < lineCount; i++) {
    const original = workingLines[i];
    const upper = original.trimStart().toUpperCase();

    if (upper.startsWith('**FREE')) {
      const after = original.slice(original.toUpperCase().indexOf('**FREE') + 6).trimStart();
      if (after.length === 0) continue;

      const segments = splitStatements(after);
      for (const s of segments) {
        const procedureSegments =
          cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
            ? splitProcedureCallParameters(s)
            : [s];
        if (procedureSegments.length > 1) localSplitOccurred = true;
        for (const procedureSeg of procedureSegments) {
          const paramSegments =
            cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
              ? splitProcedureParameterClosing(procedureSeg)
              : [procedureSeg];
          if (paramSegments.length > 1) localSplitOccurred = true;
          for (const seg of paramSegments) {
            if (seg.trimStart().toUpperCase().startsWith('**FREE')) {
              localSplitOccurred = true;
              continue;
            }
            const result = processSegment(seg, i, lineCount, ctx, continuationState, cfg);
            if (result.producedLines.length > 0) {
              linesToProcess.push(...result.producedLines);
            }
            if (result.splitOccurred) localSplitOccurred = true;
            ctx = result.ctx;
            continuationState = result.continuationState;
          }
        }
      }
      continue;
    }

    const segments = splitStatements(original);
    for (const seg of segments) {
      const procedureSegments =
        cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
          ? splitProcedureCallParameters(seg)
          : [seg];
      if (procedureSegments.length > 1) localSplitOccurred = true;
      for (const procedureSeg of procedureSegments) {
        const paramSegments =
          cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
            ? splitProcedureParameterClosing(procedureSeg)
            : [procedureSeg];
        if (paramSegments.length > 1) localSplitOccurred = true;
        for (const part of paramSegments) {
          if (part.trimStart().toUpperCase().startsWith('**FREE')) {
            localSplitOccurred = true;
            continue;
          }
          const result = processSegment(part, i, lineCount, ctx, continuationState, cfg);
          if (result.producedLines.length > 0) {
            linesToProcess.push(...result.producedLines);
          }
          if (result.splitOccurred) localSplitOccurred = true;
          ctx = result.ctx;
          continuationState = result.continuationState;
        }
      }
    }
  }

  if (continuationState.pendingContinuation !== null) {
    linesToProcess.push(continuationState.pendingContinuation);
  }

  const restoredDecls = restoreDroppedEmptyStringInitLines(workingLines, linesToProcess);
  if (restoredDecls.restored) {
    localSplitOccurred = true;
  }

  return {
    linesToProcess: restoredDecls.lines,
    freeNeedsTrim,
    splitOccurred: splitOccurred || localSplitOccurred,
    firstLineText,
    lineCount
  };
}
