import type { ContinuationState, HandleContinuationResult } from '../../support/types';

// Create a typed result object for continuation handling.
export const makeResult = (
  consumed: boolean,
  producedLines: string[],
  state: ContinuationState,
  splitOccurred: boolean
): HandleContinuationResult => ({ consumed, producedLines, state, splitOccurred });
