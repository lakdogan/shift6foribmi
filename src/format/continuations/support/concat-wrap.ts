import {
  findCommentIndexOutsideStrings,
  lineEndsStatement,
  parseStringLiteralSegment,
  splitBySpacedPlusOutsideStrings,
  splitLiteralContentToFit
} from '../../utils/string-scan';

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
  concatStyle: 'compact' | 'one-per-line' | 'fill'
): string[] | null {
  const isFill = concatStyle === 'fill';
  const effectiveStyle = isFill ? 'compact' : concatStyle;
  const mergeOnly = effectiveStyle === 'compact' && seg.length <= columnLimit;
  if (seg.trimStart().startsWith('//')) return null;
  if (findCommentIndexOutsideStrings(seg) >= 0) return null;

  const indent = seg.match(/^(\s*)/)?.[1] ?? '';
  const body = seg.substring(indent.length);
  const bodyTrimmed = body.trimStart();
  const startsWithPlus = bodyTrimmed.startsWith('+');
  const bodyCore = startsWithPlus ? bodyTrimmed.substring(1).trimStart() : body;
  const rawSegments = splitBySpacedPlusOutsideStrings(bodyCore).map((segment) => segment.trim());
  if (rawSegments.length === 0) return null;
  if (effectiveStyle === 'one-per-line' && rawSegments.length < 2) return null;

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

  const tryFillLiteralConcat = (): string[] | null => {
    if (!isFill) return null;
    if (rawSegments.length > 1 && !lineEndsStatement(seg)) return null;

    const firstInfo = parseLiteralSegmentWithAffixes(rawSegments[0]);
    if (!firstInfo) return null;
    const quoteChar = firstInfo.quoteChar;
    const contents: string[] = [firstInfo.content];
    const prefix = firstInfo.prefix;
    let suffix = firstInfo.suffix;

    if (rawSegments.length === 1) {
      const firstPrefix = indent + (startsWithPlus ? '+ ' : '') + prefix;
      if (!allowStringSplit) {
        const candidate = `${firstPrefix}${quoteChar}${contents[0]}${quoteChar}${suffix}`;
        if (candidate.length <= columnLimit) {
          return candidate === seg ? null : [candidate];
        }
        return null;
      }
      const continuationPrefix = indent + '+ ';
      const literalLines = splitBareLiteralIntoLines(
        quoteChar,
        contents[0],
        firstPrefix,
        continuationPrefix,
        columnLimit,
        suffix
      );
      if (!literalLines) return null;
      if (literalLines.length === 1 && literalLines[0] === seg) return null;
      return literalLines;
    }

    if (firstInfo.suffix.trim().length > 0) return null;

    for (let i = 1; i < rawSegments.length; i++) {
      const segment = rawSegments[i];
      const info = parseStringLiteralSegment(segment);
      if (!info) return null;
      if (info.quoteChar !== quoteChar) return null;
      const isLast = i === rawSegments.length - 1;
      if (!isLast && info.suffix.trim().length > 0) return null;
      if (isLast) {
        suffix = info.suffix;
      }
      contents.push(info.content);
    }

    const combinedContent = contents.join('');
    const firstPrefix = indent + (startsWithPlus ? '+ ' : '') + prefix;
    if (!allowStringSplit) {
      const candidate = `${firstPrefix}${quoteChar}${combinedContent}${quoteChar}${suffix}`;
      if (candidate.length <= columnLimit) {
        return candidate === seg ? null : [candidate];
      }
      return null;
    }
    const continuationPrefix = indent + '+ ';
    const literalLines = splitBareLiteralIntoLines(
      quoteChar,
      combinedContent,
      firstPrefix,
      continuationPrefix,
      columnLimit,
      suffix
    );
    if (!literalLines) return null;
    if (literalLines.length === 1 && literalLines[0] === seg) return null;
    return literalLines;
  };

  const fillLines = tryFillLiteralConcat();
  if (fillLines) return fillLines;

  const mergeAdjacentLiterals = (segments: string[]): string[] => {
    const merged: string[] = [];
    let pending: { quoteChar: string; content: string; suffix: string } | null = null;
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const isLast = index === segments.length - 1;
      const info = parseStringLiteralSegment(segment);
      const suffix = info ? info.suffix : '';
      const trimmedSuffix = suffix.trim();
      const canMergeSuffix = trimmedSuffix.length === 0 || (isLast && trimmedSuffix.length > 0);
      const isMergeable = Boolean(info && canMergeSuffix);
      if (pending && isMergeable && info && pending.quoteChar === info.quoteChar) {
        pending = {
          quoteChar: pending.quoteChar,
          content: pending.content + info.content,
          suffix: trimmedSuffix.length > 0 ? suffix : pending.suffix
        };
        merged[merged.length - 1] =
          `${pending.quoteChar}${pending.content}${pending.quoteChar}` + pending.suffix;
        continue;
      }
      if (isMergeable && info) {
        pending = { quoteChar: info.quoteChar, content: info.content, suffix: canMergeSuffix ? suffix : '' };
        merged.push(`${info.quoteChar}${info.content}${info.quoteChar}` + pending.suffix);
        continue;
      }
      pending = null;
      merged.push(segment);
    }
    return merged;
  };
  const hasStringSegment = rawSegments.some((segment) => parseStringLiteralSegment(segment));
  if (!hasStringSegment) return null;

  const mergedSegments =
    effectiveStyle === 'compact' ? mergeAdjacentLiterals(rawSegments) : rawSegments;

  if (mergeOnly) {
    const mergedSegmentCountChanged = mergedSegments.length !== rawSegments.length;
    if (!mergedSegmentCountChanged) {
      return null;
    }
    const linePrefix = indent + (startsWithPlus ? '+ ' : '');
    const mergedLine = linePrefix + mergedSegments.join(' + ');
    return mergedLine === seg ? null : [mergedLine];
  }

  const segments = mergedSegments;

  if (segments.length === 1) {
    const literalInfo = parseStringLiteralSegment(segments[0]);
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

  if (effectiveStyle === 'one-per-line') {
    const lines: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
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
  const tryMergeWithLast = (segment: string, isLastSegment: boolean): string | null => {
    if (effectiveStyle !== 'compact' || currentSegments.length === 0) return null;
    const last = currentSegments[currentSegments.length - 1];
    const leftInfo = parseStringLiteralSegment(last);
    const rightInfo = parseStringLiteralSegment(segment);
    if (!leftInfo || !rightInfo) return null;
    if (leftInfo.suffix.trim().length > 0) return null;
    const rightSuffixTrim = rightInfo.suffix.trim();
    if (rightSuffixTrim.length > 0 && !isLastSegment) return null;
    if (leftInfo.quoteChar !== rightInfo.quoteChar) return null;
    const mergedSuffix = rightSuffixTrim.length > 0 ? rightInfo.suffix : '';
    return (
      `${leftInfo.quoteChar}${leftInfo.content}${rightInfo.content}${leftInfo.quoteChar}` +
      mergedSuffix
    );
  };

  // Push the current line buffer and reset state.
  const flushLine = (): void => {
    if (currentSegments.length > 0) {
      lines.push(linePrefix + currentSegments.join(' + '));
      linePrefix = indent + '+ ';
      currentSegments = [];
    }
  };

  // Try to append a segment if it fits the column limit.
  const tryAppendSegment = (segment: string, isLastSegment: boolean): boolean => {
    if (currentSegments.length === 0) {
      const candidate = linePrefix + segment;
      if (candidate.length <= columnLimit) {
        currentSegments.push(segment);
        return true;
      }
      return false;
    }
    const mergedCandidate = tryMergeWithLast(segment, isLastSegment);
    if (mergedCandidate) {
      const mergedSegments = currentSegments.slice(0, -1).concat(mergedCandidate);
      const mergedLine = linePrefix + mergedSegments.join(' + ');
      if (mergedLine.length <= columnLimit) {
        currentSegments = mergedSegments;
        return true;
      }
    }
    const candidate = linePrefix + currentSegments.join(' + ') + ' + ' + segment;
    if (candidate.length <= columnLimit) {
      currentSegments.push(segment);
      return true;
    }
    return false;
  };

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const isLastSegment = index === segments.length - 1;
    if (tryAppendSegment(segment, isLastSegment)) {
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
    if (!tryAppendSegment(segment, isLastSegment)) {
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
