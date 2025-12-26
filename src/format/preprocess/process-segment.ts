import type { Shift6Config } from '../../config';
import {
  buildLineInfo,
  getLineFlags,
  updateContextAfterLine,
  updateContextBeforeLine
} from '../context';
import type { FormatContext } from '../context/types';
import {
  handleContinuationSegment,
  wrapLongLine
} from '../continuations';
import type { ContinuationState } from '../continuations';

export interface SegmentProcessResult {
  producedLines: string[];
  splitOccurred: boolean;
  ctx: FormatContext;
  continuationState: ContinuationState;
}

// Process one segment and return updated context and continuation state.
export const processSegment = (
  seg: string,
  lineIndex: number,
  lineCount: number,
  ctx: FormatContext,
  continuationState: ContinuationState,
  cfg: Shift6Config
): SegmentProcessResult => {
  const info = buildLineInfo(seg);
  const flags = getLineFlags(info);
  const nextCtx = updateContextBeforeLine(ctx, flags);
  const targetIndent = cfg.targetBaseIndent + nextCtx.indentLevel * cfg.blockIndent;
  const producedLines: string[] = [];
  let splitOccurred = false;

  if (ctx.execSqlDepth > 0 || flags.isExecSqlStart) {
    producedLines.push(seg);
    const updatedCtx = updateContextAfterLine(nextCtx, flags);
    return {
      producedLines,
      splitOccurred,
      ctx: updatedCtx,
      continuationState
    };
  }

  const handled = handleContinuationSegment(
    seg,
    lineIndex,
    lineCount,
    continuationState,
    cfg,
    targetIndent
  );
  if (handled.producedLines.length > 0) {
    producedLines.push(...handled.producedLines);
  }
  if (handled.splitOccurred) splitOccurred = true;
  let nextContinuationState = handled.state;

  if (!handled.consumed) {
    const wrapped = wrapLongLine(seg, nextContinuationState, cfg, targetIndent);
    if (wrapped.producedLines.length > 0) {
      producedLines.push(...wrapped.producedLines);
    }
    if (wrapped.splitOccurred) splitOccurred = true;
    nextContinuationState = wrapped.state;
  }

  const updatedCtx = updateContextAfterLine(nextCtx, flags);

  return {
    producedLines,
    splitOccurred,
    ctx: updatedCtx,
    continuationState: nextContinuationState
  };
};
