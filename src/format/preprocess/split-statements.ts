import { findCommentIndexOutsideStrings, scanOutsideStrings } from '../utils/string-scan';

// Split multi-statement lines on semicolons while preserving strings and inline comments.
export function splitStatements(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) return [line];

  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('//')) return [line];

  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const inlinePrototypePattern = /^\s*dcl-pr\b[^;]*;\s*end-pr\s*;\s*$/i;
  if (inlinePrototypePattern.test(codePart)) return [line];

  if (!codePart.includes(';')) return [line];

  const lineIndent = line.match(/^ */)?.[0] ?? '';
  const pieces: string[] = [];
  let segmentStart = 0;

  scanOutsideStrings(codePart, (ch, index) => {
    if (ch === ';') {
      pieces.push(codePart.substring(segmentStart, index + 1));
      segmentStart = index + 1;
    }
    return false;
  });
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
