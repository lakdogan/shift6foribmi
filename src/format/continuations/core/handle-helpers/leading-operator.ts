import type { Shift6Config } from '../../../../config';
import {
  findSpacedBinaryOperatorColumn,
  getLeadingOperator,
  normalizeOperatorSpacing
} from '../../../operators';
import { getEffectiveColumnLimit } from '../../support/column-limit';
import type { ContinuationState } from '../../support/types';
import type { SplitAttempt } from './types';
import { clearPending } from './state';
import { tryWrapOrSplit } from './wrap-split';

// Handle a pending line followed by a leading operator segment.
export const handleLeadingOperatorSegment = (
  seg: string,
  pending: string,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number,
  lineIndex: number,
  lineCount: number,
  producedLines: string[]
): SplitAttempt | 'handled' | 'none' => {
  const trimmedSeg = seg.trim();
  const leadingOp = getLeadingOperator(trimmedSeg);
  if (!leadingOp) return 'none';
  const merged: string = pending + ' ' + leadingOp + ' ' + trimmedSeg.substring(1).trimStart();
  const recombined = normalizeOperatorSpacing(merged, cfg);
  const continuationColumnLimit = getEffectiveColumnLimit(recombined, targetIndent, cfg);

  const wrapSplitResult = tryWrapOrSplit(
    recombined,
    continuationColumnLimit,
    cfg,
    state,
    targetIndent,
    producedLines
  );
  if (wrapSplitResult === 'wrapped') return 'handled';
  if (wrapSplitResult !== 'none') return wrapSplitResult;

  const opColumn = findSpacedBinaryOperatorColumn(recombined);
  if (opColumn !== null && opColumn >= continuationColumnLimit) {
    producedLines.push(pending);
    producedLines.push(state.continuationIndent + leadingOp + ' ' + trimmedSeg.substring(1).trimStart());
    clearPending(state);
    return 'handled';
  }

  state.pendingContinuation = merged;
  state.pendingTargetIndent = targetIndent;
  if (lineIndex === lineCount - 1) {
    producedLines.push(state.pendingContinuation);
    clearPending(state);
  }
  return 'handled';
};
