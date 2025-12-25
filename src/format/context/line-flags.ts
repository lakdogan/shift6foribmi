import { CLOSERS, MID_KEYWORDS, OPENERS } from '../../constants';
import { containsKeywordToken, startsWithKeyword } from '../utils';
import { LineFlags } from './types';
import { LineInfo } from './line-info';

const getLastSignificantToken = (
  info: LineInfo
): { type: string; value: string } | null => {
  for (let i = info.tokens.length - 1; i >= 0; i--) {
    const token = info.tokens[i];
    if (token.type === 'whitespace' || token.type === 'comment') continue;
    return token;
  }
  return null;
};

// Derive structural flags (openers/closers/mids) from tokenized line info.
export function getLineFlags(info: LineInfo): LineFlags {
  const upper = info.upper;
  const upperNoComment = info.upperNoComment;
  const leading = info.leadingKeyword ?? '';

  const isCloser =
    (leading.length > 0 && CLOSERS.includes(leading)) || startsWithKeyword(upper, CLOSERS);
  const isMid =
    (leading.length > 0 && MID_KEYWORDS.includes(leading)) || startsWithKeyword(upper, MID_KEYWORDS);
  const isOpener =
    (leading.length > 0 && OPENERS.includes(leading)) || startsWithKeyword(upper, OPENERS);
  const isProcStart = upper.startsWith('DCL-PROC');
  const isProcEnd = upper.startsWith('END-PROC') || upper.startsWith('ENDPROC');
  const hasInlineCloser = containsKeywordToken(upperNoComment, CLOSERS);
  const isInlineDclDs =
    upper.startsWith('DCL-DS') &&
    info.trimmed.endsWith(';') &&
    !containsKeywordToken(upperNoComment, ['END-DS', 'ENDDS']) &&
    /\b(LIKEDS|EXTNAME)\b/i.test(upperNoComment);
  const lastToken = getLastSignificantToken(info);
  const endsStatement =
    !info.isCommentOnly &&
    Boolean(lastToken && lastToken.type === 'punctuation' && lastToken.value === ';');
  const endsWithAssignment =
    !info.isCommentOnly &&
    Boolean(lastToken && lastToken.type === 'operator' && lastToken.value === '=');

  return {
    isCloser,
    isMid,
    isOpener,
    isProcStart,
    isProcEnd,
    hasInlineCloser,
    isInlineDclDs,
    isCommentOnly: info.isCommentOnly,
    endsStatement,
    endsWithAssignment
  };
}
