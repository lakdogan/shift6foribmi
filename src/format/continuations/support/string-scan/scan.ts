export type OutsideCharCallback = (ch: string, index: number) => boolean | void;
export type StringStartCallback = (quote: string, index: number) => void;

// Scan text with string-literal awareness, invoking callbacks outside strings.
export const scanStringAware = (
  text: string,
  onOutsideChar: OutsideCharCallback,
  onStringStart?: StringStartCallback
): void => {
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
      if (onStringStart) onStringStart(ch, i);
      continue;
    }
    if (onOutsideChar(ch, i)) {
      break;
    }
  }
};

// Scan characters outside string literals.
export const scanOutsideStrings = (text: string, onOutsideChar: OutsideCharCallback): void => {
  scanStringAware(text, onOutsideChar);
};

// Find the last non-whitespace index outside strings.
export const findLastNonWhitespaceOutsideStrings = (text: string): number => {
  let lastIndex = -1;
  scanOutsideStrings(text, (ch, index) => {
    if (ch !== ' ' && ch !== '\t') {
      lastIndex = index;
    }
  });
  return lastIndex;
};
