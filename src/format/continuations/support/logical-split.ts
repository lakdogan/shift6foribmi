import { findAssignmentRhsStart } from '../../operators';
import { findCommentIndexOutsideStrings } from './string-scan';

const LOGICAL_OPERATORS = ['AND', 'OR', 'XOR'];

// Check whether a character is part of an RPG word token.
const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

// Match a logical operator at the given index and return its length.
const matchLogicalOperator = (text: string, index: number): number | null => {
  const ch = text[index];
  const prev = index > 0 ? text[index - 1] : '';
  if (prev && isWordChar(prev)) return null;

  if (ch === '*') {
    const slice = text.substring(index + 1, index + 4);
    const upper = slice.toUpperCase();
    if (LOGICAL_OPERATORS.includes(upper)) {
      const next = text[index + 4] ?? '';
      if (!isWordChar(next)) {
        return 4;
      }
    }
    return null;
  }

  if (!/[A-Za-z]/.test(ch)) return null;
  let end = index + 1;
  while (end < text.length && isWordChar(text[end])) end++;
  const word = text.substring(index, end).toUpperCase();
  if (!LOGICAL_OPERATORS.includes(word)) return null;
  const next = text[end] ?? '';
  if (next && isWordChar(next)) return null;
  return end - index;
};

// Split boolean assignments by logical operators when safe.
export const splitBooleanAssignmentLine = (line: string): string[] | null => {
  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';
  const rhsStart = findAssignmentRhsStart(codePart);
  if (rhsStart === null) return null;

  const head = codePart.substring(0, rhsStart).trimEnd();
  if (head.trim().length === 0) return null;

  let inString = false;
  let quoteChar = '';
  let depth = 0;
  let start = rhsStart;
  const parts: string[] = [];

  for (let i = rhsStart; i < codePart.length; i++) {
    const ch = codePart[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < codePart.length && codePart[i + 1] === quoteChar) {
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }
    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      continue;
    }
    if (ch === '(') {
      depth++;
      continue;
    }
    if (ch === ')' && depth > 0) {
      depth--;
      continue;
    }
    if (depth === 0) {
      const opLength = matchLogicalOperator(codePart, i);
      if (opLength !== null) {
        const segment = codePart.substring(start, i).trim();
        if (segment.length === 0) return null;
        parts.push(segment);
        start = i;
        i += opLength - 1;
      }
    }
  }

  const tail = codePart.substring(start).trim();
  if (tail.length > 0) {
    parts.push(tail);
  }
  if (parts.length < 2) return null;

  const indent = codePart.match(/^(\s*)/)?.[1] ?? '';
  const lines = [head, ...parts.map((part) => indent + part.trim())];
  if (commentPart) {
    const last = lines.length - 1;
    const spacer = lines[last].endsWith(' ') ? '' : ' ';
    lines[last] = lines[last] + spacer + commentPart.trimStart();
  }
  return lines;
};
