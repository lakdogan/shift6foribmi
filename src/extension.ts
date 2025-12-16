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
  'END-ENUM'
];

const OPENERS = ['DCL-PROC', 'IF', 'DOW', 'DOU', 'MONITOR', 'FOR', 'SELECT', 'BEGSR', 'DCL-DS', 'DCL-PR', 'DCL-PI', 'DCL-ENUM'];
const MID_KEYWORDS = [
  'ELSE',
  'ELSEIF',
  'ELSE IF',
  'WHEN',
  'WHEN-IS',
  'WHEN-IN',
  'OTHER',
  'ON-ERROR',
  'ON-EXIT'
];

const PATTERNS = [
  '**/*.rpgle',
  '**/*.sqlrpgle',
  '**/*.rpg',
  '**/*.sqlrpg',
  '**/*.rpginc',
  '**/*.rpgleinc'
];

const LANGUAGE_IDS = ['rpgle', 'sqlrpgle', 'rpg', 'sqlrpg', 'rpginc', 'rpgleinc'];

// --------------------------------------------------------
// Utility Functions
// --------------------------------------------------------

const startsWithKeyword = (upperText: string, keywords: string[]): boolean =>
  keywords.some((kw) => upperText.startsWith(kw));

const countLeadingSpaces = (text: string): number => {
  let i = 0;
  while (i < text.length && text.charAt(i) === ' ') {
    i++;
  }
  return i;
};

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

  return {
    spaces,
    targetBaseIndent: Math.max(0, spaces),
    blockIndent,
    normalizedFree: '**free',
    collapseTokenSpaces,
    trimStringParentheses
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
function preprocessDocument(document: vscode.TextDocument, cfg: Shift6Config): PreprocessResult {
  const lineCount = document.lineCount;
  const firstLineText = lineCount > 0 ? document.lineAt(0).text : '';
  const freeNeedsTrim = firstLineText.trim().toLowerCase() !== cfg.normalizedFree;

  const linesToProcess: string[] = [];
  let splitOccurred = false;

  for (let i = 0; i < lineCount; i++) {
    const original = document.lineAt(i).text;
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
      linesToProcess.push(seg);
    }
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

  // Always enforce **FREE as first line
  resultLines.push(cfg.normalizedFree);
  if (cfg.normalizedFree !== pre.firstLineText) {
    anyChanged = true;
  }

  for (const original of pre.linesToProcess) {
    const trimmed = original.trim();
    const upper = trimmed.toUpperCase();

    const isCloser = startsWithKeyword(upper, CLOSERS);
    const isMid = startsWithKeyword(upper, MID_KEYWORDS);
    const isOpener = startsWithKeyword(upper, OPENERS);
    const isProcStart = upper.startsWith('DCL-PROC');
    const isProcEnd = upper.startsWith('END-PROC') || upper.startsWith('ENDPROC');

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

    resultLines.push(newText);
    if (newText !== original) {
      anyChanged = true;
    }

    // Increase indent for next line (openers/mid-clauses)
    if (isMid) {
      indentLevel++;
    }
    if (isOpener) {
      indentLevel++;
      if (isProcStart) {
        procDepth++;
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
  if (document.lineCount === 0) return [];

  const cfg = getConfig();
  const pre = preprocessDocument(document, cfg);

  let { resultLines, anyChanged } = formatCore(pre, cfg);

  const post = postProcessBlankLines(resultLines);
  resultLines = post.resultLines;
  anyChanged ||= post.anyChanged;

  if (!anyChanged && !pre.freeNeedsTrim && !pre.splitOccurred) return [];

  const first = document.lineAt(0);
  const last = document.lineAt(pre.lineCount - 1);
  const range = new vscode.Range(first.range.start, last.range.end);

  return [vscode.TextEdit.replace(range, resultLines.join('\n'))];
}

// --------------------------------------------------------
// Extension Activation
// --------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {
  const selectors: vscode.DocumentSelector = [
    ...PATTERNS.map((pattern) => ({ pattern })),
    ...LANGUAGE_IDS.map((lang) => ({ language: lang, scheme: 'file' })),
    ...LANGUAGE_IDS.map((lang) => ({ language: lang, scheme: 'untitled' }))
  ];

  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      // call your helper here
      return provideShift6FormattingEdits(document);
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(selectors, provider)
  );
}


export function deactivate() { }
