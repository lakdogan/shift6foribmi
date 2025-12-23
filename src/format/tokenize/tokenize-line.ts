import { Token, TokenType } from './types';

const WORD_CHARS = /[A-Za-z0-9_#$@-]/;
const NUMBER_CHARS = /[0-9]/;
const OPERATOR_CHARS = /[+\-*/=<>&|!^~]/;
const PUNCTUATION_CHARS = /[(),;:]/;

export interface TokenizeResult {
  tokens: Token[];
  commentIndex: number | null;
}

// Tokenize a line into coarse RPGLE tokens for lightweight parsing.
export function tokenizeLine(line: string): TokenizeResult {
  const tokens: Token[] = [];
  let i = 0;
  let commentIndex: number | null = null;

  // Append a token slice if it has content.
  const pushToken = (type: TokenType, start: number, end: number) => {
    if (end <= start) return;
    tokens.push({ type, value: line.slice(start, end), start, end });
  };

  while (i < line.length) {
    const ch = line[i];

    if (ch === '/' && line[i + 1] === '/') {
      commentIndex = i;
      pushToken('comment', i, line.length);
      break;
    }

    if (ch === "'") {
      const start = i;
      i++;
      while (i < line.length) {
        if (line[i] === "'") {
          if (line[i + 1] === "'") {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      pushToken('string', start, i);
      continue;
    }

    if (ch === '%') {
      const start = i;
      i++;
      if (i < line.length && /[A-Za-z]/.test(line[i])) {
        while (i < line.length && WORD_CHARS.test(line[i])) {
          i++;
        }
        pushToken('word', start, i);
      } else {
        pushToken('operator', start, i);
      }
      continue;
    }

    if (WORD_CHARS.test(ch)) {
      const start = i;
      i++;
      while (i < line.length && WORD_CHARS.test(line[i])) {
        i++;
      }
      pushToken('word', start, i);
      continue;
    }

    if (NUMBER_CHARS.test(ch)) {
      const start = i;
      i++;
      while (i < line.length && NUMBER_CHARS.test(line[i])) {
        i++;
      }
      pushToken('number', start, i);
      continue;
    }

    if (OPERATOR_CHARS.test(ch)) {
      const start = i;
      i++;
      pushToken('operator', start, i);
      continue;
    }

    if (PUNCTUATION_CHARS.test(ch)) {
      const start = i;
      i++;
      pushToken('punctuation', start, i);
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      const start = i;
      i++;
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
        i++;
      }
      pushToken('whitespace', start, i);
      continue;
    }

    const start = i;
    i++;
    pushToken('punctuation', start, i);
  }

  return { tokens, commentIndex };
}
