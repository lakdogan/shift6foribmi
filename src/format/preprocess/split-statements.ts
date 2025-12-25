// Split multi-statement lines on semicolons while preserving strings and inline comments.
export function splitStatements(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) return [line];

  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('//')) return [line];

  let commentIndex = -1;
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
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
    if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
      commentIndex = i;
      break;
    }
  }

  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  if (!codePart.includes(';')) return [line];

  const lineIndent = line.match(/^ */)?.[0] ?? '';
  const pieces: string[] = [];
  inString = false;
  quoteChar = '';
  let segmentStart = 0;

  for (let i = 0; i < codePart.length; i++) {
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
    if (ch === ';') {
      pieces.push(codePart.substring(segmentStart, i + 1));
      segmentStart = i + 1;
    }
  }
  if (segmentStart < codePart.length) {
    pieces.push(codePart.substring(segmentStart));
  }

  const segments: string[] = [];
  for (const piece of pieces) {
    const seg = piece.trim();
    const punctuationOnly = /^[.,]+$/.test(seg);
    if (seg.length === 0 || punctuationOnly) {
      continue;
    }
    segments.push(lineIndent + seg);
  }

  if (commentPart && segments.length > 0) {
    const last = segments.length - 1;
    const spacer = segments[last].endsWith(' ') ? '' : ' ';
    segments[last] += spacer + commentPart;
  }

  return segments.length <= 1 ? segments : segments;
}
