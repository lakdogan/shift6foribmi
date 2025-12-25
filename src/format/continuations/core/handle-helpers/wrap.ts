import type { Shift6Config } from '../../../../config';
import { wrapConcatenatedLine } from '../../support/concat-wrap';
import { hasTrailingPlusOutsideStrings } from '../../support/string-scan';
import type { ContinuationState } from '../../support/types';
import { clearPending } from './state';

// Apply wrapped output and keep pending state if a trailing plus remains.
export const applyWrappedResult = (
  wrapped: string[],
  state: ContinuationState,
  targetIndent: number,
  producedLines: string[]
): void => {
  const lastWrapped = wrapped[wrapped.length - 1];
  if (lastWrapped && hasTrailingPlusOutsideStrings(lastWrapped)) {
    wrapped.pop();
    producedLines.push(...wrapped);
    state.pendingContinuation = lastWrapped;
    state.continuationIndent = lastWrapped.match(/^(\s*)/)?.[1] ?? '';
    state.pendingTargetIndent = targetIndent;
  } else {
    producedLines.push(...wrapped);
    clearPending(state);
  }
};

// Wrap concatenations when possible; return whether handling is complete.
export const tryWrapConcatenation = (
  recombined: string,
  columnLimit: number,
  cfg: Shift6Config,
  state: ContinuationState,
  targetIndent: number,
  producedLines: string[]
): boolean => {
  const wrapped = wrapConcatenatedLine(
    recombined,
    columnLimit,
    cfg.wrapLongStrings,
    cfg.concatStyle
  );
  if (!wrapped) return false;
  applyWrappedResult(wrapped, state, targetIndent, producedLines);
  return true;
};
