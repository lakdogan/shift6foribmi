import type { ContinuationState } from '../support/types';

// Initialize continuation tracking for wrapped binary expressions.
export function initContinuationState(): ContinuationState {
  return { pendingContinuation: null, continuationIndent: '', pendingTargetIndent: null };
}
