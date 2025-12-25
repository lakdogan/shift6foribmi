import { findCommentIndexOutsideStrings, parseStringLiteralSegment, splitBySpacedPlusOutsideStrings, splitLiteralContentToFit } from './string-scan';

// Wrap a string literal into continuation lines, keeping suffix on the last chunk.
const splitBareLiteralIntoLines = (
  quoteChar: string,
  content: string,
  firstPrefix: string,
  continuationPrefix: string,
  columnLimit: number,
  suffix: string
): string[] | null => {
  const lines: string[] = [];
  let remaining = content;
  let prefix = firstPrefix;

  while (remaining.length > 0) {
    const baseMaxContent = columnLimit - prefix.length - 2;
    let maxContent = baseMaxContent;
    if (suffix.length > 0 && remaining.length <= baseMaxContent) {
      const maxWithSuffix = columnLimit - prefix.length - 2 - suffix.length;
      if (maxWithSuffix < remaining.length) {
        maxContent = maxWithSuffix;
      }
    }
    if (maxContent <= 0) return null;
    const split = splitLiteralContentToFit(remaining, maxContent);
    if (!split || split.chunk.length === 0) return null;
    remaining = split.rest;
    const isLast = remaining.length === 0;
    lines.push(prefix + quoteChar + split.chunk + quoteChar + (isLast ? suffix : ''));
    prefix = continuationPrefix;
  }

  return lines;
};

// Split long concatenations with string literals while preserving string contents.
export function wrapConcatenatedLine(
  seg: string,
  columnLimit: number,
  allowStringSplit: boolean,
  concatStyle: 'compact' | 'one-per-line'
): string[] | null {
  if (concatStyle === 'compact' && seg.length <= columnLimit) return null;
  if (seg.trimStart().startsWith('//')) return null;
  if (findCommentIndexOutsideStrings(seg) >= 0) return null;

  const indent = seg.match(/^(\s*)/)?.[1] ?? '';
  const body = seg.substring(indent.length);
  const bodyTrimmed = body.trimStart();
  const startsWithPlus = bodyTrimmed.startsWith('+');
  const bodyCore = startsWithPlus ? bodyTrimmed.substring(1).trimStart() : body;
  const rawSegments = splitBySpacedPlusOutsideStrings(bodyCore).map((segment) => segment.trim());
  if (rawSegments.length === 0) return null;
  if (concatStyle === 'one-per-line' && rawSegments.length < 2) return null;
  const hasStringSegment = rawSegments.some((segment) => parseStringLiteralSegment(segment));
  if (!hasStringSegment) return null;

  if (rawSegments.length === 1) {
    const literalInfo = parseStringLiteralSegment(rawSegments[0]);
    if (literalInfo && allowStringSplit) {
      const firstPrefix = indent + (startsWithPlus ? '+ ' : '');
      const continuationPrefix = indent + '+ ';
      const literalLines = splitBareLiteralIntoLines(
        literalInfo.quoteChar,
        literalInfo.content,
        firstPrefix,
        continuationPrefix,
        columnLimit,
        literalInfo.suffix
      );
      return literalLines && literalLines.length > 1 ? literalLines : null;
    }
    return null;
  }

  if (concatStyle === 'one-per-line') {
    const lines: string[] = [];
    for (let i = 0; i < rawSegments.length; i++) {
      const segment = rawSegments[i];
      const linePrefix = indent + (i === 0 && !startsWithPlus ? '' : '+ ');
      const literalInfo = parseStringLiteralSegment(segment);
      if (literalInfo && allowStringSplit) {
        const literalLines = splitBareLiteralIntoLines(
          literalInfo.quoteChar,
          literalInfo.content,
          linePrefix,
          indent + '+ ',
          columnLimit,
          literalInfo.suffix
        );
        if (!literalLines) return null;
        lines.push(...literalLines);
        continue;
      }
      lines.push(linePrefix + segment);
    }
    return lines.length > 1 ? lines : null;
  }

  const lines: string[] = [];
  let currentSegments: string[] = [];
  let linePrefix = indent + (startsWithPlus ? '+ ' : '');

  // Push the current line buffer and reset state.
  const flushLine = (): void => {
    if (currentSegments.length > 0) {
      lines.push(linePrefix + currentSegments.join(' + '));
      linePrefix = indent + '+ ';
      currentSegments = [];
    }
  };

  // Try to append a segment if it fits the column limit.
  const tryAppendSegment = (segment: string): boolean => {
    if (currentSegments.length === 0) {
      const candidate = linePrefix + segment;
      if (candidate.length <= columnLimit) {
        currentSegments.push(segment);
        return true;
      }
      return false;
    }
    const candidate = linePrefix + currentSegments.join(' + ') + ' + ' + segment;
    if (candidate.length <= columnLimit) {
      currentSegments.push(segment);
      return true;
    }
    return false;
  };

  for (const segment of rawSegments) {
    if (tryAppendSegment(segment)) {
      continue;
    }

    const literalInfo = parseStringLiteralSegment(segment);
    if (literalInfo && allowStringSplit) {
      const baseLine = linePrefix + currentSegments.join(' + ');
      const available = columnLimit - baseLine.length - 3 - 2;
      if (currentSegments.length > 0 && available > 0) {
        const split = splitLiteralContentToFit(literalInfo.content, available);
        if (split && split.rest.length > 0) {
          const firstChunk = literalInfo.quoteChar + split.chunk + literalInfo.quoteChar;
          currentSegments.push(firstChunk);
          flushLine();

          const continuationPrefix = indent + '+ ';
          const continuationLines = splitBareLiteralIntoLines(
            literalInfo.quoteChar,
            split.rest,
            continuationPrefix,
            continuationPrefix,
            columnLimit,
            literalInfo.suffix
          );
          if (!continuationLines) return null;
          lines.push(...continuationLines.slice(0, -1));
          linePrefix = continuationPrefix;
          currentSegments = [continuationLines[continuationLines.length - 1].substring(continuationPrefix.length)];
          continue;
        }
      }
    }

    flushLine();
    if (!tryAppendSegment(segment)) {
      const newLiteralInfo = parseStringLiteralSegment(segment);
      if (newLiteralInfo && allowStringSplit) {
        const continuationPrefix = indent + '+ ';
        const literalLines = splitBareLiteralIntoLines(
          newLiteralInfo.quoteChar,
          newLiteralInfo.content,
          continuationPrefix,
          continuationPrefix,
          columnLimit,
          newLiteralInfo.suffix
        );
        if (!literalLines) return null;
        lines.push(...literalLines);
        linePrefix = continuationPrefix;
        currentSegments = [];
        continue;
      }
      currentSegments = [segment];
    }
  }

  flushLine();
  return lines.length > 1 ? lines : null;
}
