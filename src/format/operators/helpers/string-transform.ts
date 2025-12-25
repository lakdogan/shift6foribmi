export type OutsideTransform = {
  append: string;
  advance?: number;
};

type OutsideHandler = (ch: string, index: number, text: string) => OutsideTransform | null;
type SegmentTransform = (segment: string) => string;

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

export interface StringTransformContext {
  inString: boolean;
  quoteChar: string;
  result: string;
  index: number;
}

// Accumulate a result while iterating characters outside strings.
export const reduceOutsideStrings = <T>(
  text: string,
  initial: T,
  reducer: (state: T, ch: string, index: number, ctx: StringTransformContext) => T
): T => {
  let state = initial;
  let result = '';
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const ctx: StringTransformContext = { inString, quoteChar, result, index: i };
    if (inString) {
      result += ch;
      state = reducer(state, ch, i, { ...ctx, result });
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
      state = reducer(state, ch, i, { ...ctx, inString, quoteChar, result });
      continue;
    }

    state = reducer(state, ch, i, { ...ctx, result });
  }

  return state;
};

// Transform full segments outside string literals while preserving string contents.
export const transformSegmentsOutsideStrings = (text: string, transform: SegmentTransform): string => {
  let result = '';
  let segmentStart = 0;
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
        segmentStart = i + 1;
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      result += transform(text.substring(segmentStart, i));
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }
  }

  if (!inString) {
    result += transform(text.substring(segmentStart));
  }

  return result;
};
