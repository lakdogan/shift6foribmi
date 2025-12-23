import { Shift6Config } from '../config';
import {
  findFirstSpacedBinaryOperatorAfterLimit,
  findLastSpacedBinaryOperatorBeforeLimit,
  findSpacedBinaryOperatorColumn,
  getLeadingOperator,
  normalizeOperatorSpacing
} from './operators';

interface ContinuationState {
  pendingContinuation: string | null;
  continuationIndent: string;
}

// Initialize continuation tracking for wrapped binary expressions.
export function initContinuationState(): ContinuationState {
  return { pendingContinuation: null, continuationIndent: '' };
}

interface HandleContinuationResult {
  consumed: boolean;
  producedLines: string[];
  state: ContinuationState;
  splitOccurred: boolean;
}

// Merge a continuation line into a pending long line when possible.
export function handleContinuationSegment(
  seg: string,
  lineIndex: number,
  lineCount: number,
  state: ContinuationState,
  cfg: Shift6Config
): HandleContinuationResult {
  let splitOccurred = false;
  const producedLines: string[] = [];
  const continuationColumnLimit = cfg.continuationColumn;

  if (state.pendingContinuation !== null) {
    const pending = state.pendingContinuation;
    const trimmedSeg = seg.trim();
    const leadingOp = getLeadingOperator(trimmedSeg);
    if (leadingOp) {
      const merged: string = pending + ' ' + leadingOp + ' ' + trimmedSeg.substring(1).trimStart();
      const recombined = normalizeOperatorSpacing(merged, cfg);
      if (recombined.length > continuationColumnLimit) {
        const lastOp = findLastSpacedBinaryOperatorBeforeLimit(recombined, continuationColumnLimit);
        const splitAt =
          lastOp !== null
            ? lastOp
            : findFirstSpacedBinaryOperatorAfterLimit(recombined, continuationColumnLimit);
        if (splitAt !== null && splitAt > 1) {
          const opChar = recombined[splitAt];
          const left = recombined.substring(0, splitAt - 1);
          if (left.trim().length === 0) {
            return { consumed: false, producedLines: [], state, splitOccurred };
          }
          const right = recombined.substring(splitAt + 2);
          producedLines.push(left);
          producedLines.push(state.continuationIndent + opChar + ' ' + right.trimStart());
          state.pendingContinuation = null;
          state.continuationIndent = '';
          splitOccurred = true;
          return { consumed: true, producedLines, state, splitOccurred };
        }
      }
      const opColumn = findSpacedBinaryOperatorColumn(recombined);
      if (opColumn !== null && opColumn >= continuationColumnLimit) {
        producedLines.push(pending);
        producedLines.push(state.continuationIndent + leadingOp + ' ' + trimmedSeg.substring(1).trimStart());
        state.pendingContinuation = null;
        state.continuationIndent = '';
        splitOccurred = true;
        return { consumed: true, producedLines, state, splitOccurred };
      }
      state.pendingContinuation = merged;
      if (lineIndex === lineCount - 1) {
        producedLines.push(state.pendingContinuation);
        state.pendingContinuation = null;
      }
      splitOccurred = true;
      return { consumed: true, producedLines, state, splitOccurred };
    }

    producedLines.push(pending);
    state.pendingContinuation = null;
    state.continuationIndent = '';
    return { consumed: false, producedLines, state, splitOccurred };
  }

  return { consumed: false, producedLines, state, splitOccurred };
}

// Split long binary-operator lines across continuation lines within column limits.
export function wrapLongLine(
  seg: string,
  state: ContinuationState,
  cfg: Shift6Config
): { producedLines: string[]; state: ContinuationState; splitOccurred: boolean } {
  const producedLines: string[] = [];
  let splitOccurred = false;
  const continuationColumnLimit = cfg.continuationColumn;

  let normalized = normalizeOperatorSpacing(seg, cfg);
  let didSplit = false;
  let splitIterations = 0;
  let prevLength = normalized.length;

  while (normalized.length > continuationColumnLimit) {
    splitIterations++;
    if (splitIterations > 200) break;

    const indentMatch = normalized.match(/^(\s*)/);
    state.continuationIndent = indentMatch ? indentMatch[1] : '';
    const lastOpBeforeLimit = findLastSpacedBinaryOperatorBeforeLimit(normalized, continuationColumnLimit);
    const splitAt =
      lastOpBeforeLimit !== null
        ? lastOpBeforeLimit
        : findFirstSpacedBinaryOperatorAfterLimit(normalized, continuationColumnLimit);
    if (splitAt !== null && splitAt > 1) {
      const opChar = normalized[splitAt];
      const left = normalized.substring(0, splitAt - 1);
      if (left.trim().length === 0) break;
      const right = normalized.substring(splitAt + 2);
      producedLines.push(left);
      normalized = state.continuationIndent + opChar + ' ' + right.trimStart();
      splitOccurred = true;
      didSplit = true;
      if (normalized.length >= prevLength) break;
      prevLength = normalized.length;
      continue;
    }
    break;
  }

  if (didSplit) {
    producedLines.push(normalized);
    return { producedLines, state, splitOccurred };
  }

  const opColumn = findSpacedBinaryOperatorColumn(normalized);
  if (opColumn !== null && opColumn >= continuationColumnLimit) {
    const indentMatch = normalized.match(/^(\s*)/);
    state.continuationIndent = indentMatch ? indentMatch[1] : '';
    const lastOpIndex = findLastSpacedBinaryOperatorBeforeLimit(normalized, normalized.length - 1);
    if (lastOpIndex !== null && lastOpIndex > 1) {
      const opChar = normalized[lastOpIndex];
      const left = normalized.substring(0, lastOpIndex - 1);
      const right = normalized.substring(lastOpIndex + 2);
      producedLines.push(left);
      state.pendingContinuation = state.continuationIndent + opChar + ' ' + right.trimStart();
      splitOccurred = true;
      return { producedLines, state, splitOccurred };
    }
  }

  producedLines.push(seg);
  return { producedLines, state, splitOccurred };
}
