export interface Shift6Config {
  spaces: number;
  targetBaseIndent: number;
  blockIndent: number;
  normalizedFree: string;
  collapseTokenSpaces: boolean;
  trimStringParentheses: boolean;
  alignPlusContinuation: boolean;
  alignProcedureCallParameters: boolean;
  continuationColumn: number;
  joinAsteriskTokensInDecl: boolean;
  wrapLongStrings: boolean;
  fixMultilineStringLiterals: boolean;
  concatStyle: 'compact' | 'one-per-line' | 'fill';
}
