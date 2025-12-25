import { splitStringBySpaces } from './split';

// Parse a standalone string literal segment with optional suffix punctuation.
export const parseStringLiteralSegment = (
  segment: string
): { quoteChar: string; content: string; suffix: string } | null => {
  const trimmed = segment.trim();
  if (trimmed.length < 2) return null;
  const firstChar = trimmed[0];
  if (firstChar !== '\'' && firstChar !== '"') return null;
  let inString = true;
  let quoteChar = firstChar;
  let endIndex = -1;

  for (let i = 1; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < trimmed.length && trimmed[i + 1] === quoteChar) {
          i++;
          continue;
        }
        endIndex = i;
        inString = false;
        break;
      }
    }
  }

  if (endIndex < 1) return null;
  const suffix = trimmed.substring(endIndex + 1);
  for (let i = 0; i < suffix.length; i++) {
    const ch = suffix[i];
    if (ch !== ' ' && ch !== '\t' && ch !== ';' && ch !== ',' && ch !== ')') {
      return null;
    }
  }

  const content = trimmed.substring(1, endIndex);
  return { quoteChar, content, suffix };
};

// Split literal content at word boundaries to fit a max length.
export const splitLiteralContentToFit = (
  content: string,
  maxContent: number
): { chunk: string; rest: string } | null => {
  if (content.length <= maxContent) {
    return { chunk: content, rest: '' };
  }
  return splitStringBySpaces(content, maxContent);
};
