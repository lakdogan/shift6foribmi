import type { Shift6Config } from '../../../config';
import {
  flushPending,
  handleLeadingOperatorSegment,
  handleStringLiteralSegment,
  makeResult,
  tryStartPending
} from './handle-helpers';
import type { ContinuationState, HandleContinuationResult } from '../support/types';

// Merge a continuation line into a pending long line when possible.
export function handleContinuationSegment(
  seg: string,
  lineIndex: number,
  lineCount: number,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number
): HandleContinuationResult {
  let splitOccurred = false;
  const producedLines: string[] = [];

  if (state.pendingContinuation === null) {
    if (tryStartPending(seg, state, targetIndent)) {
      splitOccurred = true;
      return makeResult(true, producedLines, state, splitOccurred);
    }
  }

  if (state.pendingContinuation !== null) {
    const pending = state.pendingContinuation;
    const leadingOpResult = handleLeadingOperatorSegment(
      seg,
      pending,
      state,
      cfg,
      targetIndent,
      lineIndex,
      lineCount,
      producedLines
    );
    if (leadingOpResult !== 'none') {
      if (leadingOpResult === 'abort') {
        return makeResult(false, [], state, splitOccurred);
      }
      splitOccurred = true;
      return makeResult(true, producedLines, state, splitOccurred);
    }

    const stringResult = handleStringLiteralSegment(
      seg,
      pending,
      state,
      cfg,
      targetIndent,
      lineIndex,
      lineCount,
      producedLines
    );
    if (stringResult !== 'none') {
      if (stringResult === 'abort') {
        return makeResult(false, [], state, splitOccurred);
      }
      splitOccurred = true;
      return makeResult(true, producedLines, state, splitOccurred);
    }

    flushPending(pending, state, cfg, targetIndent, producedLines);
    return makeResult(false, producedLines, state, splitOccurred);
  }

  return makeResult(false, producedLines, state, splitOccurred);
}
