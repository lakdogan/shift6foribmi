// Normalize whitespace while preserving SQL string literals.
export const normalizeSqlWhitespace = (text: string): string => {
  let out = '';
  let inString = false;
  let quoteChar = '';
  let pendingSpace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          out += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      if (pendingSpace && out.length > 0 && !out.endsWith(' ')) {
        out += ' ';
      }
      pendingSpace = false;
      inString = true;
      quoteChar = ch;
      out += ch;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace && out.length > 0 && !out.endsWith(' ')) {
      out += ' ';
    }
    pendingSpace = false;
    out += ch;
  }

  return out.trim();
};

// Collapse spaced identifier paths like SCHEMA / TABLE.
export const normalizeSqlIdentifierPath = (text: string): string =>
  text.replace(/\s*\/\s*/g, '/');

// Join star-prefixed tokens (e.g., * cs -> *cs).
export const normalizeStarTokens = (text: string): string =>
  text.replace(/\*\s+([A-Za-z][A-Za-z0-9_]*)/g, '*$1');

// Normalize SQL expressions with consistent operator spacing.
export const normalizeSqlExpression = (text: string): string => {
  const compact = normalizeSqlWhitespace(text);
  let out = '';
  let inString = false;
  let quoteChar = '';

  const nextNonSpace = (start: number): string => {
    for (let i = start; i < compact.length; i++) {
      const ch = compact[i];
      if (ch !== ' ') return ch;
    }
    return '';
  };

  const nextNonSpaceIndex = (start: number): number => {
    for (let i = start; i < compact.length; i++) {
      if (compact[i] !== ' ') return i;
    }
    return -1;
  };

  const lastNonSpace = () => {
    for (let i = out.length - 1; i >= 0; i--) {
      const ch = out[i];
      if (ch !== ' ') return ch;
    }
    return '';
  };

  for (let i = 0; i < compact.length; i++) {
    const ch = compact[i];
    if (inString) {
      out += ch;
      if (ch === quoteChar) {
        if (i + 1 < compact.length && compact[i + 1] === quoteChar) {
          out += compact[i + 1];
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
      out += ch;
      continue;
    }

    if (ch === '<') {
      const nextIndex = nextNonSpaceIndex(i + 1);
      if (nextIndex >= 0 && compact[nextIndex] === '>') {
        if (out.length > 0 && !out.endsWith(' ')) {
          out += ' ';
        }
        out += '<>';
        const afterIndex = nextIndex + 1;
        const nextAfter = nextNonSpace(afterIndex);
        const nextAfterIsSpace = compact[afterIndex] === ' ';
        if (!nextAfterIsSpace && nextAfter !== '' && nextAfter !== ' ') {
          out += ' ';
        }
        i = nextIndex;
        continue;
      }
    }

    if (ch === '*' && /[A-Za-z]/.test(nextNonSpace(i + 1))) {
      const prev = lastNonSpace();
      if (prev === '' || prev === '=' || prev === ',' || prev === '(') {
        out += ch;
        while (i + 1 < compact.length && compact[i + 1] === ' ') {
          i++;
        }
        continue;
      }
    }

    if (ch === '=' || ch === '+' || ch === '-' || ch === '*' || ch === '>' || ch === '<') {
      const prev = lastNonSpace();
      const next = nextNonSpace(i + 1);
      const nextIsSpace = compact[i + 1] === ' ';
      if (
        ch === '=' &&
        (prev === '<' || prev === '>' || prev === '!' || prev === '=' || next === '=')
      ) {
        out += ch;
        continue;
      }
      if ((ch === '>' || ch === '<') && next === '=') {
        out += ch;
        continue;
      }
      if ((ch === '+' || ch === '-') && (prev === '' || prev === '(' || prev === ',')) {
        out += ch;
        continue;
      }
      if (ch === '*' && (prev === '' || prev === '(' || prev === ',')) {
        out += ch;
        continue;
      }
      if (out.length > 0 && !out.endsWith(' ')) {
        out += ' ';
      }
      out += ch;
      if (!nextIsSpace && next !== '' && next !== ' ') {
        out += ' ';
      }
      continue;
    }

    out += ch;
  }

  return out.trim();
};

// Remove a trailing semicolon from a SQL fragment.
export const stripTrailingSemicolon = (text: string): string => {
  const trimmed = text.trimEnd();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1).trimEnd() : trimmed;
};

// Remove a trailing semicolon from the last formatted line.
export const trimTrailingSemicolon = (lines: string[]): string[] => {
  if (lines.length === 0) return lines;
  const last = lines[lines.length - 1];
  if (last.endsWith(';')) {
    lines[lines.length - 1] = last.slice(0, -1);
  }
  return lines;
};
