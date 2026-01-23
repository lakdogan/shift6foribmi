import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex,
  findMatchingParenIndex
} from '../utils/index';

// Format PREPARE/EXECUTE/EXECUTE IMMEDIATE statements.
export const formatPrepareExecute = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  const formatCreateTableLiteral = (sqlText: string): string | null => {
    const trimmed = sqlText.trim();
    if (!trimmed.startsWith('\'')) return null;
    let content = '';
    let i = 1;
    for (; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '\'') {
        if (i + 1 < trimmed.length && trimmed[i + 1] === '\'') {
          content += '\'\'';
          i++;
          continue;
        }
        const after = trimmed.slice(i + 1).trim();
        if (after.length > 0) return null;
        break;
      }
      content += ch;
    }
    if (i >= trimmed.length) return null;
    const normalized = normalizeSqlWhitespace(content);
    const upperContent = normalized.toUpperCase();
    if (!upperContent.startsWith('CREATE TABLE ')) return null;

    const afterCreate = normalized.slice('create table'.length).trimStart();
    const parenIndex = afterCreate.indexOf('(');
    if (parenIndex < 0) return null;
    const tableName = afterCreate.slice(0, parenIndex).trim();
    if (!tableName) return null;
    const rest = afterCreate.slice(parenIndex);
    const closingIndex = findMatchingParenIndex(rest, 0);
    if (closingIndex === null) return null;

    const inner = rest.slice(1, closingIndex);
    const tail = rest.slice(closingIndex + 1).trim();
    const columns = splitTopLevel(inner, ',').map(normalizeSqlWhitespace);
    if (columns.length === 0) return null;

    const constraintStarters = new Set([
      'CONSTRAINT',
      'PRIMARY',
      'FOREIGN',
      'UNIQUE',
      'CHECK',
      'LIKE',
      'PERIOD'
    ]);
    const columnParts: Array<{ name: string; rest: string } | null> = [];
    let maxNameLength = 0;
    for (const column of columns) {
      const trimmedColumn = column.trim();
      const match = trimmedColumn.match(/^("[^"]+"|\S+)\s+(.*)$/);
      if (!match) {
        columnParts.push(null);
        continue;
      }
      const name = match[1];
      const restText = match[2].trim();
      const upperName = name.replace(/^\"|\"$/g, '').toUpperCase();
      if (constraintStarters.has(upperName)) {
        columnParts.push(null);
        continue;
      }
      if (name.length > maxNameLength) maxNameLength = name.length;
      columnParts.push({ name, rest: restText });
    }

    const lines: string[] = [];
    lines.push(`'create table ${tableName} (`);
    for (let j = 0; j < columns.length; j++) {
      const suffix = j < columns.length - 1 ? ',' : '';
      const part = columnParts[j];
      if (part) {
        const padding = ' '.repeat(Math.max(1, maxNameLength - part.name.length + 2));
        lines.push(`${part.name}${padding}${part.rest}${suffix}`);
      } else {
        lines.push(`${columns[j].trim()}${suffix}`);
      }
    }
    const closeLine = tail.length > 0 ? `) ${tail}'` : ')\'';
    lines.push(closeLine);
    return lines.join('\n');
  };

  const pushSqlTextLines = (
    lines: string[],
    indent: string,
    continuationIndent: string,
    sqlText: string
  ): void => {
    const parts = sqlText.split(/\r?\n/);
    let inString = false;
    for (const part of parts) {
      if (inString) {
        const trimmedPart = part.trimStart();
        lines.push(continuationIndent + trimmedPart);
      } else {
        lines.push(indent + part);
      }
      for (let i = 0; i < part.length; i++) {
        if (part[i] !== '\'') continue;
        if (inString) {
          if (i + 1 < part.length && part[i + 1] === '\'') {
            i++;
            continue;
          }
          inString = false;
          continue;
        }
        inString = true;
      }
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
    const indentStep = Math.max(0, nestedIndent.length - baseIndent.length);
    const continuationIndent = nestedIndent + ' '.repeat(indentStep);
    const formattedLiteral = formatCreateTableLiteral(sqlText);
    const lines: string[] = [];
    lines.push(baseIndent + `prepare ${stmtName} from`);
    pushSqlTextLines(
      lines,
      nestedIndent,
      continuationIndent,
      formattedLiteral ?? sqlText
    );
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upper.startsWith('EXECUTE IMMEDIATE')) {
    const rest = cleaned.slice('execute immediate'.length).trimStart();
    const intoIndex = findKeywordIndex(rest, 'INTO');
    const usingIndex = findKeywordIndex(rest, 'USING');
    const indentStep = Math.max(0, nestedIndent.length - baseIndent.length);
    const continuationIndent = nestedIndent + ' '.repeat(indentStep);
    if (intoIndex < 0 && usingIndex < 0) {
      const lines: string[] = [];
      const formattedLiteral = formatCreateTableLiteral(rest);
      lines.push(baseIndent + 'execute immediate');
      pushSqlTextLines(
        lines,
        nestedIndent,
        continuationIndent,
        formattedLiteral ?? rest
      );
      lines[lines.length - 1] = lines[lines.length - 1] + ';';
      return lines;
    }
    const lines: string[] = [];
    const stmtEnd = [intoIndex, usingIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    const stmtText = rest.slice(0, stmtEnd).trim();
    const formattedLiteral = formatCreateTableLiteral(stmtText);
    lines.push(baseIndent + 'execute immediate');
    pushSqlTextLines(
      lines,
      nestedIndent,
      continuationIndent,
      formattedLiteral ?? stmtText
    );
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
