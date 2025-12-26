import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex
} from '../utils';
import { formatSelect } from './select';

// Format DECLARE CURSOR statements with options and SELECT body.
export const formatDeclareCursor = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('DECLARE ')) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(8).trimStart();
  const cursorIndex = findKeywordIndex(rest, 'CURSOR');
  if (cursorIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }

  const beforeCursor = rest.slice(0, cursorIndex).trim();
  const afterCursor = rest.slice(cursorIndex + 6).trimStart();
  const forIndex = findKeywordIndex(afterCursor, 'FOR');
  if (forIndex < 0) {
    return [baseIndent + `declare ${rest};`];
  }

  const options = afterCursor.slice(0, forIndex).trim();
  const selectText = afterCursor.slice(forIndex + 3).trimStart();
  const lines: string[] = [];
  const optionSuffix = options ? ` ${normalizeSqlWhitespace(options)}` : '';
  lines.push(baseIndent + `declare ${beforeCursor} cursor${optionSuffix} for`);
  lines.push(...formatSelect(selectText, nestedIndent, ' '.repeat(nestedIndent.length * 2)));
  return lines;
};

// Format OPEN/CLOSE/FETCH cursor statements.
export const formatOpenCloseFetch = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('OPEN ')) {
    const rest = cleaned.slice(5).trimStart();
    const usingIndex = findKeywordIndex(rest, 'USING');
    if (usingIndex < 0) {
      return [baseIndent + `open ${normalizeSqlWhitespace(rest)};`];
    }
    const cursorName = rest.slice(0, usingIndex).trim();
    const argsText = rest.slice(usingIndex + 5).trimStart();
    const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    lines.push(baseIndent + `open ${cursorName}`);
    lines.push(baseIndent + 'using');
    for (let i = 0; i < args.length; i++) {
      const suffix = i < args.length - 1 ? ',' : '';
      lines.push(nestedIndent + args[i] + suffix);
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upper.startsWith('CLOSE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(6).trimStart());
    return [baseIndent + `close ${rest};`];
  }

  if (upper.startsWith('FETCH ')) {
    const rest = cleaned.slice(6).trimStart();
    const intoIndex = findKeywordIndex(rest, 'INTO');
    const fetchPart = intoIndex >= 0 ? rest.slice(0, intoIndex).trim() : rest;
    const intoPart = intoIndex >= 0 ? rest.slice(intoIndex + 4).trimStart() : '';
    const lines: string[] = [];
    lines.push(baseIndent + `fetch ${normalizeSqlWhitespace(fetchPart)}`);
    if (intoPart) {
      const targets = splitTopLevel(intoPart, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + 'into');
      for (let i = 0; i < targets.length; i++) {
        const suffix = i < targets.length - 1 ? ',' : '';
        lines.push(nestedIndent + targets[i] + suffix);
      }
      lines[lines.length - 1] = lines[lines.length - 1] + ';';
      return lines;
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  return [baseIndent + cleaned + ';'];
};
