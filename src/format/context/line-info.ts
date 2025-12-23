import { tokenizeLine } from '../tokenize';

export interface LineInfo {
  original: string;
  trimmed: string;
  upper: string;
  upperNoComment: string;
  tokens: ReturnType<typeof tokenizeLine>['tokens'];
  keywordTokens: string[];
  leadingKeyword: string | null;
  isCommentOnly: boolean;
}

// Tokenize a line and derive helper metadata for rule/context decisions.
export function buildLineInfo(line: string): LineInfo {
  const trimmed = line.trim();
  const upper = trimmed.toUpperCase();
  const tokenResult = tokenizeLine(line);
  const commentIndex = tokenResult.commentIndex;
  const upperNoComment =
    commentIndex === null ? line.toUpperCase() : line.slice(0, commentIndex).toUpperCase();

  const keywordTokens = tokenResult.tokens
    .filter((t) => t.type === 'word')
    .map((t) => t.value.toUpperCase());
  const leadingKeyword = keywordTokens.length > 0 ? keywordTokens[0] : null;
  const isCommentOnly =
    trimmed.length === 0 || (trimmed.startsWith('//') && trimmed.length > 0);

  return {
    original: line,
    trimmed,
    upper,
    upperNoComment,
    tokens: tokenResult.tokens,
    keywordTokens,
    leadingKeyword,
    isCommentOnly
  };
}
