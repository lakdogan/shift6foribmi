import type { Shift6Config } from '../../../../config';
import type { ContinuationState } from '../../support/types';
import type { SplitAttempt } from './types';
import { trySplitByOperator } from './split';
import { tryWrapConcatenation } from './wrap';

export type WrapSplitResult = SplitAttempt | 'wrapped' | 'none';

// Try wrapping concatenations, then fallback to splitting on operators.
export const tryWrapOrSplit = (
  recombined: string,
  columnLimit: number,
  cfg: Shift6Config,
  state: ContinuationState,
  targetIndent: number,
  producedLines: string[]
): WrapSplitResult => {
  if (
    tryWrapConcatenation(
      recombined,
      columnLimit,
      cfg,
      state,
      targetIndent,
      producedLines
    )
  ) {
    return 'wrapped';
  }
  const splitAttempt = trySplitByOperator(
    recombined,
    columnLimit,
    state,
    producedLines
  );
  return splitAttempt === 'none' ? 'none' : splitAttempt;
};
