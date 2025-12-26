import { scanStringAware } from '../../../utils/string-scan';

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

  const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

  const peekNextWord = (from: number): string => {
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
        return text.slice(i, j).toUpperCase();
      }
    }
    return '';
  };

  const flushWord = (endIndex: number) => {
    if (!currentWord) return;
    const upper = currentWord.toUpperCase();
    if (upper === 'BEGIN') {
      const nextWord = peekNextWord(endIndex);
      if (nextWord !== 'DECLARE') {
        blockDepth++;
      }
    } else if (upper === 'END') {
      if (blockDepth > 0) blockDepth--;
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

    if (ch === ';' && blockDepth === 0) {
      const piece = text.slice(start, index).trim();
      if (piece.length > 0) statements.push(piece);
      start = index + 1;
    }
  });
  if (currentWord) flushWord(text.length);
  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
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
