export interface LineFlags {
  isCloser: boolean;
  isMid: boolean;
  isOpener: boolean;
  isProcStart: boolean;
  isProcEnd: boolean;
  hasInlineCloser: boolean;
  isInlineDclDs: boolean;
  isCommentOnly: boolean;
}

export interface FormatContext {
  indentLevel: number;
  procDepth: number;
  continuationOperatorColumn: number | null;
}
