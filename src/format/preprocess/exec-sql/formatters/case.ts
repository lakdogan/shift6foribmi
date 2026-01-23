import { normalizeSqlExpression, normalizeSqlWhitespace } from '../utils/index';
import { scanStringAware } from '../../../utils/string-scan';

type CaseToken = {
  keyword: 'WHEN' | 'THEN' | 'ELSE' | 'END';
  index: number;
};

const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

// Format CASE expressions into multi-line layout. Returns null if not a CASE expression.
export const formatCaseExpression = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] | null => {
  const normalized = normalizeSqlWhitespace(text);
  const upper = normalized.toUpperCase();
  if (!upper.startsWith('CASE')) return null;

  let caseDepth = 0;
  let currentWord = '';
  let wordStart = 0;
  let caseStart = -1;
  const tokens: CaseToken[] = [];

  const flushWord = () => {
    if (!currentWord) return;
    const upperWord = currentWord.toUpperCase();
    if (upperWord === 'CASE') {
      caseDepth += 1;
      if (caseDepth === 1) caseStart = wordStart;
    } else if (upperWord === 'END') {
      if (caseDepth === 1) {
        tokens.push({ keyword: 'END', index: wordStart });
      }
      caseDepth = Math.max(0, caseDepth - 1);
    } else if (
      caseDepth === 1 &&
      (upperWord === 'WHEN' || upperWord === 'THEN' || upperWord === 'ELSE')
    ) {
      tokens.push({ keyword: upperWord as CaseToken['keyword'], index: wordStart });
    }
    currentWord = '';
  };

  scanStringAware(normalized, (ch, index) => {
    if (isWordChar(ch)) {
      if (!currentWord) wordStart = index;
      currentWord += ch;
      return;
    }
    flushWord();
  });
  flushWord();

  if (caseStart < 0) return null;
  const endToken = tokens.find((token) => token.keyword === 'END');
  const firstWhen = tokens.find((token) => token.keyword === 'WHEN');
  if (!endToken || !firstWhen) return null;

  const headerExpr = normalizeSqlExpression(
    normalized.slice(caseStart + 4, firstWhen.index).trim()
  );
  const lines: string[] = [];
  lines.push(baseIndent + (headerExpr ? `case ${headerExpr}` : 'case'));

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.keyword === 'WHEN') {
      let thenIndex = -1;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].keyword === 'THEN') {
          thenIndex = j;
          break;
        }
      }
      if (thenIndex < 0) break;
      const thenToken = tokens[thenIndex];
      let nextIndex = endToken.index;
      for (let j = thenIndex + 1; j < tokens.length; j++) {
        if (tokens[j].keyword === 'WHEN' || tokens[j].keyword === 'ELSE') {
          nextIndex = tokens[j].index;
          break;
        }
        if (tokens[j].keyword === 'END') {
          nextIndex = tokens[j].index;
          break;
        }
      }
      const whenText = normalizeSqlExpression(
        normalized.slice(token.index + 4, thenToken.index).trim()
      );
      const thenText = normalizeSqlExpression(
        normalized.slice(thenToken.index + 4, nextIndex).trim()
      );
      lines.push(nestedIndent + `when ${whenText} then ${thenText}`);
      i = thenIndex;
      continue;
    }
    if (token.keyword === 'ELSE') {
      const elseText = normalizeSqlExpression(
        normalized.slice(token.index + 4, endToken.index).trim()
      );
      if (elseText.length > 0) {
        lines.push(nestedIndent + `else ${elseText}`);
      }
      break;
    }
  }

  const endTail = normalizeSqlWhitespace(normalized.slice(endToken.index + 3).trim());
  lines.push(baseIndent + (endTail ? `end ${endTail}` : 'end'));
  return lines;
};
