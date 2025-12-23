import { CLOSERS } from '../constants';
import { startsWithKeyword } from './utils';

// Collapse redundant blank lines while preserving block boundary spacing.
export function postProcessBlankLines(lines: string[]) {
  // Detect blank lines for collapsing logic.
  const isBlank = (t: string) => t.trim().length === 0;
  // Detect closers to avoid blank lines before END-* blocks.
  const isCloserLine = (t: string) => startsWithKeyword(t.trim().toUpperCase(), CLOSERS);

  let anyChanged = false;
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (isBlank(l)) {
      if (out.length > 0 && isBlank(out[out.length - 1])) {
        anyChanged = true;
        continue;
      }

      let k = i + 1;
      while (k < lines.length && isBlank(lines[k])) k++;
      if (k < lines.length && isCloserLine(lines[k])) {
        anyChanged = true;
        continue;
      }
    }

    out.push(l);
  }

  while (out.length > 0 && out[out.length - 1].trim() === '') {
    out.pop();
    anyChanged = true;
  }

  return { resultLines: out, anyChanged };
}
