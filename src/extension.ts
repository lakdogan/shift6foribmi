// Shift6 Formatter by Levent Akdogan (Lakdogan)
import * as vscode from 'vscode';

// --------------------------------------------------------
// Configuration & Constants
// --------------------------------------------------------

interface Shift6Config {
  spaces: number;
  targetBaseIndent: number;
  blockIndent: number;
  normalizedFree: string;
  collapseTokenSpaces: boolean;
  trimStringParentheses: boolean;
  alignPlusContinuation: boolean;
  continuationColumn: number;
  joinAsteriskTokensInDecl: boolean;
}

const CLOSERS = [
  'END-PROC',
  'ENDPROC',
  'ENDIF',
  'END-IF',
  'ENDDO',
  'END-DO',
  'ENDSL',
  'END-SELECT',
  'ENDSELECT',
  'ENDMON',
  'END-MON',
  'ENDSR',
  'END-SR',
  'ENDFOR',
  'END-FOR',
  'ENDON-EXIT',
  'END-DS',
  'END-PR',
  'END-PI',
  'END-ENUM',
  '/ENDIF'
];

const OPENERS = ['DCL-PROC', 'IF', 'DOW', 'DOU', 'MONITOR', 'FOR', 'SELECT', 'BEGSR', 'DCL-DS', 'DCL-PR', 'DCL-PI', 'DCL-ENUM', '/IF'];
const MID_KEYWORDS = [
  'ELSE',
  'ELSEIF',
  'ELSE IF',
  'WHEN',
  'WHEN-IS',
  'WHEN-IN',
  'OTHER',
  'ON-ERROR',
  'ON-EXIT',
  '/ELSE',
  '/ELSEIF'
];
const DASH_KEYWORD_PREFIX = /^(DCL|END|ON|WHEN|ELSE|CTL)-[A-Z0-9-]+$/;

const PATTERNS = [
  '**/*.rpgle',
  '**/*.sqlrpgle',
  '**/*.rpg',
  '**/*.sqlrpg',
  '**/*.rpginc',
  '**/*.rpgleinc'
];

const LANGUAGE_IDS = ['rpgle', 'sqlrpgle', 'rpg', 'rpginc'];

// --------------------------------------------------------
// Document Helpers
// --------------------------------------------------------

function getFullDocumentRange(document: vscode.TextDocument, textLength?: number): vscode.Range {
  const length = textLength ?? document.getText().length;
  const end = document.positionAt(length);
  return new vscode.Range(new vscode.Position(0, 0), end);
}

// --------------------------------------------------------
// Utility Functions
// --------------------------------------------------------

const startsWithKeyword = (upperText: string, keywords: string[]): boolean =>
  keywords.some((kw) => upperText.startsWith(kw));

const containsKeywordToken = (upperText: string, keywords: string[]): boolean => {
  const tokens = upperText.split(/[^A-Z0-9*\/-]+/).filter(Boolean);
  return keywords.some((kw) => tokens.includes(kw));
};

const countLeadingSpaces = (text: string): number => {
  let i = 0;
  while (i < text.length && text.charAt(i) === ' ') {
    i++;
  }
  return i;
};

const isWhitespace = (ch: string): boolean => ch === ' ' || ch === '\t';
const CONTINUATION_OPERATORS = ['+', '-', '*', '/', '%'];
const SPECIAL_VALUES = [
  'ON',
  'OFF',
  'FILE',
  'PROGRAM',
  'BLANK',
  'BLANKS',
  'ZERO',
  'ZEROS',
  'ZEROES',
  'NULL',
  'HIVAL',
  'LOVAL',
  'ALL',
  'NONE',
  'OMIT',
  'TRUE',
  'FALSE',
  'INLR',
  'PARMS',
  'STATUS',
  'PSSR',
  'ENTRY',
  'VARS',
  'PDA',
  'LDA',
  'ISOPEN',
  'INZSR',
  'USA',
  'ISO',
  'EUR',
  'JIS',
  'JUL',
  'MDY',
  'DMY',
  'YMD',
  'HMS',
  'JOB',
  'USER',
  'SYSTEM',
  'LANGID',
  'SRCSTMT',
  'DATE',
  'DAY',
  'MONTH',
  'YEAR',
  'TIME',
  'TIMESTAMP'
];
const SPECIAL_VALUE_KEYWORDS = new Set([
  'IF',
  'ELSEIF',
  'WHEN',
  'DOW',
  'DOU',
  'FOR',
  'SELECT',
  'MONITOR',
  'ON-ERROR',
  'ON-EXIT',
  'AND',
  'OR',
  'NOT',
  'XOR',
  'DCL-PI',
  'DCL-PR',
  'DCL-PROC'
]);
const SPECIAL_VALUE_CONTEXTS = [
  'IF',
  'ELSEIF',
  'WHEN',
  'DOW',
  'DOU',
  'FOR',
  'ON-ERROR',
  'ON-EXIT'
];

const isTokenChar = (ch: string): boolean => /[A-Za-z0-9_@#$\])}\(.'"]/.test(ch);

const isDashKeywordToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return DASH_KEYWORD_PREFIX.test(token);
};

const isSlashDirectiveToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return /^\/[A-Z][A-Z0-9_]*$/.test(token);
};

const getPrevToken = (text: string, index: number): string | null => {
  let j = index - 1;
  while (j >= 0 && isWhitespace(text[j])) j--;
  if (j < 0) return null;
  let end = j;
  while (j >= 0 && /[A-Za-z0-9-]/.test(text[j])) j--;
  if (end < 0) return null;
  const token = text.slice(j + 1, end + 1).toUpperCase();
  return token.length > 0 ? token : null;
};

const isSpecialValueToken = (text: string, index: number): boolean => {
  let j = index + 1;
  while (j < text.length && isWhitespace(text[j])) j++;
  let k = j;
  while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
  if (k <= j) return false;
  const token = text.substring(j, k).toUpperCase();
  if (token === 'N') {
    const prevToken = getPrevToken(text, index);
    if (prevToken !== null && SPECIAL_VALUE_KEYWORDS.has(prevToken)) {
      return true;
    }
    for (let p = index - 1; p >= 0; p--) {
      if (!isWhitespace(text[p])) return false;
    }
    return true;
  }
  return SPECIAL_VALUES.includes(token) || /^IN[0-9]{2}$/.test(token);
};

function getLeadingOperator(text: string): string | null {
  const trimmed = text.trimStart();
  if (trimmed.length === 0) return null;
  return CONTINUATION_OPERATORS.includes(trimmed[0]) ? trimmed[0] : null;
}

function findAssignmentRhsStart(line: string): number | null {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';

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

    if (ch === '=') {
      const prev = i > 0 ? codePart[i - 1] : '';
      const next = i + 1 < codePart.length ? codePart[i + 1] : '';
      if (prev === '<' || prev === '>' || next === '=') {
        continue;
      }
      return i + 2;
    }
  }

  return null;
}

function normalizeBinaryOperatorSpacing(text: string, cfg: Shift6Config): string {
  const trimmedStart = text.trimStart();
  if (/^\/[A-Za-z]/.test(trimmedStart)) {
    return text;
  }
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

    if (CONTINUATION_OPERATORS.includes(ch)) {
      const prevIndex = (() => {
        let j = i - 1;
        while (j >= 0 && isWhitespace(text[j])) j--;
        return j;
      })();
      const nextIndex = (() => {
        let j = i + 1;
        while (j < text.length && isWhitespace(text[j])) j++;
        return j;
      })();
      const prevChar = prevIndex >= 0 ? text[prevIndex] : '';
      const nextChar = nextIndex < text.length ? text[nextIndex] : '';

      if (ch === '%' && /[A-Za-z]/.test(nextChar)) {
        result += ch;
        continue;
      }
      if (ch === '*' && isSpecialValueToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '-' && isDashKeywordToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '/' && isSlashDirectiveToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '*' && (prevChar === '*' || nextChar === '*')) {
        result += ch;
        continue;
      }
      if (nextChar === '=') {
        result += ch;
        continue;
      }

      const isBinary = isTokenChar(prevChar) && isTokenChar(nextChar);
      const isLeading = prevIndex < 0;

      if (isBinary || isLeading) {
        while (result.endsWith(' ')) {
          result = result.slice(0, -1);
        }
        if (ch === '*' && cfg.joinAsteriskTokensInDecl) {
          const trimmed = text.trimStart().toUpperCase();
          if (
            trimmed.startsWith('DCL-PI') ||
            trimmed.startsWith('DCL-PR') ||
            trimmed.startsWith('DCL-PROC') ||
            trimmed.startsWith('CTL-OPT')
          ) {
            result += (isLeading ? '' : ' ') + ch;
            continue;
          }
        }
        result += (isLeading ? '' : ' ') + ch + ' ';
        i = nextIndex - 1;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

function normalizePercentBuiltins(text: string): string {
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

    if (ch === '%') {
      let j = i + 1;
      while (j < text.length && isWhitespace(text[j])) j++;
      let k = j;
      while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
      if (k > j && j > i + 1) {
        result += '%' + text.substring(j, k);
        i = k - 1;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

function normalizeSpecialValueSpacing(text: string): string {
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

    if (ch === '*') {
      const prevToken = getPrevToken(text, i);
      const prevTokenAllowed = prevToken !== null && SPECIAL_VALUE_KEYWORDS.has(prevToken);
      let j = i + 1;
      while (j < text.length && isWhitespace(text[j])) j++;
      let k = j;
      while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
      if (k > j) {
        const token = text.substring(j, k).toUpperCase();
        if (prevTokenAllowed) {
          if (token === 'IN') {
            let m = k;
            while (m < text.length && isWhitespace(text[m])) m++;
            const inDigits = text.substring(m, m + 2);
            if (/^[0-9]{2}$/.test(inDigits)) {
              result += '*IN' + inDigits;
              i = m + 1;
              continue;
            }
          }
          if (token === 'N' || SPECIAL_VALUES.includes(token)) {
            result += '*' + text.substring(j, k);
            i = k - 1;
            continue;
          }
        }
        const isSpecial = isSpecialValueToken(text, i);
        if (isSpecial && j > i + 1 && prevTokenAllowed) {
          result += '*' + text.substring(j, k);
          i = k - 1;
          continue;
        }
      }
    }

    result += ch;
  }

  return result;
}

function findSpacedBinaryOperatorColumn(line: string): number | null {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';

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

    if (CONTINUATION_OPERATORS.includes(ch) && i > 0 && i + 1 < codePart.length) {
      if (isWhitespace(codePart[i - 1]) && isWhitespace(codePart[i + 1])) {
        return i;
      }
    }
  }

  return null;
}

function findLastSpacedBinaryOperatorBeforeLimit(line: string, limit: number): number | null {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';
  let last: number | null = null;
  const max = Math.min(codePart.length - 1, limit);

  for (let i = 0; i <= max; i++) {
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

    if (CONTINUATION_OPERATORS.includes(ch) && i > 0 && i + 1 < codePart.length) {
      if (isWhitespace(codePart[i - 1]) && isWhitespace(codePart[i + 1])) {
        last = i;
      }
    }
  }

  return last;
}

function findFirstSpacedBinaryOperatorAfterLimit(line: string, limit: number): number | null {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';
  const start = Math.max(0, limit + 1);

  for (let i = start; i < codePart.length; i++) {
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

    if (CONTINUATION_OPERATORS.includes(ch) && i > 0 && i + 1 < codePart.length) {
      if (isWhitespace(codePart[i - 1]) && isWhitespace(codePart[i + 1])) {
        return i;
      }
    }
  }

  return null;
}

/** Trims inner whitespace when parentheses contain only a single string literal */
function trimStringOnlyParentheses(text: string): string {
  return text.replace(/\(\s*(['"][^'"]*['"])\s*\)/g, '($1)');
}

/** Collapses multiple spaces to one outside of string literals */
function collapseExtraSpacesOutsideStrings(text: string): string {
  let result = '';
  let inString = false;
  let quoteChar = '';
  let pendingSpace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (ch === quoteChar) {
        // Handle doubled quotes inside strings ('' -> literal ')
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
      if (pendingSpace) {
        result += ' ';
        pendingSpace = false;
      }
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace) {
      result += ' ';
      pendingSpace = false;
    }
    result += ch;
  }

  if (pendingSpace) {
    result += ' ';
  }

  return result;
}

/** Reads user configuration from VS Code settings */
function getConfig(): Shift6Config {
  const spaces = vscode.workspace.getConfiguration().get<number>('shift6.spaces', 6);
  const blockIndent = Math.max(
    0,
    vscode.workspace.getConfiguration().get<number>('shift6.blockIndent', 2)
  );
  const collapseTokenSpaces = vscode.workspace
    .getConfiguration()
    .get<boolean>('shift6.collapseTokenSpaces', true);
  const trimStringParentheses = vscode.workspace
    .getConfiguration()
    .get<boolean>('shift6.trimStringParentheses', true);
  const alignPlusContinuation = vscode.workspace
    .getConfiguration()
    .get<boolean>('shift6.alignPlusContinuation', true);
  const continuationColumnRaw = vscode.workspace
    .getConfiguration()
    .get<number | string>('shift6.continuationColumn', 66);
  const continuationColumnValue = Number(continuationColumnRaw);
  const continuationColumn = Number.isFinite(continuationColumnValue)
    ? Math.max(1, Math.floor(continuationColumnValue))
    : 66;
  const joinAsteriskTokensInDecl = vscode.workspace
    .getConfiguration()
    .get<boolean>('shift6.joinAsteriskTokensInDecl', true);

  return {
    spaces,
    targetBaseIndent: Math.max(0, spaces),
    blockIndent,
    normalizedFree: '**free',
    collapseTokenSpaces,
    trimStringParentheses,
    alignPlusContinuation,
    continuationColumn,
    joinAsteriskTokensInDecl
  };
}

// --------------------------------------------------------
// Statement Splitting
// --------------------------------------------------------

/**
 * Splits RPG statements at semicolons while keeping indentation,
 * comments and preventing invalid empty segments.
 */
function splitStatements(line: string): string[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) return [line];

  const trimmedStart = line.trimStart();
  if (trimmedStart.startsWith('//')) return [line];

  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  // Normalize repeated semicolons like ";; ;;;" → ";"
  const normalizedCode = codePart.replace(/;[ \t]*;+/g, ';');

  if (!normalizedCode.includes(';')) return [line];

  const lineIndent = line.match(/^ */)?.[0] ?? '';
  const pieces = normalizedCode.split(';');
  const endsWithSemicolon = normalizedCode.trimEnd().endsWith(';');
  const segments: string[] = [];
  let pendingSemicolon = false;

  for (let idx = 0; idx < pieces.length; idx++) {
    const seg = pieces[idx].trim();
    const punctuationOnly = /^[.,]+$/.test(seg);
    const hadSemicolon = idx < pieces.length - 1 || endsWithSemicolon;

    if (seg.length === 0 || punctuationOnly) {
      pendingSemicolon ||= hadSemicolon;
      continue;
    }

    const appendSemicolon = hadSemicolon || pendingSemicolon;
    segments.push(lineIndent + seg + (appendSemicolon ? ';' : ''));
    pendingSemicolon = false;
  }

  // Reattach comment to last segment
  if (commentPart && segments.length > 0) {
    const last = segments.length - 1;
    const spacer = segments[last].endsWith(' ') ? '' : ' ';
    segments[last] += spacer + commentPart;
  }

  return segments.length <= 1 ? segments : segments;
}

// --------------------------------------------------------
// Document Preprocessing (**FREE handling, splitting)
// --------------------------------------------------------

interface PreprocessResult {
  linesToProcess: string[];
  freeNeedsTrim: boolean;
  splitOccurred: boolean;
  firstLineText: string;
  lineCount: number;
}

/**
 * Removes duplicate **FREE directives,
 * splits multi-statements into separate lines,
 * and prepares lines for indentation formatting.
 */
function preprocessDocument(lines: string[], cfg: Shift6Config): PreprocessResult {
  const lineCount = lines.length;
  const firstLineText = lineCount > 0 ? lines[0] : '';
  const freeNeedsTrim = firstLineText.trim().toLowerCase() !== cfg.normalizedFree;

  const linesToProcess: string[] = [];
  let splitOccurred = false;
  let pendingContinuation: string | null = null;
  let continuationIndent = '';
  const continuationColumnLimit = cfg.continuationColumn;

  for (let i = 0; i < lineCount; i++) {
    const original = lines[i];
    const upper = original.trimStart().toUpperCase();

    // Handle **FREE declarations
    if (upper.startsWith('**FREE')) {
      const after = original.slice(original.toUpperCase().indexOf('**FREE') + 6).trimStart();
      if (after.length === 0) continue;

      const segments = splitStatements(after);
      for (const s of segments) {
        if (!s.trimStart().toUpperCase().startsWith('**FREE')) {
          linesToProcess.push(s);
        } else {
          splitOccurred = true;
        }
      }
      continue;
    }

    const segments = splitStatements(original);
    for (const seg of segments) {
      if (seg.trimStart().toUpperCase().startsWith('**FREE')) {
        splitOccurred = true;
        continue;
      }
      if (pendingContinuation !== null) {
        const pending = pendingContinuation;
        const trimmedSeg = seg.trim();
        const leadingOp = getLeadingOperator(trimmedSeg);
        if (leadingOp) {
          const merged: string = pending + ' ' + leadingOp + ' ' + trimmedSeg.substring(1).trimStart();
          const recombined = normalizeOperatorSpacing(merged, cfg);
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
                break;
              }
              const right = recombined.substring(splitAt + 2);
              linesToProcess.push(left);
              linesToProcess.push(continuationIndent + opChar + ' ' + right.trimStart());
              pendingContinuation = null;
              continuationIndent = '';
              splitOccurred = true;
              continue;
            }
          }
          const opColumn = findSpacedBinaryOperatorColumn(recombined);
          if (opColumn !== null && opColumn >= continuationColumnLimit) {
            linesToProcess.push(pending);
            linesToProcess.push(continuationIndent + leadingOp + ' ' + trimmedSeg.substring(1).trimStart());
            pendingContinuation = null;
            continuationIndent = '';
            splitOccurred = true;
            continue;
          }
          pendingContinuation = merged;
          if (i === lineCount - 1) {
            linesToProcess.push(pendingContinuation);
            pendingContinuation = null;
          }
          splitOccurred = true;
          continue;
        } else {
          linesToProcess.push(pending);
          pendingContinuation = null;
          continuationIndent = '';
        }
      }

      let normalized = normalizeOperatorSpacing(seg, cfg);
      let didSplit = false;
      let splitIterations = 0;
      let prevLength = normalized.length;
      while (normalized.length > continuationColumnLimit) {
        splitIterations++;
        if (splitIterations > 200) {
          break;
        }
        const indentMatch = normalized.match(/^(\s*)/);
        continuationIndent = indentMatch ? indentMatch[1] : '';
        const lastOpBeforeLimit = findLastSpacedBinaryOperatorBeforeLimit(normalized, continuationColumnLimit);
        const splitAt =
          lastOpBeforeLimit !== null
            ? lastOpBeforeLimit
            : findFirstSpacedBinaryOperatorAfterLimit(normalized, continuationColumnLimit);
        if (splitAt !== null && splitAt > 1) {
          const opChar = normalized[splitAt];
          const left = normalized.substring(0, splitAt - 1);
          if (left.trim().length === 0) {
            break;
          }
          const right = normalized.substring(splitAt + 2);
          linesToProcess.push(left);
          normalized = continuationIndent + opChar + ' ' + right.trimStart();
          splitOccurred = true;
          didSplit = true;
          if (normalized.length >= prevLength) {
            break;
          }
          prevLength = normalized.length;
          continue;
        }
        break;
      }

      if (didSplit) {
        linesToProcess.push(normalized);
        continue;
      } else {
        const opColumn = findSpacedBinaryOperatorColumn(normalized);
        if (opColumn !== null && opColumn >= continuationColumnLimit) {
          const indentMatch = normalized.match(/^(\s*)/);
          continuationIndent = indentMatch ? indentMatch[1] : '';
          const lastOpIndex = findLastSpacedBinaryOperatorBeforeLimit(
            normalized,
            normalized.length - 1
          );
          if (lastOpIndex !== null && lastOpIndex > 1) {
            const opChar = normalized[lastOpIndex];
            const left = normalized.substring(0, lastOpIndex - 1);
            const right = normalized.substring(lastOpIndex + 2);
            linesToProcess.push(left);
            pendingContinuation = continuationIndent + opChar + ' ' + right.trimStart();
            splitOccurred = true;
            continue;
          }
        }
        linesToProcess.push(seg);
      }
    }
  }

  if (pendingContinuation !== null) {
    linesToProcess.push(pendingContinuation);
  }

  return {
    linesToProcess,
    freeNeedsTrim,
    splitOccurred,
    firstLineText,
    lineCount
  };
}

/**
 * Normalizes spaces around logical and comparison/assignment operators.
 *
 * Rules:
 *  - <=, >=, <>  → exactly one space on each side
 *  - <, >        → exactly one space on each side
 *  - =           → exactly one space on each side
 *  - +=, -=, *=, /=, %= → one space before the operator and one after the '='
 *  - AND, OR, NOT, XOR, *AND, *OR, *NOT, *XOR → one space before and after
 *
 * Comments starting with // are preserved.
 */
function normalizeOperatorSpacing(line: string, cfg: Shift6Config): string {
  const trimmedStart = line.trimStart();
  const isCtlOptLine = trimmedStart.toUpperCase().startsWith('CTL-OPT');
  const isDeclLine = (() => {
    const upper = trimmedStart.toUpperCase();
    return upper.startsWith('DCL-PI') || upper.startsWith('DCL-PR') || upper.startsWith('DCL-PROC');
  })();

  // Leave pure comment lines untouched
  if (trimmedStart.startsWith('//')) {
    return line;
  }

  // Separate code and comment part
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  // Keep indentation separate from code
  const match = codePart.match(/^(\s*)(.*)$/);
  const indent = match ? match[1] : '';
  let rest = match ? match[2] : codePart;

  // Trim spaces around string-only parentheses: (   'text'   ) -> ('text')
  if (cfg.trimStringParentheses) {
    rest = trimStringOnlyParentheses(rest);
  }

  // Trim spaces inside ctl-opt parentheses: ( *no ) -> (*no)
  if (isCtlOptLine) {
    rest = rest.replace(/\(\s+([^)]+?)\)/g, '($1)');
    rest = rest.replace(/\(([^)]+?)\s+\)/g, '($1)');
  }

  // Join builtins like %int, %char, %trim (no space after %)
  rest = normalizePercentBuiltins(rest);

  // Normalize spacing around binary arithmetic operators (+, -, *, /, %)
  rest = normalizeBinaryOperatorSpacing(rest, cfg);

  // Join leading * tokens inside declaration bodies (e.g., "* n;" -> "*n;")
  if (cfg.joinAsteriskTokensInDecl) {
    rest = rest.replace(/(^|[(\s])\*\s+([A-Za-z0-9_]+)/, '$1*$2');
  }

  // Join * tokens after DCL-PI/DCL-PR/DCL-PROC keywords (e.g., "dcl-pi * n;" -> "dcl-pi *n;")
  if (cfg.joinAsteriskTokensInDecl && isDeclLine) {
    rest = rest.replace(/(\bDCL-(?:PI|PR|PROC)\b)\s+\*\s+([A-Za-z0-9_]+)/i, '$1 *$2');
  }

  // Join RPG special values like *Program, *File, *On, *Off (no space after *)
  rest = normalizeSpecialValueSpacing(rest);

  // Ensure multiplication uses spaces around * when between tokens
  if (!isDeclLine) {
    rest = rest.replace(/([A-Za-z0-9_)\]])\s*\*\s*([A-Za-z0-9_\(])/g, '$1 * $2');
  }

  // Force-join special values in common contexts (e.g., "if * on" -> "if *on")
  const contextPattern = new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
  rest = rest.replace(contextPattern, '$1 *$2');
  rest = rest.replace(/\b(IF|ELSEIF|WHEN|DOW|DOU|FOR|ON-ERROR|ON-EXIT)\s+\*\s+IN\s*([0-9]{2})\b/gi, '$1 *IN$2');

  // Normalize ctl-opt parentheses after operator spacing (e.g., (* no ) -> (*no))
  if (isCtlOptLine) {
    rest = rest.replace(/\(\s*([^)]+?)\s*\)/g, (_match, inner: string) => {
      const joined = inner.replace(/\*\s+([A-Za-z0-9_]+)/g, '*$1');
      return `(${joined})`;
    });
  }

  // --- 1) Protect relational operators with placeholders --------------------
  rest = rest.replace(/\s*<=\s*/g, ' __LE__ ');
  rest = rest.replace(/\s*>=\s*/g, ' __GE__ ');
  rest = rest.replace(/\s*<>\s*/g, ' __NE__ ');

  // --- 2) Protect compound assignment operators -----------------------------
  // Matches: "+ =", " + = ", "+= ", etc.
  rest = rest.replace(/\s*([+\-*/%])\s*=\s*/g, ' __CASSIGN_$1__ ');

  // --- 3) Normalize simple < and > -----------------------------------------
  rest = rest.replace(/\s*<\s*/g, ' < ');
  rest = rest.replace(/\s*>\s*/g, ' > ');

  // --- 4) Normalize plain = --------------------------------------------------
  rest = rest.replace(/\s*=\s*/g, ' = ');

  // --- 5) Restore relational placeholders -----------------------------------
  rest = rest.replace(/__LE__/g, ' <= ');
  rest = rest.replace(/__GE__/g, ' >= ');
  rest = rest.replace(/__NE__/g, ' <> ');

  // --- 6) Restore compound assignments ---------------------------------------
  // Example result: " += "
  rest = rest.replace(/__CASSIGN_([+\-*/%])__/g, ' $1= ');

  // --- 7) ENFORCE EXACTLY ONE SPACE BEFORE +=, -=, *=, /=, %= ----------------
  // Removes multiple spaces before operator
  rest = rest.replace(/\s+([+\-*/%]=)/g, ' $1');

  // Ensure exactly one space after the compound assignment
  rest = rest.replace(/([+\-*/%]=)\s+/g, '$1 ');

  // --- 8) Logical keyword operators -----------------------------------------
  rest = rest.replace(/\s*\b(AND|OR|NOT|XOR)\b\s*/gi, ' $1 ');

  // --- 9) Star logical operators ---------------------------------------------
  rest = rest.replace(/\s*(\*AND|\*OR|\*NOT|\*XOR)\s*/gi, ' $1 ');

  // --- 10) Collapse extra spaces outside of string literals -------------------
  if (cfg.collapseTokenSpaces) {
    rest = collapseExtraSpacesOutsideStrings(rest);
  }

  return indent + rest + commentPart;
}


// --------------------------------------------------------
// Core Formatting (Indentation)
// --------------------------------------------------------

interface FormatCoreResult {
  resultLines: string[];
  anyChanged: boolean;
}

/**
 * Applies indentation rules based on RPG block structure
 * and normalizes spaces around operators.
 */
function formatCore(pre: PreprocessResult, cfg: Shift6Config): FormatCoreResult {
  let resultLines: string[] = [];
  let anyChanged = false;
  let indentLevel = 0;
  let procDepth = 0;
  let continuationOperatorColumn: number | null = null;

  // Always enforce **FREE as first line
  resultLines.push(cfg.normalizedFree);
  if (cfg.normalizedFree !== pre.firstLineText) {
    anyChanged = true;
  }

  for (const original of pre.linesToProcess) {
    const trimmed = original.trim();
    const upper = trimmed.toUpperCase();
    const upperNoComment = upper.split('//')[0];

    const isCloser = startsWithKeyword(upper, CLOSERS);
    const isMid = startsWithKeyword(upper, MID_KEYWORDS);
    const isOpener = startsWithKeyword(upper, OPENERS);
    const isProcStart = upper.startsWith('DCL-PROC');
    const isProcEnd = upper.startsWith('END-PROC') || upper.startsWith('ENDPROC');
    const hasInlineCloser = containsKeywordToken(upperNoComment, CLOSERS);
    const isInlineDclDs =
      upper.startsWith('DCL-DS') &&
      trimmed.endsWith(';') &&
      !containsKeywordToken(upperNoComment, ['END-DS', 'ENDDS']) &&
      /\b(LIKEDS|EXTNAME)\b/i.test(upperNoComment);

    // Dedent before mid/closer lines
    if (isCloser || isMid) {
      if (!(isProcEnd && procDepth === 0)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      if (isProcEnd && procDepth > 0) {
        procDepth--;
      }
    }

    // Apply indentation to this line
    const currentIndent = countLeadingSpaces(original);
    const target = cfg.targetBaseIndent + indentLevel * cfg.blockIndent;
    let newText: string;

    if (currentIndent < target) {
      newText = ' '.repeat(target - currentIndent) + original;
    } else if (currentIndent > target) {
      newText = original.substring(currentIndent - target);
    } else {
      newText = original;
    }

    // Normalize spaces around operators (=, <, >, <=, >=, <>, AND, OR, NOT, *AND, *OR, ...)
    const normalized = normalizeOperatorSpacing(newText, cfg);
    if (normalized !== newText) {
      newText = normalized;
      anyChanged = true;
    }

    const trimmedStart = newText.trimStart();
    const isCommentOnly = trimmedStart.startsWith('//');
    const leadingOperator = getLeadingOperator(newText);

    if (cfg.alignPlusContinuation && leadingOperator && continuationOperatorColumn !== null) {
      const desiredIndent = Math.max(target, continuationOperatorColumn);
      const aligned = ' '.repeat(desiredIndent) + trimmedStart;
      if (aligned !== newText) {
        newText = aligned;
        anyChanged = true;
      }
    }

    resultLines.push(newText);
    if (newText !== original) {
      anyChanged = true;
    }

    if (cfg.alignPlusContinuation) {
      if (isCommentOnly) {
        continuationOperatorColumn = null;
      } else {
        const commentIndex = newText.indexOf('//');
        const codePart = commentIndex >= 0 ? newText.substring(0, commentIndex) : newText;
        const endsStatement = codePart.trimEnd().endsWith(';');

        if (leadingOperator) {
          if (continuationOperatorColumn === null) {
            const opIndex = newText.indexOf(leadingOperator);
            continuationOperatorColumn = opIndex >= 0 ? opIndex : null;
          }
        } else {
          const opColumn = findSpacedBinaryOperatorColumn(newText);
          if (opColumn !== null && !endsStatement) {
            const rhsStart = findAssignmentRhsStart(newText);
            const alignColumn = rhsStart !== null ? Math.max(0, rhsStart - 2) : opColumn;
            continuationOperatorColumn = alignColumn;
          } else {
            const rhsStart = findAssignmentRhsStart(newText);
            if (rhsStart !== null && !endsStatement) {
              continuationOperatorColumn = Math.max(0, rhsStart - 2);
            } else {
              continuationOperatorColumn = null;
            }
          }
        }

        if (endsStatement) {
          continuationOperatorColumn = null;
        }
      }
    }

    // Increase indent for next line (openers/mid-clauses)
    if (isMid) {
      indentLevel++;
    }
    if (isOpener) {
      if (!hasInlineCloser && !isInlineDclDs) {
        indentLevel++;
        if (isProcStart) {
          procDepth++;
        }
      }
    }
  }

  return { resultLines, anyChanged };
}


// --------------------------------------------------------
// Blank Line Cleanup (Before Closers, trailing whitespace…)
// --------------------------------------------------------

function postProcessBlankLines(lines: string[]) {
  const isBlank = (t: string) => t.trim().length === 0;
  const isCloserLine = (t: string) => startsWithKeyword(t.trim().toUpperCase(), CLOSERS);

  let anyChanged = false;
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (isBlank(l)) {
      // Skip multiple blank lines
      if (out.length > 0 && isBlank(out[out.length - 1])) {
        anyChanged = true;
        continue;
      }

      // Skip blank lines before closers
      let k = i + 1;
      while (k < lines.length && isBlank(lines[k])) k++;
      if (k < lines.length && isCloserLine(lines[k])) {
        anyChanged = true;
        continue;
      }
    }

    out.push(l);
  }

  // Trim trailing blanks
  while (out.length > 0 && out[out.length - 1].trim() === '') {
    out.pop();
    anyChanged = true;
  }

  return { resultLines: out, anyChanged };
}

// --------------------------------------------------------
// Main Formatting Provider Function
// --------------------------------------------------------

function provideShift6FormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
  try {
    const fullText = document.getText();
    if (fullText.length === 0) return [];

    const lines = fullText.split(/\r?\n/);
    const cfg = getConfig();
    const pre = preprocessDocument(lines, cfg);

    let { resultLines, anyChanged } = formatCore(pre, cfg);

    const post = postProcessBlankLines(resultLines);
    resultLines = post.resultLines;
    anyChanged ||= post.anyChanged;

    if (!anyChanged && !pre.freeNeedsTrim && !pre.splitOccurred) return [];

    const range = getFullDocumentRange(document, fullText.length);

    return [vscode.TextEdit.replace(range, resultLines.join('\n'))];
  } catch (error) {
    // Use vscode window for errors to avoid console typing issues in TS config.
    vscode.window.showErrorMessage(`Shift6 formatter error: ${String(error)}`);
    return [];
  }
}

// --------------------------------------------------------
// Extension Activation
// --------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
  const selectors: vscode.DocumentSelector = [
    ...PATTERNS.map((pattern) => ({ pattern })),
    ...LANGUAGE_IDS.map((lang) => ({ language: lang }))
  ];

  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      return provideShift6FormattingEdits(document);
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selectors, provider)
  );
}


export function deactivate() { }
