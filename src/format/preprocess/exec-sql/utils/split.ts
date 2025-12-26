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

  scanStringAware(text, (ch, index) => {
    if (ch === ';') {
      const piece = text.slice(start, index).trim();
      if (piece.length > 0) statements.push(piece);
      start = index + 1;
    }
  });
  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
};
