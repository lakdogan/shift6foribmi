import {
  normalizeSqlWhitespace,
  normalizeSqlIdentifierPath,
  normalizeStarTokens,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findMatchingParenIndex,
  findKeywordIndex,
  splitSetOperations,
  splitSelectClauses,
  splitJoinSegments,
  trimTrailingSemicolon,
  parseWithClauses
} from './utils';
import { scanStringAware } from '../../utils/string-scan';

const formatValuesRows = (
  valuesText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(valuesText);
  const rows = splitTopLevel(cleaned, ',');
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : cleaned;
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    lines.push(baseIndent + ');');
    return lines;
  }

  const formattedRows = rows.map((row) => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    return '(' + items.join(', ') + ')';
  });

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : ';';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  return lines;
};

const formatFromClause = (rest: string, baseIndent: string): string[] => {
  const normalizedRest = normalizeSqlIdentifierPath(rest);
  const segments = splitJoinSegments(normalizedRest);
  if (segments.length === 1) {
    return [baseIndent + `from ${normalizeSqlExpression(normalizedRest)}`];
  }

  const lines: string[] = [];
  const first = segments[0];
  lines.push(baseIndent + `from ${normalizeSqlExpression(first.segment)}`);
  for (let i = 1; i < segments.length; i++) {
    const keyword = segments[i].keyword.toLowerCase();
    const segment = segments[i].segment;
    const onIndex = findKeywordIndex(segment, 'ON');
    if (onIndex >= 0) {
      const tablePart = normalizeSqlIdentifierPath(segment.slice(0, onIndex).trim());
      const condition = segment.slice(onIndex + 2).trimStart();
      lines.push(
        baseIndent +
          `${keyword} ${normalizeSqlExpression(tablePart)} on ${normalizeSqlExpression(condition)}`
      );
    } else {
      lines.push(baseIndent + `${keyword} ${normalizeSqlExpression(segment)}`);
    }
  }
  return lines;
};

const formatSelect = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('WITH ')) {
    const withPart = cleaned.slice(4).trimStart();
    const { ctes, remainder } = parseWithClauses(withPart);
    if (ctes.length === 0) {
      return [baseIndent + `with ${withPart};`];
    }

    const lines: string[] = [];
    const innerNested = ' '.repeat(nestedIndent.length + (nestedIndent.length - baseIndent.length));

    for (let i = 0; i < ctes.length; i++) {
      const prefix = i === 0 ? 'with ' : ', ';
      lines.push(baseIndent + `${prefix}${ctes[i].name} as (`);
      const bodyLines = trimTrailingSemicolon(
        formatSelect(ctes[i].body, nestedIndent, innerNested)
      );
      lines.push(...bodyLines);
      lines.push(baseIndent + ')');
    }

    if (remainder.length > 0) {
      const selectLines = formatSelect(remainder, baseIndent, nestedIndent);
      lines.push(...selectLines);
      return lines;
    }

    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const selectMatch = upper.match(/^SELECT\s+(DISTINCT\s+)?/);
  if (!selectMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const distinct = Boolean(selectMatch[1]);
  const afterSelect = cleaned.slice(selectMatch[0].length);

  const fromIndex = (() => {
    let depth = 0;
    let index = -1;
    scanStringAware(afterSelect, (ch, i) => {
      if (ch === '(') {
        depth++;
        return;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        return;
      }
      if (depth !== 0) return;
      if (afterSelect.slice(i).toUpperCase().startsWith('FROM ')) {
        index = i;
        return true;
      }
    });
    return index;
  })();

  const columnsText = fromIndex >= 0 ? afterSelect.slice(0, fromIndex).trim() : afterSelect.trim();
  const intoIndex = findKeywordIndex(columnsText, 'INTO');
  const selectColumnsText =
    intoIndex >= 0 ? columnsText.slice(0, intoIndex).trim() : columnsText;
  const intoText = intoIndex >= 0 ? columnsText.slice(intoIndex + 4).trimStart() : '';
  const remainder = fromIndex >= 0 ? afterSelect.slice(fromIndex).trim() : '';

  const columns = splitTopLevel(selectColumnsText, ',').map(normalizeSqlExpression);
  const lines = [baseIndent + (distinct ? 'select distinct' : 'select')];
  for (let i = 0; i < columns.length; i++) {
    const suffix = i < columns.length - 1 ? ',' : '';
    lines.push(nestedIndent + columns[i] + suffix);
  }
  if (intoText.length > 0) {
    const targets = splitTopLevel(intoText, ',').map(normalizeSqlExpression);
    lines.push(baseIndent + 'into');
    for (let i = 0; i < targets.length; i++) {
      const suffix = i < targets.length - 1 ? ',' : '';
      lines.push(nestedIndent + targets[i] + suffix);
    }
  }

  if (remainder.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const setParts = splitSetOperations(remainder);
  if (setParts.length > 1) {
    for (let i = 0; i < setParts.length; i++) {
      const part = setParts[i];
      const upperPart = part.toUpperCase();
      if (upperPart === 'UNION' || upperPart === 'UNION ALL' || upperPart === 'INTERSECT' || upperPart === 'EXCEPT') {
        lines.push(baseIndent + part.toLowerCase());
        continue;
      }
      const sub = formatSelect(part, baseIndent, nestedIndent);
      if (i < setParts.length - 1) {
        trimTrailingSemicolon(sub);
      }
      lines.push(...sub);
    }
    return lines;
  }

  const clauses = splitSelectClauses(remainder);
  for (let i = 0; i < clauses.length; i++) {
    const clause = normalizeSqlWhitespace(clauses[i]);
    const match = clause.match(
      /^(FROM|WHERE CURRENT OF|WHERE|GROUP BY|HAVING|ORDER BY|OFFSET|FETCH|FOR UPDATE|FOR READ ONLY|FOR FETCH ONLY)\b/i
    );
    if (!match) continue;
    const keyword = match[1].toLowerCase();
    const restClause = clause.slice(match[0].length).trimStart();
    const isLast = i === clauses.length - 1;
    const suffix = isLast ? ';' : '';

    if (keyword === 'group by' || keyword === 'order by') {
      const items = splitTopLevel(restClause, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + keyword);
      for (let j = 0; j < items.length; j++) {
        const itemSuffix = j < items.length - 1 ? ',' : '';
        lines.push(nestedIndent + items[j] + itemSuffix);
      }
      if (isLast) {
        lines[lines.length - 1] = lines[lines.length - 1] + ';';
      }
      continue;
    }

    if (keyword === 'where current of') {
      lines.push(baseIndent + `where current of ${normalizeSqlWhitespace(restClause)}` + suffix);
      continue;
    }

    if (keyword === 'where' || keyword === 'having') {
      lines.push(baseIndent + ` ${keyword} ${normalizeSqlExpression(restClause)}`.trim() + suffix);
      continue;
    }

    if (keyword === 'from') {
      const fromLines = formatFromClause(restClause, baseIndent);
      lines.push(...fromLines.map((line) => line + (isLast ? ';' : '')));
      if (isLast) {
        return lines;
      }
      continue;
    }

    if (keyword === 'fetch') {
      lines.push(baseIndent + `fetch ${normalizeSqlWhitespace(restClause)}` + suffix);
      continue;
    }

    if (keyword === 'offset') {
      lines.push(baseIndent + `offset ${normalizeSqlWhitespace(restClause)}` + suffix);
      continue;
    }

    if (keyword === 'for update') {
      const restUpper = restClause.toUpperCase();
      if (restUpper.startsWith('OF ')) {
        const columnsText = restClause.slice(3).trimStart();
        const columns = splitTopLevel(columnsText, ',').map(normalizeSqlExpression);
        lines.push(baseIndent + 'for update of');
        for (let j = 0; j < columns.length; j++) {
          const colSuffix = j < columns.length - 1 ? ',' : '';
          lines.push(nestedIndent + columns[j] + colSuffix);
        }
        if (isLast) {
          lines[lines.length - 1] = lines[lines.length - 1] + ';';
        }
        continue;
      }
      lines.push(baseIndent + 'for update' + (restClause ? ` ${normalizeSqlWhitespace(restClause)}` : '') + suffix);
      continue;
    }
    if (keyword === 'for read only') {
      lines.push(baseIndent + 'for read only' + suffix);
      continue;
    }
    if (keyword === 'for fetch only') {
      lines.push(baseIndent + 'fetch only' + suffix);
      continue;
    }

    lines.push(baseIndent + [keyword, normalizeSqlExpression(restClause)].filter(Boolean).join(' ') + suffix);
  }

  return lines;
};

const formatUpdate = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const updateMatch = upper.match(/^UPDATE\s+/);
  if (!updateMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(updateMatch[0].length).trimStart();
  const setIndex = findKeywordIndex(rest, 'SET');
  if (setIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }

  const tablePart = normalizeSqlIdentifierPath(rest.slice(0, setIndex).trim());
  if (tablePart.length === 0) {
    return [baseIndent + cleaned + ';'];
  }

  let afterSet = rest.slice(setIndex + 3).trimStart();
  const fromIndex = findKeywordIndex(afterSet, 'FROM');
  const whereIndex = findKeywordIndex(afterSet, 'WHERE');
  let setEnd = afterSet.length;
  if (fromIndex >= 0) setEnd = Math.min(setEnd, fromIndex);
  if (whereIndex >= 0) setEnd = Math.min(setEnd, whereIndex);
  const setText = afterSet.slice(0, setEnd).trim();
  const assignments = splitTopLevel(setText, ',').map(normalizeSqlExpression);
  afterSet = afterSet.slice(setEnd).trimStart();

  const lines: string[] = [];
  lines.push(baseIndent + `update ${tablePart}`);
  lines.push(baseIndent + 'set');
  for (let i = 0; i < assignments.length; i++) {
    const suffix = i < assignments.length - 1 ? ',' : '';
    lines.push(nestedIndent + assignments[i] + suffix);
  }

  if (afterSet.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const upperRest = afterSet.toUpperCase();
  if (upperRest.startsWith('FROM ')) {
    const fromText = afterSet.slice(5).trimStart();
    const whereIndexInFrom = findKeywordIndex(fromText, 'WHERE');
    const fromPart = whereIndexInFrom >= 0 ? fromText.slice(0, whereIndexInFrom).trim() : fromText;
    const fromLines = formatFromClause(fromPart, baseIndent);
    lines.push(...fromLines);
    if (whereIndexInFrom >= 0) {
      const whereText = fromText.slice(whereIndexInFrom + 5).trimStart();
      lines.push(baseIndent + `where ${normalizeSqlExpression(whereText)};`);
      return lines;
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upperRest.startsWith('WHERE')) {
    const whereText = afterSet.slice(5).trimStart();
    lines.push(baseIndent + `where ${normalizeSqlExpression(whereText)};`);
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};

const formatDelete = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const deleteMatch = upper.match(/^DELETE\s+(FROM\s+)?/);
  if (!deleteMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(deleteMatch[0].length).trimStart();
  if (rest.length === 0) {
    return [baseIndent + cleaned + ';'];
  }

  const usingIndex = findKeywordIndex(rest, 'USING');
  const whereIndex = findKeywordIndex(rest, 'WHERE');
  let tableEnd = rest.length;
  if (usingIndex >= 0) tableEnd = Math.min(tableEnd, usingIndex);
  if (whereIndex >= 0) tableEnd = Math.min(tableEnd, whereIndex);
  const tablePart = normalizeSqlIdentifierPath(rest.slice(0, tableEnd).trim());
  const usingText =
    usingIndex >= 0
      ? normalizeSqlIdentifierPath(
          rest.slice(usingIndex + 5, whereIndex > usingIndex ? whereIndex : undefined).trim()
        )
      : '';
  const whereText = whereIndex >= 0 ? rest.slice(whereIndex + 5).trimStart() : '';

  const lines: string[] = [];
  lines.push(baseIndent + `delete from ${tablePart}`);
  if (usingText.length > 0) {
    lines.push(baseIndent + `using ${normalizeSqlWhitespace(usingText)}`);
  }

  if (whereText.length > 0) {
    const upperWhere = whereText.toUpperCase();
    if (upperWhere.startsWith('CURRENT OF')) {
      const cursor = whereText.slice(10).trimStart();
      lines.push(baseIndent + `where current of ${normalizeSqlWhitespace(cursor)};`);
      return lines;
    }
    lines.push(baseIndent + `where ${normalizeSqlExpression(whereText)};`);
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};

const formatCall = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('CALL ')) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(4).trimStart();
  const parenIndex = rest.indexOf('(');
  const procName = parenIndex >= 0 ? rest.slice(0, parenIndex).trim() : rest;
  const closingIndex = findMatchingParenIndex(rest, parenIndex);
  if (!procName || closingIndex === null) {
    return [baseIndent + `call ${rest};`];
  }

  const argsText = rest.slice(parenIndex + 1, closingIndex);
  const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
  const lines: string[] = [];
  lines.push(baseIndent + `call ${procName}(`);
  for (let i = 0; i < args.length; i++) {
    const suffix = i < args.length - 1 ? ',' : '';
    lines.push(nestedIndent + args[i] + suffix);
  }
  lines.push(baseIndent + ');');
  return lines;
};

const formatSet = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('SET ')) {
    return [baseIndent + cleaned + ';'];
  }
  const rest = cleaned.slice(3).trimStart();
  const normalized = normalizeSqlExpression(rest);
  const restUpper = rest.toUpperCase();
  const withStarTokens = restUpper.startsWith('OPTION ')
    || restUpper.startsWith('CURRENT ')
    || restUpper.startsWith('TRANSACTION ')
    ? normalizeStarTokens(normalized)
    : normalized;
  return [baseIndent + `set ${withStarTokens};`];
};

const formatCommitRollback = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!(upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK'))) {
    return [baseIndent + cleaned + ';'];
  }
  const normalized = normalizeSqlWhitespace(cleaned).toLowerCase();
  return [baseIndent + `${normalized};`];
};

const formatMerge = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const mergeMatch = upper.match(/^MERGE\s+INTO\s+/);
  if (!mergeMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(mergeMatch[0].length).trimStart();
  let remaining = rest;
  const usingIndex = findKeywordIndex(remaining, 'USING');
  if (usingIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }
  const targetPart = normalizeSqlIdentifierPath(remaining.slice(0, usingIndex).trim());
  remaining = remaining.slice(usingIndex + 5).trimStart();

  const onIndex = findKeywordIndex(remaining, 'ON');
  if (onIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }
  const usingPart = normalizeSqlIdentifierPath(remaining.slice(0, onIndex).trim());
  remaining = remaining.slice(onIndex + 2).trimStart();

  const lines: string[] = [];
  lines.push(baseIndent + `merge into ${targetPart}`);
  lines.push(baseIndent + `using ${usingPart}`);

  const whenIndex = findKeywordIndex(remaining, 'WHEN');
  if (whenIndex < 0) {
    lines.push(baseIndent + `on ${normalizeSqlExpression(remaining)};`);
    return lines;
  }

  const onPart = remaining.slice(0, whenIndex).trim();
  lines.push(baseIndent + `on ${normalizeSqlExpression(onPart)}`);
  remaining = remaining.slice(whenIndex).trimStart();

  const whenBlocks = remaining
    .split(/\b(?=WHEN\s+(MATCHED|NOT)\b)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (let i = 0; i < whenBlocks.length; i++) {
    const block = whenBlocks[i];
    const upperBlock = block.toUpperCase();
    if (upperBlock.startsWith('WHEN MATCHED')) {
      const thenIndex = findKeywordIndex(block, 'THEN');
      const header = thenIndex >= 0 ? block.slice(0, thenIndex).trim() : block.trim();
      const action = thenIndex >= 0 ? block.slice(thenIndex + 4).trimStart() : '';
      const conditionRaw = header.slice('WHEN MATCHED'.length).trimStart();
      const condition = conditionRaw.toUpperCase().startsWith('AND ')
        ? normalizeSqlExpression(conditionRaw.slice(4))
        : conditionRaw.length > 0
          ? normalizeSqlExpression(conditionRaw)
          : '';
      lines.push(
        baseIndent + `when matched${condition ? ` and ${condition}` : ''} then`
      );
      if (action.toUpperCase().startsWith('UPDATE')) {
        const updateText = action.slice(6).trimStart();
        const setIndex = findKeywordIndex(updateText, 'SET');
        if (setIndex >= 0) {
          const setText = updateText.slice(setIndex + 3).trimStart();
          const assignments = splitTopLevel(setText, ',').map(normalizeSqlExpression);
          const assignmentIndent = nestedIndent + baseIndent;
          lines.push(nestedIndent + 'update');
          lines.push(nestedIndent + 'set');
          for (let j = 0; j < assignments.length; j++) {
            const suffix = j < assignments.length - 1 ? ',' : '';
            lines.push(assignmentIndent + assignments[j] + suffix);
          }
          continue;
        }
      } else if (action.toUpperCase().startsWith('DELETE')) {
        lines.push(nestedIndent + 'delete');
        continue;
      }
      lines.push(nestedIndent + normalizeSqlWhitespace(action));
      continue;
    }

    if (upperBlock.startsWith('WHEN NOT MATCHED')) {
      const thenIndex = findKeywordIndex(block, 'THEN');
      const header = thenIndex >= 0 ? block.slice(0, thenIndex).trim() : block.trim();
      const action = thenIndex >= 0 ? block.slice(thenIndex + 4).trimStart() : '';
      const restHeader = header.slice('WHEN NOT MATCHED'.length).trimStart();
      const byMatch = restHeader.match(/^BY\s+(TARGET|SOURCE)\b/i);
      const byPart = byMatch ? ` by ${byMatch[1].toLowerCase()}` : '';
      const conditionSource = byMatch ? restHeader.slice(byMatch[0].length).trimStart() : restHeader;
      const condition = conditionSource.toUpperCase().startsWith('AND ')
        ? normalizeSqlExpression(conditionSource.slice(4))
        : conditionSource.length > 0
          ? normalizeSqlExpression(conditionSource)
          : '';
      lines.push(
        baseIndent + `when not matched${byPart}${condition ? ` and ${condition}` : ''} then`
      );
      if (action.toUpperCase().startsWith('INSERT')) {
        const insertText = action.slice(6).trimStart();
        const mergeNestedIndent = nestedIndent + baseIndent;
        if (insertText.startsWith('(')) {
          const closingIndex = findMatchingParenIndex(insertText, 0);
          if (closingIndex !== null) {
            const inner = insertText.slice(1, closingIndex);
            const columns = splitTopLevel(inner, ',').map(normalizeSqlWhitespace);
            const remainder = insertText.slice(closingIndex + 1).trimStart();
            lines.push(nestedIndent + 'insert (');
            for (let j = 0; j < columns.length; j++) {
              const suffix = j < columns.length - 1 ? ',' : '';
              lines.push(mergeNestedIndent + columns[j] + suffix);
            }
            lines.push(nestedIndent + ')');
            if (remainder.length === 0) {
              lines[lines.length - 1] = lines[lines.length - 1] + ';';
              continue;
            }
            const upperRemainder = remainder.toUpperCase();
            if (upperRemainder.startsWith('VALUES')) {
              const valuesText = remainder.slice(6).trimStart();
              lines.push(...formatValuesRows(valuesText, nestedIndent, mergeNestedIndent));
              continue;
            }
            if (upperRemainder.startsWith('SELECT')) {
              lines.push(...formatSelect(remainder, nestedIndent, mergeNestedIndent));
              continue;
            }
            lines[lines.length - 1] = lines[lines.length - 1] + ';';
            continue;
          }
        }
        const formatted = formatInsert(`insert ${insertText}`, nestedIndent, mergeNestedIndent);
        for (const line of formatted) {
          lines.push(line);
        }
        continue;
      }
      if (action.toUpperCase().startsWith('DELETE')) {
        lines.push(nestedIndent + 'delete');
        continue;
      }
      lines.push(nestedIndent + normalizeSqlWhitespace(action));
    }
  }

  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/;?$/, ';');
  }

  return lines;
};

const formatPrepareExecute = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  const formatUsingBlock = (argsText: string): string[] => {
    const normalized = normalizeSqlWhitespace(argsText);
    if (normalized.toUpperCase().startsWith('DESCRIPTOR')) {
      return [nestedIndent + normalized + ';'];
    }
    const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const suffix = i < args.length - 1 ? ',' : ';';
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
      return [
        baseIndent + 'execute immediate',
        nestedIndent + rest + ';'
      ];
    }
    const lines: string[] = [];
    const stmtEnd = [intoIndex, usingIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    const stmtText = rest.slice(0, stmtEnd).trim();
    lines.push(baseIndent + 'execute immediate');
    lines.push(nestedIndent + stmtText);
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

const formatDeclareCursor = (
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

const formatHostAndConnection = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('DECLARE SECTION')) {
    return [baseIndent + 'declare section;'];
  }
  if (upper.startsWith('END DECLARE SECTION')) {
    return [baseIndent + 'end declare section;'];
  }
  if (upper.startsWith('INCLUDE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `include ${rest.toLowerCase()};`];
  }
  if (upper.startsWith('WHENEVER ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `whenever ${rest};`];
  }
  if (upper.startsWith('CONNECT ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `connect ${rest};`];
  }
  if (upper.startsWith('SET CONNECTION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set connection'.length).trimStart());
    return [baseIndent + `set connection ${rest};`];
  }
  if (upper.startsWith('DISCONNECT ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(10).trimStart());
    return [baseIndent + `disconnect ${rest};`];
  }
  if (upper.startsWith('RELEASE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `release${rest ? ` ${rest}` : ''};`];
  }

  return [baseIndent + cleaned + ';'];
};

const formatAllocateDescribe = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (upper.startsWith('DESCRIBE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `describe ${rest};`];
  }
  if (upper.startsWith('ALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `allocate ${rest};`];
  }
  if (upper.startsWith('DEALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(11).trimStart());
    return [baseIndent + `deallocate ${rest};`];
  }
  if (upper.startsWith('LOCK TABLE')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('lock table'.length).trimStart());
    return [baseIndent + `lock table ${rest};`];
  }
  if (upper.startsWith('SET SESSION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set session'.length).trimStart());
    return [baseIndent + `set session ${rest};`];
  }
  if (upper.startsWith('SET TRANSACTION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set transaction'.length).trimStart());
    return [baseIndent + `set transaction ${rest};`];
  }
  if (upper.startsWith('PREPARE ') || upper.startsWith('EXECUTE ') || upper.startsWith('EXECUTE IMMEDIATE')) {
    return formatPrepareExecute(cleaned, baseIndent, ' '.repeat(baseIndent.length * 2));
  }

  return [baseIndent + cleaned + ';'];
};

const formatSimpleSqlStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned).toLowerCase();
  return [baseIndent + `${normalized};`];
};

const formatValuesStatement = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('VALUES')) {
    return [baseIndent + cleaned + ';'];
  }
  const valuesText = cleaned.slice(6).trimStart();
  const intoIndex = findKeywordIndex(valuesText, 'INTO');
  const valuesPart = intoIndex >= 0 ? valuesText.slice(0, intoIndex).trim() : valuesText;
  const intoPart = intoIndex >= 0 ? valuesText.slice(intoIndex + 4).trimStart() : '';
  const rows = splitTopLevel(valuesPart, ',');
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : valuesPart;
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    lines.push(baseIndent + ')');
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

  const formattedRows = rows.map((row) => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    return '(' + items.join(', ') + ')';
  });

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : '';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  if (intoPart) {
    const targets = splitTopLevel(intoPart, ',').map(normalizeSqlExpression);
    lines.push(baseIndent + 'into');
    for (let i = 0; i < targets.length; i++) {
      const suffix = i < targets.length - 1 ? ',' : '';
      lines.push(nestedIndent + targets[i] + suffix);
    }
  }
  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};

const formatOpenCloseFetch = (
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

const formatInsert = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const insertMatch = upper.match(/^INSERT\s+INTO\s+/);
  if (!insertMatch) {
    return [baseIndent + cleaned + ';'];
  }

  let afterInsert = cleaned.slice(insertMatch[0].length).trimStart();
  afterInsert = normalizeSqlIdentifierPath(afterInsert);
  const tableMatch = afterInsert.match(/^([^\s(]+)\s*(.*)$/);
  if (!tableMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const tableName = tableMatch[1];
  let remainder = tableMatch[2]?.trimStart() ?? '';

  const lines: string[] = [];
  let columns: string[] | null = null;

  if (remainder.startsWith('(')) {
    const closingIndex = findMatchingParenIndex(remainder, 0);
    if (closingIndex !== null) {
      const inner = remainder.slice(1, closingIndex);
      columns = splitTopLevel(inner, ',').map(normalizeSqlWhitespace);
      remainder = remainder.slice(closingIndex + 1).trimStart();
    }
  }

  if (columns && columns.length > 0) {
    lines.push(baseIndent + `insert into ${tableName} (`);
    for (let i = 0; i < columns.length; i++) {
      const suffix = i < columns.length - 1 ? ',' : '';
      lines.push(nestedIndent + columns[i] + suffix);
    }
    lines.push(baseIndent + ')');
  } else {
    lines.push(baseIndent + `insert into ${tableName}`);
  }

  if (remainder.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const upperRemainder = remainder.toUpperCase();
  if (upperRemainder.startsWith('VALUES')) {
    const valuesText = remainder.slice(6).trimStart();
    lines.push(...formatValuesRows(valuesText, baseIndent, nestedIndent));
    return lines;
  }

  if (upperRemainder.startsWith('DEFAULT VALUES')) {
    lines.push(baseIndent + 'default values;');
    return lines;
  }

  if (upperRemainder.startsWith('SELECT')) {
    lines.push(...formatSelect(remainder, baseIndent, nestedIndent));
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};

export const formatSqlStatement = (text: string, indentStep: number): string[] => {
  const baseIndent = ' '.repeat(indentStep);
  const nestedIndent = ' '.repeat(indentStep * 2);
  const normalized = normalizeSqlWhitespace(text);
  const upper = normalized.toUpperCase();

  if (upper.startsWith('INSERT ')) {
    return formatInsert(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SELECT ') || upper.startsWith('WITH ')) {
    return formatSelect(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('UPDATE ')) {
    return formatUpdate(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('DELETE ')) {
    return formatDelete(normalized, baseIndent);
  }
  if (upper.startsWith('CALL ')) {
    return formatCall(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SET ')) {
    return formatSet(normalized, baseIndent);
  }
  if (
    upper.startsWith('COMMIT') ||
    (upper.startsWith('ROLLBACK') && !upper.startsWith('ROLLBACK TO SAVEPOINT'))
  ) {
    return formatCommitRollback(normalized, baseIndent);
  }
  if (upper.startsWith('MERGE ')) {
    return formatMerge(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('PREPARE ') ||
    upper.startsWith('EXECUTE IMMEDIATE') ||
    upper.startsWith('EXECUTE ')
  ) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DECLARE SECTION') ||
    upper.startsWith('END DECLARE SECTION') ||
    upper.startsWith('INCLUDE ') ||
    upper.startsWith('WHENEVER ') ||
    upper.startsWith('CONNECT ') ||
    upper.startsWith('SET CONNECTION') ||
    upper.startsWith('DISCONNECT ') ||
    upper.startsWith('RELEASE')
  ) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('DECLARE ')) {
    return formatDeclareCursor(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('OPEN ') || upper.startsWith('CLOSE ') || upper.startsWith('FETCH ')) {
    return formatOpenCloseFetch(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DESCRIBE ') ||
    upper.startsWith('ALLOCATE ') ||
    upper.startsWith('DEALLOCATE ')
  ) {
    return formatAllocateDescribe(normalized, baseIndent);
  }
  if (upper.startsWith('GET DIAGNOSTICS')) {
    const rest = normalizeSqlExpression(normalized.slice('get diagnostics'.length).trimStart());
    return [baseIndent + `get diagnostics ${rest};`.trim()];
  }
  if (upper.startsWith('VALUES')) {
    return formatValuesStatement(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('DESCRIBE ') || upper.startsWith('ALLOCATE ') || upper.startsWith('DEALLOCATE ')) {
    return formatAllocateDescribe(normalized, baseIndent);
  }
  if (upper.startsWith('EXECUTE IMMEDIATE')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('EXECUTE ')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('PREPARE ')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('CONNECT ') || upper.startsWith('DISCONNECT ') || upper.startsWith('SET CONNECTION') || upper.startsWith('RELEASE')) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('DECLARE SECTION') || upper.startsWith('END DECLARE SECTION') || upper.startsWith('INCLUDE ') || upper.startsWith('WHENEVER ')) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('SAVEPOINT ')) {
    const rest = normalizeSqlWhitespace(normalized.slice(9).trimStart());
    return [baseIndent + `savepoint ${rest};`];
  }
  if (upper.startsWith('RELEASE SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('release savepoint'.length).trimStart());
    return [baseIndent + `release savepoint ${rest};`];
  }
  if (upper.startsWith('ROLLBACK TO SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('rollback to savepoint'.length).trimStart());
    return [baseIndent + `rollback to savepoint ${rest};`];
  }
  if (
    upper.startsWith('COMMIT') ||
    (upper.startsWith('ROLLBACK') && !upper.startsWith('ROLLBACK TO SAVEPOINT'))
  ) {
    return formatSimpleSqlStatement(normalized, baseIndent);
  }

  const fallback = stripTrailingSemicolon(normalized);
  return [baseIndent + fallback + ';'];
};
