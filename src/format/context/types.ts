export interface LineFlags {
  isCloser: boolean;
  isMid: boolean;
  isOpener: boolean;
  isProcStart: boolean;
  isProcEnd: boolean;
  isExecSqlStart: boolean;
  isExecSqlEnd: boolean;
  hasInlineCloser: boolean;
  isCommentOnly: boolean;
  endsStatement: boolean;
  endsWithAssignment: boolean;
}

export interface ParamAlignState {
  parenColumn: number;
  colonColumn: number | null;
}

export interface FormatContext {
  indentLevel: number;
  procDepth: number;
  execSqlDepth: number;
  continuationOperatorColumn: number | null;
  pendingAssignmentContinuation: boolean;
  paramAlignStack: ParamAlignState[];
}
