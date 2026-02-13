import { LineFlags, FormatContext } from './types';

// Initialize per-document formatting context for indentation and continuations.
export function initFormatContext(): FormatContext {
  return {
    indentLevel: 0,
    procDepth: 0,
    execSqlDepth: 0,
    execSqlBlockDepth: 0,
    continuationOperatorColumn: null,
    pendingAssignmentContinuation: false,
    pendingStatementContinuationOffset: null,
    paramAlignStack: []
  };
}

// Update context prior to formatting a line based on closers and mids.
export function updateContextBeforeLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;
  let execSqlDepth = ctx.execSqlDepth;
  let execSqlBlockDepth = ctx.execSqlBlockDepth;

  if (flags.isMultilineStringContinuation) {
    return ctx;
  }

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
    execSqlDepth: flags.isExecSqlEnd ? Math.max(0, execSqlDepth - 1) : execSqlDepth,
    execSqlBlockDepth: flags.isExecSqlEnd ? 0 : execSqlBlockDepth
  };
}

// Update context after formatting a line based on openers and mids.
export function updateContextAfterLine(ctx: FormatContext, flags: LineFlags): FormatContext {
  let indentLevel = ctx.indentLevel;
  let procDepth = ctx.procDepth;
  let pendingAssignmentContinuation = ctx.pendingAssignmentContinuation;
  let pendingStatementContinuationOffset = ctx.pendingStatementContinuationOffset;
  let execSqlDepth = ctx.execSqlDepth;
  let execSqlBlockDepth = ctx.execSqlBlockDepth;

  if (flags.isMultilineStringContinuation) {
    return ctx;
  }

  if (execSqlDepth > 0) {
    execSqlBlockDepth = Math.max(0, execSqlBlockDepth + flags.execSqlBlockDelta);
    if (flags.isExecSqlEnd || (flags.endsStatement && execSqlBlockDepth === 0)) {
      execSqlDepth = Math.max(0, execSqlDepth - 1);
      if (execSqlDepth === 0) {
        execSqlBlockDepth = 0;
      }
    }
    return {
      ...ctx,
      execSqlDepth,
      execSqlBlockDepth
    };
  }

  if (flags.isMid) {
    indentLevel++;
  }
  if (flags.isOpener) {
    if (!flags.hasInlineCloser) {
      indentLevel++;
      if (flags.isProcStart) {
        procDepth++;
      }
    }
  }
  if (flags.isExecSqlStart && !flags.isExecSqlEnd && !flags.endsStatement) {
    execSqlDepth++;
    execSqlBlockDepth = 0;
  }

  return {
    ...ctx,
    indentLevel,
    procDepth,
    execSqlDepth,
    execSqlBlockDepth,
    pendingAssignmentContinuation: flags.endsStatement
      ? false
      : flags.endsWithAssignment
        ? true
        : pendingAssignmentContinuation,
    pendingStatementContinuationOffset: flags.endsStatement || flags.isExecSqlStart
      ? null
      : flags.endsWithAssignment
        ? pendingStatementContinuationOffset
        : pendingStatementContinuationOffset === null
          ? flags.statementContinuationOffset ?? null
          : pendingStatementContinuationOffset
  };
}
