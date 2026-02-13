import { findCommentIndexOutsideStrings } from './comments';
import { parseStringLiteralSegment } from './literal';
import { splitBySpacedPlusOutsideStrings } from './plus';
import { scanStringAware } from './scan';

// Check if a line contains both a string literal and a '+' outside strings.
export const lineHasStringConcat = (text: string): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  let hasLiteral = false;
  let hasPlus = false;
  scanStringAware(
    codePart,
    (ch) => {
      if (ch === '+') {
        hasPlus = true;
      }
      return false;
    },
    () => {
      hasLiteral = true;
    }
  );

  return hasLiteral && hasPlus;
};

const parseLiteralSegmentWithAffixes = (
  segment: string
): { prefix: string; quoteChar: string; content: string; suffix: string } | null => {
  const singleIndex = segment.indexOf('\'');
  const doubleIndex = segment.indexOf('"');
  if (singleIndex < 0 && doubleIndex < 0) return null;
  const quoteIndex =
    singleIndex >= 0 && doubleIndex >= 0
      ? Math.min(singleIndex, doubleIndex)
      : Math.max(singleIndex, doubleIndex);
  if (quoteIndex < 0) return null;
  const info = parseStringLiteralSegment(segment.substring(quoteIndex));
  if (!info) return null;
  return {
    prefix: segment.substring(0, quoteIndex),
    quoteChar: info.quoteChar,
    content: info.content,
    suffix: info.suffix
  };
};

// Check if a line is a concatenation made entirely of string literals.
export const isLiteralOnlyConcatLine = (text: string): boolean => {
  const trimmedStart = text.trimStart();
  if (trimmedStart.length === 0 || trimmedStart.startsWith('//')) return false;

  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  const indent = codePart.match(/^(\s*)/)?.[1] ?? '';
  const body = codePart.substring(indent.length);
  const bodyTrimmed = body.trimStart();
  const startsWithPlus = bodyTrimmed.startsWith('+');
  const bodyCore = startsWithPlus ? bodyTrimmed.substring(1).trimStart() : body;
  const segments = splitBySpacedPlusOutsideStrings(bodyCore)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) return false;

  const firstInfo = parseLiteralSegmentWithAffixes(segments[0]);
  if (!firstInfo) return false;
  if (segments.length === 1) return true;
  if (firstInfo.suffix.trim().length > 0) return false;

  for (let index = 1; index < segments.length; index++) {
    const segment = segments[index];
    const info = parseStringLiteralSegment(segment);
    if (!info) return false;
    if (info.quoteChar !== firstInfo.quoteChar) return false;
    const isLast = index === segments.length - 1;
    if (!isLast && info.suffix.trim().length > 0) return false;
  }

  return true;
};
