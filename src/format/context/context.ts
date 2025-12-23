import { LineFlags, FormatContext } from './types';

// Initialize per-document formatting context for indentation and continuations.
export function initFormatContext(): FormatContext {
  return {
    indentLevel: 0,
    procDepth: 0,
    continuationOperatorColumn: null
  };
}

// Update context prior to formatting a line based on closers and mids.
export function updateContextBeforeLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;

  if (flags.isCloser || flags.isMid) {
    if (!(flags.isProcEnd && procDepth === 0)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    if (flags.isProcEnd && procDepth > 0) {
      procDepth--;
    }
  }

  return {
    ...ctx,
    indentLevel,
    procDepth
  };
}

// Update context after formatting a line based on openers and mids.
export function updateContextAfterLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;

  if (flags.isMid) {
    indentLevel++;
  }
  if (flags.isOpener) {
    if (!flags.hasInlineCloser && !flags.isInlineDclDs) {
      indentLevel++;
      if (flags.isProcStart) {
        procDepth++;
      }
    }
  }

  return {
    ...ctx,
    indentLevel,
    procDepth
  };
}
