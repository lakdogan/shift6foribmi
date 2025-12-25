import type { ContinuationState } from '../../support/types';

// Initialize pending continuation fields from an incoming segment.
export const setPendingFromSegment = (
  state: ContinuationState,
  seg: string,
  targetIndent: number
): void => {
  state.pendingContinuation = seg;
  state.continuationIndent = seg.match(/^(\s*)/)?.[1] ?? '';
  state.pendingTargetIndent = targetIndent;
};

// Clear pending continuation tracking.
export const clearPending = (state: ContinuationState): void => {
  state.pendingContinuation = null;
  state.continuationIndent = '';
  state.pendingTargetIndent = null;
};
