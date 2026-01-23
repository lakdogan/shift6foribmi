import { normalizeSqlExpression, normalizeSqlWhitespace, findKeywordIndex } from '../utils/index';
import { scanStringAware } from '../../../utils/string-scan';
import { formatPrepareExecute } from './prepare';

const splitPsmStatements = (text: string): string[] => {
  const statements: string[] = [];
  let start = 0;
  let depth = 0;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (ch === ';' && depth === 0) {
      const piece = text.slice(start, index).trim();
      if (piece.length > 0) statements.push(piece);
      start = index + 1;
    }
  });

  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
};

const buildIndent = (baseIndent: string, indentUnit: string, level: number): string =>
  baseIndent + indentUnit.repeat(Math.max(0, level));

const normalizeCondition = (text: string): string => normalizeSqlExpression(text);

const formatStatement = (statement: string): string => normalizeSqlWhitespace(statement);

const isElseIfStatement = (upper: string): boolean =>
  upper.startsWith('ELSEIF ') || upper.startsWith('ELSE IF ');

const getElseIfRemainder = (text: string): string => {
  if (/^ELSEIF\b/i.test(text)) return text.slice(6).trimStart();
  if (/^ELSE\s+IF\b/i.test(text)) return text.replace(/^ELSE\s+IF\b/i, '').trimStart();
  return text;
};

const isEndIfStatement = (upper: string): boolean => /^END\s+IF\b/.test(upper);
const isElseStatement = (upper: string): boolean => /^ELSE\b/.test(upper) && !isElseIfStatement(upper);
const isIfStatement = (upper: string): boolean => /^IF\b/.test(upper);

const isBeginStatement = (upper: string): boolean => /^BEGIN\b/.test(upper);
const isEndStatement = (upper: string): boolean =>
  /^END\b/.test(upper) && !isEndIfStatement(upper);

const isPrepareExecute = (upper: string): boolean =>
  upper.startsWith('PREPARE ') ||
  upper.startsWith('EXECUTE IMMEDIATE') ||
  upper.startsWith('EXECUTE ');

const formatControlHead = (prefix: string, condition: string): string =>
  condition ? `${prefix} ${condition} then` : `${prefix} then`;

const formatPsmStatements = (
  bodyText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const statements = splitPsmStatements(bodyText);
  const indentUnit = ' '.repeat(Math.max(0, nestedIndent.length - baseIndent.length));
  let indentLevel = 1;
  const lines: string[] = [];
  const blockStack: string[] = [];

  const insertInline = (index: number, inline: string) => {
    if (inline.trim().length === 0) return;
    statements.splice(index + 1, 0, inline);
  };

  for (let i = 0; i < statements.length; i++) {
    const normalized = formatStatement(statements[i]);
    if (!normalized) continue;
    const upper = normalized.toUpperCase();
    const indent = buildIndent(baseIndent, indentUnit, indentLevel);

    if (isIfStatement(upper)) {
      const thenIndex = findKeywordIndex(normalized, 'THEN');
      if (thenIndex < 0) {
        lines.push(indent + normalized + ';');
        continue;
      }
      const condition = normalizeCondition(normalized.slice(2, thenIndex).trim());
      lines.push(indent + formatControlHead('if', condition));
      blockStack.push('if');
      indentLevel += 1;
      const afterThen = normalized.slice(thenIndex + 4).trim();
      if (afterThen.length > 0) insertInline(i, afterThen);
      continue;
    }

    if (isElseIfStatement(upper)) {
      const remainder = getElseIfRemainder(normalized);
      const thenIndex = findKeywordIndex(remainder, 'THEN');
      indentLevel = Math.max(1, indentLevel - 1);
      if (thenIndex < 0) {
        lines.push(buildIndent(baseIndent, indentUnit, indentLevel) + normalized + ';');
        indentLevel += 1;
        continue;
      }
      const condition = normalizeCondition(remainder.slice(0, thenIndex).trim());
      lines.push(buildIndent(baseIndent, indentUnit, indentLevel) + formatControlHead('elseif', condition));
      indentLevel += 1;
      const afterThen = remainder.slice(thenIndex + 4).trim();
      if (afterThen.length > 0) insertInline(i, afterThen);
      continue;
    }

    if (isElseStatement(upper)) {
      indentLevel = Math.max(1, indentLevel - 1);
      lines.push(buildIndent(baseIndent, indentUnit, indentLevel) + 'else');
      indentLevel += 1;
      const afterElse = normalized.slice(4).trim();
      if (afterElse.length > 0) insertInline(i, afterElse);
      continue;
    }

    if (isEndIfStatement(upper)) {
      indentLevel = Math.max(1, indentLevel - 1);
      lines.push(buildIndent(baseIndent, indentUnit, indentLevel) + 'end if;');
      if (blockStack[blockStack.length - 1] === 'if') blockStack.pop();
      continue;
    }

    if (isBeginStatement(upper)) {
      lines.push(indent + normalized);
      blockStack.push('begin');
      indentLevel += 1;
      continue;
    }

    if (isEndStatement(upper)) {
      indentLevel = Math.max(1, indentLevel - 1);
      lines.push(buildIndent(baseIndent, indentUnit, indentLevel) + normalized + ';');
      if (blockStack.length > 0) blockStack.pop();
      continue;
    }

    if (isPrepareExecute(upper)) {
      const formatted = formatPrepareExecute(
        normalized,
        indent,
        buildIndent(baseIndent, indentUnit, indentLevel + 1)
      );
      lines.push(...formatted);
      continue;
    }

    lines.push(indent + normalized + ';');
  }

  return lines;
};

export const formatPsmBeginEndBlock = (
  bodyText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const lines: string[] = [];
  lines.push(baseIndent + 'begin');
  lines.push(...formatPsmStatements(bodyText, baseIndent, nestedIndent));
  lines.push(baseIndent + 'end;');
  return lines;
};
