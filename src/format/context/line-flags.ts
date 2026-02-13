import { CLOSERS, MID_KEYWORDS, OPENERS } from '../../constants';
import { containsKeywordToken, startsWithKeyword } from '../utils';
import { scanStringAware } from '../utils/string-scan';
import { LineFlags } from './types';
import { LineInfo } from './line-info';

const isWordChar = (ch: string): boolean => /[A-Z0-9_]/.test(ch);

const peekNextWords = (text: string, from: number, count: number): string[] => {
  const words: string[] = [];
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === quote) {
          if (i + 1 < text.length && text[i + 1] === quote) {
            i += 2;
            continue;
          }
          break;
        }
        i++;
      }
      continue;
    }
    if (isWordChar(ch)) {
      let j = i + 1;
      while (j < text.length && isWordChar(text[j])) j++;
      words.push(text.slice(i, j));
      i = j - 1;
      if (words.length >= count) return words;
    }
  }
  return words;
};

const getExecSqlBlockDelta = (text: string): number => {
  let delta = 0;
  let currentWord = '';
  const flushWord = (endIndex: number) => {
    if (!currentWord) return;
    if (currentWord === 'BEGIN') {
      const [nextWord, nextNext] = peekNextWords(text, endIndex, 2);
      if (!(nextWord === 'DECLARE' && nextNext === 'SECTION')) {
        delta++;
      }
    } else if (currentWord === 'END') {
      const [nextWord] = peekNextWords(text, endIndex, 1);
      if (!nextWord || !['IF', 'CASE', 'LOOP', 'FOR', 'WHILE', 'REPEAT'].includes(nextWord)) {
        delta--;
      }
    }
    currentWord = '';
  };

  scanStringAware(text, (ch, index) => {
    if (isWordChar(ch)) {
      currentWord += ch;
      return;
    }
    if (currentWord) {
      flushWord(index);
    }
  });

  if (currentWord) {
    flushWord(text.length);
  }

  return delta;
};

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

const getStatementContinuationOffset = (info: LineInfo): number | null => {
  if (info.isCommentOnly) return null;
  const trimmedStart = info.original.trimStart();
  if (trimmedStart.length === 0 || trimmedStart.startsWith('//')) return null;

  const tokens = info.tokens;
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.type !== 'whitespace' && token.type !== 'comment') break;
    index++;
  }
  if (index >= tokens.length) return null;
  let keywordToken = tokens[index];
  if (keywordToken.type !== 'word') return null;

  let nextIndex = index + 1;
  while (nextIndex < tokens.length && tokens[nextIndex].type === 'whitespace') {
    nextIndex++;
  }
  if (
    nextIndex < tokens.length &&
    tokens[nextIndex].type === 'punctuation' &&
    tokens[nextIndex].value === ':'
  ) {
    nextIndex++;
    while (nextIndex < tokens.length && tokens[nextIndex].type === 'whitespace') {
      nextIndex++;
    }
    if (nextIndex >= tokens.length) return null;
    const afterLabel = tokens[nextIndex];
    if (afterLabel.type !== 'word') return null;
    keywordToken = afterLabel;
  }

  return keywordToken.value.length + 1;
};

// Derive structural flags (openers/closers/mids) from tokenized line info.
export function getLineFlags(info: LineInfo): LineFlags {
  const upper = info.upper;
  const upperNoComment = info.upperNoComment;
  const leading = info.leadingKeyword ?? '';
  const trimmedUpper = info.trimmed.toUpperCase();

  const isCloser =
    (leading.length > 0 && CLOSERS.includes(leading)) || startsWithKeyword(upper, CLOSERS);
  const isMid =
    (leading.length > 0 && MID_KEYWORDS.includes(leading)) || startsWithKeyword(upper, MID_KEYWORDS);
  let isOpener =
    (leading.length > 0 && OPENERS.includes(leading)) || startsWithKeyword(upper, OPENERS);
  const isProcStart = upper.startsWith('DCL-PROC');
  const isProcEnd = upper.startsWith('END-PROC') || upper.startsWith('ENDPROC');
  const isExecSqlStart = /^EXEC\s+SQL\b/.test(trimmedUpper);
  const isExecSqlEnd = /^END-EXEC\b/.test(trimmedUpper) || /^END\s+EXEC\b/.test(trimmedUpper);
  const execSqlBlockDelta = info.isCommentOnly ? 0 : getExecSqlBlockDelta(info.upperNoComment);
  const hasInlineCloser = containsKeywordToken(upperNoComment, CLOSERS);
  const lastToken = getLastSignificantToken(info);
  const endsStatement =
    !info.isCommentOnly &&
    Boolean(lastToken && lastToken.type === 'punctuation' && lastToken.value === ';');
  const endsWithAssignment =
    !info.isCommentOnly &&
    Boolean(lastToken && lastToken.type === 'operator' && lastToken.value === '=');
  const isDclDsStart = trimmedUpper.startsWith('DCL-DS');
  const hasEndDsToken = /\bEND-DS\b|\bENDDS\b/.test(upperNoComment);
  const hasTemplateKeyword =
    /\b(LIKEDS|LIKEREC|LIKEDF|EXTNAME|EXTFILE|EXTFLD)\b/.test(upperNoComment);
  const isSingleLineDclDsTemplate =
    isDclDsStart && endsStatement && !hasEndDsToken && hasTemplateKeyword;
  if (isSingleLineDclDsTemplate) {
    isOpener = false;
  }

  const statementContinuationOffset = getStatementContinuationOffset(info);

  return {
    isCloser,
    isMid,
    isOpener,
    isProcStart,
    isProcEnd,
    isExecSqlStart,
    isExecSqlEnd,
    execSqlBlockDelta,
    isMultilineStringContinuation: false,
    hasInlineCloser,
    isCommentOnly: info.isCommentOnly,
    endsStatement,
    endsWithAssignment,
    statementContinuationOffset
  };
}
