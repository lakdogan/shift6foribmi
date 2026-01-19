import { scanStringAware } from '../../../utils/string-scan';

const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

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
      words.push(text.slice(i, j).toUpperCase());
      i = j - 1;
      if (words.length >= count) return words;
    }
  }
  return words;
};

const updateBlockDepth = (text: string, word: string, endIndex: number, depth: number): number => {
  const upper = word.toUpperCase();
  if (upper === 'BEGIN') {
    const [nextWord, nextNext] = peekNextWords(text, endIndex, 2);
    if (nextWord === 'DECLARE' && nextNext === 'SECTION') {
      return depth;
    }
    return depth + 1;
  }
  if (upper === 'END') {
    const [nextWord] = peekNextWords(text, endIndex, 1);
    if (nextWord && ['IF', 'CASE', 'LOOP', 'FOR', 'WHILE', 'REPEAT'].includes(nextWord)) {
      return depth;
    }
    return Math.max(0, depth - 1);
  }
  return depth;
};

// Split a string on delimiters outside parentheses.
export const splitTopLevel = (text: string, delimiter: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (ch === delimiter && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  });

  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
};

// Split multiple SQL statements by semicolons outside strings.
export const splitSqlStatements = (text: string): string[] => {
  const statements: string[] = [];
  let start = 0;
  let blockDepth = 0;
  let currentWord = '';

  scanStringAware(text, (ch, index) => {
    if (isWordChar(ch)) {
      currentWord += ch;
      return;
    }

    if (currentWord) {
      blockDepth = updateBlockDepth(text, currentWord, index, blockDepth);
      currentWord = '';
    }

    if (ch === ';' && blockDepth === 0) {
      const piece = text.slice(start, index).trim();
      if (piece.length > 0) statements.push(piece);
      start = index + 1;
    }
  });
  if (currentWord) {
    blockDepth = updateBlockDepth(text, currentWord, text.length, blockDepth);
    currentWord = '';
  }
  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
};

// Check if the last non-whitespace character is a top-level semicolon.
export const endsWithTopLevelSemicolon = (text: string): boolean => {
  let blockDepth = 0;
  let currentWord = '';
  let lastTopLevelSemicolon = -1;

  scanStringAware(text, (ch, index) => {
    if (isWordChar(ch)) {
      currentWord += ch;
      return;
    }

    if (currentWord) {
      blockDepth = updateBlockDepth(text, currentWord, index, blockDepth);
      currentWord = '';
    }

    if (ch === ';' && blockDepth === 0) {
      lastTopLevelSemicolon = index;
    }
  });

  if (currentWord) {
    blockDepth = updateBlockDepth(text, currentWord, text.length, blockDepth);
    currentWord = '';
  }

  if (lastTopLevelSemicolon < 0) return false;
  for (let i = lastTopLevelSemicolon + 1; i < text.length; i++) {
    const ch = text[i];
    if (ch !== ' ' && ch !== '\t' && ch !== '\n' && ch !== '\r') {
      return false;
    }
  }
  return true;
};

// Split statements on semicolons outside string literals.
export const splitStatementsOutsideStrings = (text: string): string[] => {
  const statements: string[] = [];
  let start = 0;
  scanStringAware(text, (ch, index) => {
    if (ch !== ';') return;
    const piece = text.slice(start, index).trim();
    if (piece.length > 0) statements.push(piece);
    start = index + 1;
  });
  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
};
