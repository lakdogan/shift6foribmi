import { findLastNonWhitespaceOutsideStrings, scanOutsideStrings } from './scan';

// Split a string by spaced '+' operators, skipping string literal content.
export const splitBySpacedPlusOutsideStrings = (text: string): string[] => {
  const splitIndices: number[] = [];
  scanOutsideStrings(text, (ch, index) => {
    if (ch === '+' && index > 0 && index + 1 < text.length) {
      const prev = text[index - 1];
      const next = text[index + 1];
      if (prev === ' ' && next === ' ') {
        splitIndices.push(index);
      }
    }
  });

  if (splitIndices.length === 0) {
    return [text];
  }

  const segments: string[] = [];
  let segmentStart = 0;
  for (const splitIndex of splitIndices) {
    segments.push(text.substring(segmentStart, splitIndex));
    segmentStart = splitIndex + 1;
  }
  segments.push(text.substring(segmentStart));
  return segments;
};

// Detect a trailing '+' outside of string literals.
export const hasTrailingPlusOutsideStrings = (text: string): boolean => {
  const lastIndex = findLastNonWhitespaceOutsideStrings(text);
  if (lastIndex < 0) return false;
  return text[lastIndex] === '+';
};

// Remove a trailing '+' outside of string literals.
export const removeTrailingPlusOutsideStrings = (text: string): string => {
  const lastIndex = findLastNonWhitespaceOutsideStrings(text);
  if (lastIndex >= 0 && text[lastIndex] === '+') {
    return text.substring(0, lastIndex).trimEnd();
  }
  return text;
};
