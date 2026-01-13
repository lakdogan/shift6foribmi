import { Shift6Config } from '../config';
import { initContinuationState } from './continuations';
import { initFormatContext } from './context';
import { normalizeMultilineStringLiterals } from './preprocess/normalize-multiline';
import { normalizeExecSqlBlocks } from './preprocess/exec-sql';
import { processSegment } from './preprocess/process-segment';
import { splitStatements } from './preprocess/split-statements';
import { findCommentIndexOutsideStrings } from './utils/string-scan';

export interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
}

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
        const paramSegments =
          cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
            ? splitProcedureParameterClosing(s)
            : [s];
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
      continue;
    }

    const segments = splitStatements(original);
    for (const seg of segments) {
      const paramSegments =
        cfg.alignProcedureCallParameters && ctx.execSqlDepth === 0
          ? splitProcedureParameterClosing(seg)
          : [seg];
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
