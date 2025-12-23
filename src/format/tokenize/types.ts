export type TokenType =
  | 'word'
  | 'number'
  | 'operator'
  | 'string'
  | 'punctuation'
  | 'whitespace'
  | 'comment';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}
