export type OutsideTransform = {
  append: string;
  advance?: number;
};

type OutsideHandler = (ch: string, index: number, text: string) => OutsideTransform | null;

// Transform text outside string literals while preserving string contents.
export const transformOutsideStrings = (text: string, handler: OutsideHandler): string => {
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

    const handled = handler(ch, i, text);
    if (handled) {
      result += handled.append;
      if (handled.advance) {
        i += handled.advance;
      }
      continue;
    }

    result += ch;
  }

  return result;
};
