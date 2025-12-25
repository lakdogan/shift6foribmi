import type { Shift6Config } from '../../../config';
import {
  findFirstSpacedBinaryOperatorAfterLimit,
  findLastSpacedBinaryOperatorBeforeLimit,
  findSpacedBinaryOperatorColumn,
  normalizeOperatorSpacing
} from '../../operators';
import { getEffectiveColumnLimit } from '../support/column-limit';
import { wrapConcatenatedLine } from '../support/concat-wrap';
import { splitBooleanAssignmentLine } from '../support/logical-split';
import { hasTrailingPlusOutsideStrings } from '../../utils/string-scan';
import type { ContinuationState } from '../support/types';

// Split long binary-operator lines across continuation lines within column limits.
export function wrapLongLine(
  seg: string,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number
): { producedLines: string[]; state: ContinuationState; splitOccurred: boolean } {
  const producedLines: string[] = [];
  let splitOccurred = false;

  let normalized = normalizeOperatorSpacing(seg, cfg);
  const booleanSplit = splitBooleanAssignmentLine(normalized);
  if (booleanSplit) {
    return { producedLines: booleanSplit, state, splitOccurred: true };
  }
  const continuationColumnLimit = getEffectiveColumnLimit(normalized, targetIndent, cfg);

  const wrappedConcat = wrapConcatenatedLine(
    normalized,
    continuationColumnLimit,
    cfg.wrapLongStrings,
    cfg.concatStyle
  );
  if (wrappedConcat) {
    const lastWrapped = wrappedConcat[wrappedConcat.length - 1];
    if (lastWrapped && hasTrailingPlusOutsideStrings(lastWrapped)) {
      wrappedConcat.pop();
      producedLines.push(...wrappedConcat);
      state.pendingContinuation = lastWrapped;
      state.continuationIndent = lastWrapped.match(/^(\s*)/)?.[1] ?? '';
      state.pendingTargetIndent = targetIndent;
      return { producedLines, state, splitOccurred: true };
    }
    return { producedLines: wrappedConcat, state, splitOccurred: true };
  }
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
    if (hasTrailingPlusOutsideStrings(normalized)) {
      state.pendingContinuation = normalized;
      state.pendingTargetIndent = targetIndent;
      return { producedLines, state, splitOccurred };
    }
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
      state.pendingTargetIndent = targetIndent;
      splitOccurred = true;
      return { producedLines, state, splitOccurred };
    }
  }

  producedLines.push(seg);
  return { producedLines, state, splitOccurred };
}
