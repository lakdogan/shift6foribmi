import type { Shift6Config } from '../../../../config';
import { normalizeOperatorSpacing } from '../../../operators';
import { getEffectiveColumnLimit } from '../../support/column-limit';
import {
  hasTrailingPlusOutsideStrings,
  lineEndsStatement,
  lineHasStringConcat,
  removeTrailingPlusOutsideStrings
} from '../../../utils/string-scan';
import type { ContinuationState } from '../../support/types';
import type { SplitAttempt } from './types';
import { clearPending } from './state';
import { tryWrapOrSplit } from './wrap-split';

// Handle a pending line followed by a string literal segment.
export const handleStringLiteralSegment = (
  seg: string,
  pending: string,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number,
  lineIndex: number,
  lineCount: number,
  producedLines: string[]
): SplitAttempt | 'none' => {
  const trimmedSeg = seg.trim();
  if (trimmedSeg.length === 0 || (trimmedSeg[0] !== '\'' && trimmedSeg[0] !== '"')) {
    return 'none';
  }

  if (hasTrailingPlusOutsideStrings(pending)) {
    const base = removeTrailingPlusOutsideStrings(pending);
    const merged = base + ' + ' + trimmedSeg;
    const recombined = normalizeOperatorSpacing(merged, cfg);
    const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
    const continuationColumnLimit = getEffectiveColumnLimit(
      recombined,
      pendingTargetIndent,
      cfg
    );

    const wrapSplitResult = tryWrapOrSplit(
      recombined,
      continuationColumnLimit,
      cfg,
      state,
      targetIndent,
      producedLines
    );
    if (wrapSplitResult === 'wrapped') return 'split';
    if (wrapSplitResult !== 'none') return wrapSplitResult;

    state.pendingContinuation = merged;
    state.pendingTargetIndent = targetIndent;
    if (lineIndex === lineCount - 1) {
      producedLines.push(state.pendingContinuation);
      clearPending(state);
    }
    return 'split';
  }

  if (!lineEndsStatement(pending) && lineHasStringConcat(pending)) {
    const merged = pending + ' + ' + trimmedSeg;
    const recombined = normalizeOperatorSpacing(merged, cfg);
    const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
    const continuationColumnLimit = getEffectiveColumnLimit(
      recombined,
      pendingTargetIndent,
      cfg
    );

    const wrapSplitResult = tryWrapOrSplit(
      recombined,
      continuationColumnLimit,
      cfg,
      state,
      targetIndent,
      producedLines
    );
    if (wrapSplitResult === 'wrapped') return 'split';
    if (wrapSplitResult !== 'none') return wrapSplitResult;

    state.pendingContinuation = merged;
    state.pendingTargetIndent = pendingTargetIndent;
    if (lineIndex === lineCount - 1) {
      producedLines.push(state.pendingContinuation);
      clearPending(state);
    }
    return 'split';
  }

  return 'none';
};
