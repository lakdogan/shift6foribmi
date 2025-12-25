// Split a string by spaced '+' operators, skipping string literal content.
export const splitBySpacedPlusOutsideStrings = (text: string): string[] => {
  const segments: string[] = [];
  let inString = false;
  let quoteChar = '';
  let segmentStart = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
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
    if (ch === '+' && i > 0 && i + 1 < text.length) {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (prev === ' ' && next === ' ') {
        segments.push(text.substring(segmentStart, i));
        segmentStart = i + 1;
      }
    }
  }

  segments.push(text.substring(segmentStart));
  return segments;
};

// Detect a trailing '+' outside of string literals.
export const hasTrailingPlusOutsideStrings = (text: string): boolean => {
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
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
  }

  let end = text.length - 1;
  while (end >= 0 && (text[end] === ' ' || text[end] === '\t')) end--;
  if (end < 0 || text[end] !== '+') return false;
  return true;
};

// Remove a trailing '+' outside of string literals.
export const removeTrailingPlusOutsideStrings = (text: string): string => {
  let end = text.length - 1;
  while (end >= 0 && (text[end] === ' ' || text[end] === '\t')) end--;
  if (end >= 0 && text[end] === '+') {
    return text.substring(0, end).trimEnd();
  }
  return text;
};
