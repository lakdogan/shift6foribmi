import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex
} from '../utils/index';

// Format PREPARE/EXECUTE/EXECUTE IMMEDIATE statements.
export const formatPrepareExecute = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  const pushSqlTextLines = (lines: string[], indent: string, sqlText: string): void => {
    const parts = sqlText.split(/\r?\n/);
    for (const part of parts) {
      lines.push(indent + part);
    }
  };

  const formatUsingBlock = (argsText: string): string[] => {
    const normalized = normalizeSqlWhitespace(argsText);
    if (normalized.toUpperCase().startsWith('DESCRIPTOR')) {
      return [nestedIndent + normalized];
    }
    const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const suffix = i < args.length - 1 ? ',' : '';
      lines.push(nestedIndent + args[i] + suffix);
    }
    return lines;
  };

  if (upper.startsWith('PREPARE ')) {
    const rest = cleaned.slice(7).trimStart();
    const fromIndex = findKeywordIndex(rest, 'FROM');
    if (fromIndex < 0) {
      return [baseIndent + `prepare ${normalizeSqlWhitespace(rest)};`];
    }
    const stmtName = rest.slice(0, fromIndex).trim();
    const sqlText = rest.slice(fromIndex + 4).trimStart();
    return [
      baseIndent + `prepare ${stmtName} from`,
      nestedIndent + sqlText + ';'
    ];
  }

  if (upper.startsWith('EXECUTE IMMEDIATE')) {
    const rest = cleaned.slice('execute immediate'.length).trimStart();
    const intoIndex = findKeywordIndex(rest, 'INTO');
    const usingIndex = findKeywordIndex(rest, 'USING');
    if (intoIndex < 0 && usingIndex < 0) {
      const lines: string[] = [];
      lines.push(baseIndent + 'execute immediate');
      pushSqlTextLines(lines, nestedIndent, rest);
      lines[lines.length - 1] = lines[lines.length - 1] + ';';
      return lines;
    }
    const lines: string[] = [];
    const stmtEnd = [intoIndex, usingIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    const stmtText = rest.slice(0, stmtEnd).trim();
    lines.push(baseIndent + 'execute immediate');
    pushSqlTextLines(lines, nestedIndent, stmtText);
    if (intoIndex >= 0) {
      const intoText = rest.slice(intoIndex + 4, usingIndex > intoIndex ? usingIndex : undefined).trimStart();
      const targets = splitTopLevel(intoText, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + 'into');
      for (let i = 0; i < targets.length; i++) {
        const suffix = i < targets.length - 1 ? ',' : '';
        lines.push(nestedIndent + targets[i] + suffix);
      }
    }
    if (usingIndex >= 0) {
      lines.push(baseIndent + 'using');
      const usingText = rest.slice(usingIndex + 5).trimStart();
      lines.push(...formatUsingBlock(usingText));
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upper.startsWith('EXECUTE ')) {
    const rest = cleaned.slice(7).trimStart();
    const stmtName = rest.split(/\s+/)[0];
    const remaining = rest.slice(stmtName.length).trimStart();
    const intoIndex = findKeywordIndex(remaining, 'INTO');
    const usingIndex = findKeywordIndex(remaining, 'USING');
    const lines: string[] = [];
    lines.push(baseIndent + `execute ${stmtName}`);
    if (intoIndex >= 0) {
      const intoText = remaining.slice(intoIndex + 4, usingIndex > intoIndex ? usingIndex : undefined).trimStart();
      const targets = splitTopLevel(intoText, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + 'into');
      for (let i = 0; i < targets.length; i++) {
        const suffix = i < targets.length - 1 ? ',' : '';
        lines.push(nestedIndent + targets[i] + suffix);
      }
    }
    if (usingIndex >= 0) {
      lines.push(baseIndent + 'using');
      const usingText = remaining.slice(usingIndex + 5).trimStart();
      lines.push(...formatUsingBlock(usingText));
    }
    if (lines.length === 1) {
      lines[0] = lines[0] + ';';
    } else {
      lines[lines.length - 1] = lines[lines.length - 1] + ';';
    }
    return lines;
  }

  return [baseIndent + cleaned + ';'];
};
