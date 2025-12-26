import { Shift6Config } from '../config';
import { initContinuationState } from './continuations';
import { initFormatContext } from './context';
import { normalizeMultilineStringLiterals } from './preprocess/normalize-multiline';
import { normalizeExecSqlBlocks } from './preprocess/exec-sql';
import { processSegment } from './preprocess/process-segment';
import { splitStatements } from './preprocess/split-statements';

export interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
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
        if (!s.trimStart().toUpperCase().startsWith('**FREE')) {
          const result = processSegment(s, i, lineCount, ctx, continuationState, cfg);
          if (result.producedLines.length > 0) {
            linesToProcess.push(...result.producedLines);
          }
          if (result.splitOccurred) localSplitOccurred = true;
          ctx = result.ctx;
          continuationState = result.continuationState;
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
      const result = processSegment(seg, i, lineCount, ctx, continuationState, cfg);
      if (result.producedLines.length > 0) {
        linesToProcess.push(...result.producedLines);
      }
      if (result.splitOccurred) localSplitOccurred = true;
      ctx = result.ctx;
      continuationState = result.continuationState;
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
