export interface LineFlags {
  isCloser: boolean;
  isMid: boolean;
  isOpener: boolean;
  isProcStart: boolean;
  isProcEnd: boolean;
  isExecSqlStart: boolean;
  isExecSqlEnd: boolean;
  execSqlBlockDelta: number;
  isMultilineStringContinuation: boolean;
  hasInlineCloser: boolean;
  isCommentOnly: boolean;
  endsStatement: boolean;
  endsWithAssignment: boolean;
  statementContinuationOffset: number | null;
}

export interface ParamAlignState {
  parenColumn: number;
  colonColumn: number | null;
}

export interface FormatContext {
  indentLevel: number;
  procDepth: number;
  execSqlDepth: number;
  execSqlBlockDepth: number;
  continuationOperatorColumn: number | null;
  pendingAssignmentContinuation: boolean;
  pendingStatementContinuationOffset: number | null;
  paramAlignStack: ParamAlignState[];
}
