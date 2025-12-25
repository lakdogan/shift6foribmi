import { Shift6Config } from '../config';
import {
  findFirstSpacedBinaryOperatorAfterLimit,
  findAssignmentRhsStart,
  findLastSpacedBinaryOperatorBeforeLimit,
  findSpacedBinaryOperatorColumn,
  getLeadingOperator,
  normalizeOperatorSpacing
} from './operators';
import { countLeadingSpaces } from './utils';

interface ContinuationState {
  pendingContinuation: string | null;
  continuationIndent: string;
  pendingTargetIndent: number | null;
}

function splitStringBySpaces(text: string, maxLen: number): { chunk: string; rest: string } | null {
  if (text.length <= maxLen) {
    return { chunk: text, rest: '' };
  }
  const splitAt = text.lastIndexOf(' ', maxLen);
  if (splitAt <= 0) return null;
  const chunk = text.slice(0, splitAt + 1);
  const rest = text.slice(splitAt + 1);
  return { chunk, rest };
}

// Compute effective wrap limit based on current vs target indent.
const getEffectiveColumnLimit = (
  line: string,
  targetIndent: number,
  cfg: Shift6Config
): number => {
  const currentIndent = countLeadingSpaces(line);
  return Math.max(1, cfg.continuationColumn - targetIndent + currentIndent);
};

// Find '//' comment start while ignoring string literals.
const findCommentIndexOutsideStrings = (text: string): number => {
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
      continue;
    }
    if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
      return i;
    }
  }
  return -1;
};

const LOGICAL_OPERATORS = ['AND', 'OR', 'XOR'];

const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

const matchLogicalOperator = (text: string, index: number): number | null => {
  const ch = text[index];
  const prev = index > 0 ? text[index - 1] : '';
  if (prev && isWordChar(prev)) return null;

  if (ch === '*') {
    const slice = text.substring(index + 1, index + 4);
    const upper = slice.toUpperCase();
    if (LOGICAL_OPERATORS.includes(upper)) {
      const next = text[index + 4] ?? '';
      if (!isWordChar(next)) {
        return 4;
      }
    }
    return null;
  }

  if (!/[A-Za-z]/.test(ch)) return null;
  let end = index + 1;
  while (end < text.length && isWordChar(text[end])) end++;
  const word = text.substring(index, end).toUpperCase();
  if (!LOGICAL_OPERATORS.includes(word)) return null;
  const next = text[end] ?? '';
  if (next && isWordChar(next)) return null;
  return end - index;
};

const splitBooleanAssignmentLine = (line: string): string[] | null => {
  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';
  const rhsStart = findAssignmentRhsStart(codePart);
  if (rhsStart === null) return null;

  const head = codePart.substring(0, rhsStart).trimEnd();
  if (head.trim().length === 0) return null;

  let inString = false;
  let quoteChar = '';
  let depth = 0;
  let start = rhsStart;
  const parts: string[] = [];

  for (let i = rhsStart; i < codePart.length; i++) {
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
    if (ch === '(') {
      depth++;
      continue;
    }
    if (ch === ')' && depth > 0) {
      depth--;
      continue;
    }
    if (depth === 0) {
      const opLength = matchLogicalOperator(codePart, i);
      if (opLength !== null) {
        const segment = codePart.substring(start, i).trim();
        if (segment.length === 0) return null;
        parts.push(segment);
        start = i;
        i += opLength - 1;
      }
    }
  }

  const tail = codePart.substring(start).trim();
  if (tail.length > 0) {
    parts.push(tail);
  }
  if (parts.length < 2) return null;

  const indent = codePart.match(/^(\s*)/)?.[1] ?? '';
  const lines = [head, ...parts.map((part) => indent + part.trim())];
  if (commentPart) {
    const last = lines.length - 1;
    const spacer = lines[last].endsWith(' ') ? '' : ' ';
    lines[last] = lines[last] + spacer + commentPart.trimStart();
  }
  return lines;
};

// Split a string by spaced '+' operators, skipping string literal content.
const splitBySpacedPlusOutsideStrings = (text: string): string[] => {
  const segments: string[] = [];
  let inString = false;
  let quoteChar = '';
  let segmentStart = 0;

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
      continue;
    }
    if (ch === '+' && i > 0 && i + 1 < text.length) {
      const prev = text[i - 1];
      const next = text[i + 1];
      if (prev === ' ' && next === ' ') {
        segments.push(text.substring(segmentStart, i));
        segmentStart = i + 1;
      }
    }
  }

  segments.push(text.substring(segmentStart));
  return segments;
};

// Check if a line ends with ';' outside of inline comments.
const lineEndsStatement = (text: string): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  return codePart.trimEnd().endsWith(';');
};

// Detect a trailing '+' outside of string literals.
const hasTrailingPlusOutsideStrings = (text: string): boolean => {
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
      continue;
    }
  }

  let end = text.length - 1;
  while (end >= 0 && (text[end] === ' ' || text[end] === '\t')) end--;
  if (end < 0 || text[end] !== '+') return false;
  return true;
};

// Remove a trailing '+' outside of string literals.
const removeTrailingPlusOutsideStrings = (text: string): string => {
  let end = text.length - 1;
  while (end >= 0 && (text[end] === ' ' || text[end] === '\t')) end--;
  if (end >= 0 && text[end] === '+') {
    return text.substring(0, end).trimEnd();
  }
  return text;
};

// Parse a standalone string literal segment with optional suffix punctuation.
const parseStringLiteralSegment = (
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

// Check if a line contains both a string literal and a '+' outside strings.
const lineHasStringConcat = (text: string, cfg: Shift6Config): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  let inString = false;
  let quoteChar = '';
  let hasLiteral = false;
  let hasPlus = false;

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
      hasLiteral = true;
      continue;
    }
    if (ch === '+') {
      hasPlus = true;
    }
  }

  return hasLiteral && hasPlus;
};

// Split literal content at word boundaries to fit a max length.
const splitLiteralContentToFit = (
  content: string,
  maxContent: number
): { chunk: string; rest: string } | null => {
  if (content.length <= maxContent) {
    return { chunk: content, rest: '' };
  }
  return splitStringBySpaces(content, maxContent);
};

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
function wrapConcatenatedLine(
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

  const flushLine = (): void => {
    if (currentSegments.length > 0) {
      lines.push(linePrefix + currentSegments.join(' + '));
      linePrefix = indent + '+ ';
      currentSegments = [];
    }
  };

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

// Initialize continuation tracking for wrapped binary expressions.
export function initContinuationState(): ContinuationState {
  return { pendingContinuation: null, continuationIndent: '', pendingTargetIndent: null };
}

interface HandleContinuationResult {
  consumed: boolean;
  producedLines: string[];
  state: ContinuationState;
  splitOccurred: boolean;
}

// Merge a continuation line into a pending long line when possible.
export function handleContinuationSegment(
  seg: string,
  lineIndex: number,
  lineCount: number,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number
): HandleContinuationResult {
  let splitOccurred = false;
  const producedLines: string[] = [];

  if (state.pendingContinuation === null) {
    if (
      !lineEndsStatement(seg) &&
      !getLeadingOperator(seg.trim()) &&
      lineHasStringConcat(seg, cfg)
    ) {
      state.pendingContinuation = seg;
      state.continuationIndent = seg.match(/^(\s*)/)?.[1] ?? '';
      state.pendingTargetIndent = targetIndent;
      splitOccurred = true;
      return { consumed: true, producedLines, state, splitOccurred };
    }

    if (hasTrailingPlusOutsideStrings(seg)) {
      state.pendingContinuation = seg;
      state.continuationIndent = seg.match(/^(\s*)/)?.[1] ?? '';
      state.pendingTargetIndent = targetIndent;
      splitOccurred = true;
      return { consumed: true, producedLines, state, splitOccurred };
    }
  }

  if (state.pendingContinuation !== null) {
    const pending = state.pendingContinuation;
    const trimmedSeg = seg.trim();
    const leadingOp = getLeadingOperator(trimmedSeg);
    if (leadingOp) {
      const merged: string = pending + ' ' + leadingOp + ' ' + trimmedSeg.substring(1).trimStart();
      const recombined = normalizeOperatorSpacing(merged, cfg);
      const continuationColumnLimit = getEffectiveColumnLimit(recombined, targetIndent, cfg);
      const wrapped = wrapConcatenatedLine(
        recombined,
        continuationColumnLimit,
        cfg.wrapLongStrings,
        cfg.concatStyle
      );
      if (wrapped) {
        const lastWrapped = wrapped[wrapped.length - 1];
        if (lastWrapped && hasTrailingPlusOutsideStrings(lastWrapped)) {
          wrapped.pop();
          producedLines.push(...wrapped);
          state.pendingContinuation = lastWrapped;
          state.continuationIndent = lastWrapped.match(/^(\s*)/)?.[1] ?? '';
          state.pendingTargetIndent = targetIndent;
        } else {
          producedLines.push(...wrapped);
          state.pendingContinuation = null;
          state.continuationIndent = '';
          state.pendingTargetIndent = null;
        }
        splitOccurred = true;
        return { consumed: true, producedLines, state, splitOccurred };
      }
      if (recombined.length > continuationColumnLimit) {
        const lastOp = findLastSpacedBinaryOperatorBeforeLimit(recombined, continuationColumnLimit);
        const splitAt =
          lastOp !== null
            ? lastOp
            : findFirstSpacedBinaryOperatorAfterLimit(recombined, continuationColumnLimit);
        if (splitAt !== null && splitAt > 1) {
          const opChar = recombined[splitAt];
          const left = recombined.substring(0, splitAt - 1);
          if (left.trim().length === 0) {
            return { consumed: false, producedLines: [], state, splitOccurred };
          }
          const right = recombined.substring(splitAt + 2);
          producedLines.push(left);
          producedLines.push(state.continuationIndent + opChar + ' ' + right.trimStart());
          state.pendingContinuation = null;
          state.continuationIndent = '';
          state.pendingTargetIndent = null;
          splitOccurred = true;
          return { consumed: true, producedLines, state, splitOccurred };
        }
      }
      const opColumn = findSpacedBinaryOperatorColumn(recombined);
      if (opColumn !== null && opColumn >= continuationColumnLimit) {
        producedLines.push(pending);
        producedLines.push(state.continuationIndent + leadingOp + ' ' + trimmedSeg.substring(1).trimStart());
        state.pendingContinuation = null;
        state.continuationIndent = '';
        state.pendingTargetIndent = null;
        splitOccurred = true;
        return { consumed: true, producedLines, state, splitOccurred };
      }
      state.pendingContinuation = merged;
      state.pendingTargetIndent = targetIndent;
      if (lineIndex === lineCount - 1) {
        producedLines.push(state.pendingContinuation);
        state.pendingContinuation = null;
        state.pendingTargetIndent = null;
      }
      splitOccurred = true;
      return { consumed: true, producedLines, state, splitOccurred };
    }

    if (trimmedSeg.length > 0 && (trimmedSeg[0] === '\'' || trimmedSeg[0] === '"')) {
      if (hasTrailingPlusOutsideStrings(pending)) {
        const base = removeTrailingPlusOutsideStrings(pending);
        const merged = base + ' + ' + trimmedSeg;
        const recombined = normalizeOperatorSpacing(merged, cfg);
        const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
        const continuationColumnLimit = getEffectiveColumnLimit(
          recombined,
          pendingTargetIndent,
          cfg
        );
        const wrapped = wrapConcatenatedLine(
          recombined,
          continuationColumnLimit,
          cfg.wrapLongStrings,
          cfg.concatStyle
        );
        if (wrapped) {
          const lastWrapped = wrapped[wrapped.length - 1];
          if (lastWrapped && hasTrailingPlusOutsideStrings(lastWrapped)) {
            wrapped.pop();
            producedLines.push(...wrapped);
            state.pendingContinuation = lastWrapped;
            state.continuationIndent = lastWrapped.match(/^(\s*)/)?.[1] ?? '';
            state.pendingTargetIndent = targetIndent;
          } else {
            producedLines.push(...wrapped);
            state.pendingContinuation = null;
            state.continuationIndent = '';
            state.pendingTargetIndent = null;
          }
          splitOccurred = true;
          return { consumed: true, producedLines, state, splitOccurred };
        }
        if (recombined.length > continuationColumnLimit) {
          const lastOp = findLastSpacedBinaryOperatorBeforeLimit(recombined, continuationColumnLimit);
          const splitAt =
            lastOp !== null
              ? lastOp
              : findFirstSpacedBinaryOperatorAfterLimit(recombined, continuationColumnLimit);
          if (splitAt !== null && splitAt > 1) {
            const opChar = recombined[splitAt];
            const left = recombined.substring(0, splitAt - 1);
            if (left.trim().length === 0) {
              return { consumed: false, producedLines: [], state, splitOccurred };
            }
            const right = recombined.substring(splitAt + 2);
            producedLines.push(left);
            producedLines.push(state.continuationIndent + opChar + ' ' + right.trimStart());
            state.pendingContinuation = null;
            state.continuationIndent = '';
            state.pendingTargetIndent = null;
            splitOccurred = true;
            return { consumed: true, producedLines, state, splitOccurred };
          }
        }
        state.pendingContinuation = merged;
        state.pendingTargetIndent = targetIndent;
        if (lineIndex === lineCount - 1) {
          producedLines.push(state.pendingContinuation);
          state.pendingContinuation = null;
          state.pendingTargetIndent = null;
        }
        splitOccurred = true;
        return { consumed: true, producedLines, state, splitOccurred };
      }

      if (!lineEndsStatement(pending) && lineHasStringConcat(pending, cfg)) {
        const merged = pending + ' + ' + trimmedSeg;
        const recombined = normalizeOperatorSpacing(merged, cfg);
        const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
        const continuationColumnLimit = getEffectiveColumnLimit(
          recombined,
          pendingTargetIndent,
          cfg
        );
        const wrapped = wrapConcatenatedLine(
          recombined,
          continuationColumnLimit,
          cfg.wrapLongStrings,
          cfg.concatStyle
        );
        if (wrapped) {
          producedLines.push(...wrapped);
          state.pendingContinuation = null;
          state.continuationIndent = '';
          state.pendingTargetIndent = null;
          splitOccurred = true;
          return { consumed: true, producedLines, state, splitOccurred };
        }
        if (recombined.length > continuationColumnLimit) {
          const lastOp = findLastSpacedBinaryOperatorBeforeLimit(recombined, continuationColumnLimit);
          const splitAt =
            lastOp !== null
              ? lastOp
              : findFirstSpacedBinaryOperatorAfterLimit(recombined, continuationColumnLimit);
          if (splitAt !== null && splitAt > 1) {
            const opChar = recombined[splitAt];
            const left = recombined.substring(0, splitAt - 1);
            if (left.trim().length === 0) {
              return { consumed: false, producedLines: [], state, splitOccurred };
            }
            const right = recombined.substring(splitAt + 2);
            producedLines.push(left);
            producedLines.push(state.continuationIndent + opChar + ' ' + right.trimStart());
            state.pendingContinuation = null;
            state.continuationIndent = '';
            state.pendingTargetIndent = null;
            splitOccurred = true;
            return { consumed: true, producedLines, state, splitOccurred };
          }
        }
        state.pendingContinuation = merged;
        state.pendingTargetIndent = pendingTargetIndent;
        if (lineIndex === lineCount - 1) {
          producedLines.push(state.pendingContinuation);
          state.pendingContinuation = null;
          state.pendingTargetIndent = null;
        }
        splitOccurred = true;
        return { consumed: true, producedLines, state, splitOccurred };
      }
    }

    const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
    const pendingNormalized = normalizeOperatorSpacing(pending, cfg);
    const pendingLimit = getEffectiveColumnLimit(pendingNormalized, pendingTargetIndent, cfg);
    const wrappedPending = wrapConcatenatedLine(
      pendingNormalized,
      pendingLimit,
      cfg.wrapLongStrings,
      cfg.concatStyle
    );
    if (wrappedPending) {
      producedLines.push(...wrappedPending);
    } else {
      producedLines.push(pending);
    }
    state.pendingContinuation = null;
    state.continuationIndent = '';
    state.pendingTargetIndent = null;
    return { consumed: false, producedLines, state, splitOccurred };
  }

  return { consumed: false, producedLines, state, splitOccurred };
}

// Split long binary-operator lines across continuation lines within column limits.
export function wrapLongLine(
  seg: string,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number
): { producedLines: string[]; state: ContinuationState; splitOccurred: boolean } {
  const producedLines: string[] = [];
  let splitOccurred = false;

  let normalized = normalizeOperatorSpacing(seg, cfg);
  const booleanSplit = splitBooleanAssignmentLine(normalized);
  if (booleanSplit) {
    return { producedLines: booleanSplit, state, splitOccurred: true };
  }
  const continuationColumnLimit = getEffectiveColumnLimit(normalized, targetIndent, cfg);

  const wrappedConcat = wrapConcatenatedLine(
    normalized,
    continuationColumnLimit,
    cfg.wrapLongStrings,
    cfg.concatStyle
  );
  if (wrappedConcat) {
    const lastWrapped = wrappedConcat[wrappedConcat.length - 1];
    if (lastWrapped && hasTrailingPlusOutsideStrings(lastWrapped)) {
      wrappedConcat.pop();
      producedLines.push(...wrappedConcat);
      state.pendingContinuation = lastWrapped;
      state.continuationIndent = lastWrapped.match(/^(\s*)/)?.[1] ?? '';
      state.pendingTargetIndent = targetIndent;
      return { producedLines, state, splitOccurred: true };
    }
    return { producedLines: wrappedConcat, state, splitOccurred: true };
  }
  let didSplit = false;
  let splitIterations = 0;
  let prevLength = normalized.length;

  while (normalized.length > continuationColumnLimit) {
    splitIterations++;
    if (splitIterations > 200) break;

    const indentMatch = normalized.match(/^(\s*)/);
    state.continuationIndent = indentMatch ? indentMatch[1] : '';
    const lastOpBeforeLimit = findLastSpacedBinaryOperatorBeforeLimit(normalized, continuationColumnLimit);
    const splitAt =
      lastOpBeforeLimit !== null
        ? lastOpBeforeLimit
        : findFirstSpacedBinaryOperatorAfterLimit(normalized, continuationColumnLimit);
    if (splitAt !== null && splitAt > 1) {
      const opChar = normalized[splitAt];
      const left = normalized.substring(0, splitAt - 1);
      if (left.trim().length === 0) break;
      const right = normalized.substring(splitAt + 2);
      producedLines.push(left);
      normalized = state.continuationIndent + opChar + ' ' + right.trimStart();
      splitOccurred = true;
      didSplit = true;
      if (normalized.length >= prevLength) break;
      prevLength = normalized.length;
      continue;
    }
    break;
  }

  if (didSplit) {
    if (hasTrailingPlusOutsideStrings(normalized)) {
      state.pendingContinuation = normalized;
      state.pendingTargetIndent = targetIndent;
      return { producedLines, state, splitOccurred };
    }
    producedLines.push(normalized);
    return { producedLines, state, splitOccurred };
  }

  const opColumn = findSpacedBinaryOperatorColumn(normalized);
  if (opColumn !== null && opColumn >= continuationColumnLimit) {
    const indentMatch = normalized.match(/^(\s*)/);
    state.continuationIndent = indentMatch ? indentMatch[1] : '';
    const lastOpIndex = findLastSpacedBinaryOperatorBeforeLimit(normalized, normalized.length - 1);
    if (lastOpIndex !== null && lastOpIndex > 1) {
      const opChar = normalized[lastOpIndex];
      const left = normalized.substring(0, lastOpIndex - 1);
      const right = normalized.substring(lastOpIndex + 2);
      producedLines.push(left);
      state.pendingContinuation = state.continuationIndent + opChar + ' ' + right.trimStart();
      state.pendingTargetIndent = targetIndent;
      splitOccurred = true;
      return { producedLines, state, splitOccurred };
    }
  }

  producedLines.push(seg);
  return { producedLines, state, splitOccurred };
}
