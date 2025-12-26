import { LineFlags, FormatContext } from './types';

// Initialize per-document formatting context for indentation and continuations.
export function initFormatContext(): FormatContext {
  return {
    indentLevel: 0,
    procDepth: 0,
    execSqlDepth: 0,
    continuationOperatorColumn: null,
    pendingAssignmentContinuation: false
  };
}

// Update context prior to formatting a line based on closers and mids.
export function updateContextBeforeLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;
  let execSqlDepth = ctx.execSqlDepth;

  if (execSqlDepth > 0 && !flags.isExecSqlEnd) {
    return ctx;
  }

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
    procDepth,
    execSqlDepth: flags.isExecSqlEnd ? Math.max(0, execSqlDepth - 1) : execSqlDepth
  };
}

// Update context after formatting a line based on openers and mids.
export function updateContextAfterLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;
  let pendingAssignmentContinuation = ctx.pendingAssignmentContinuation;
  let execSqlDepth = ctx.execSqlDepth;

  if (execSqlDepth > 0) {
    return ctx;
  }

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
  if (flags.isExecSqlStart && !flags.isExecSqlEnd) {
    execSqlDepth++;
  }

  return {
    ...ctx,
    indentLevel,
    procDepth,
    execSqlDepth,
    pendingAssignmentContinuation: flags.endsStatement
      ? false
      : flags.endsWithAssignment
        ? true
        : pendingAssignmentContinuation
  };
}
