// Trim whitespace inside parentheses that contain a single string literal.
export const trimStringOnlyParentheses = (text: string): string =>
  text.replace(/\(\s*(['"][^'"]*['"])\s*\)/g, '($1)');

// Collapse repeated whitespace outside of string literals into single spaces.
export const collapseExtraSpacesOutsideStrings = (text: string): string => {
  let result = '';
  let inString = false;
  let quoteChar = '';
  let pendingSpace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          result += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      if (pendingSpace) {
        result += ' ';
        pendingSpace = false;
      }
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      result += ' ';
      pendingSpace = false;
    }
    result += ch;
  }

  if (pendingSpace) {
    result += ' ';
  }

  return result;
};

// Remove leading/trailing spaces inside parentheses outside string literals.
export const trimSpacesInsideParenthesesOutsideStrings = (text: string): string => {
  let result = '';
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          result += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === '(') {
      result += ch;
      let j = i + 1;
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) {
        j++;
      }
      i = j - 1;
      continue;
    }

    if (ch === ')') {
      while (result.endsWith(' ') || result.endsWith('\t')) {
        result = result.slice(0, -1);
      }
      result += ch;
      continue;
    }

    result += ch;
  }

  return result;
};
