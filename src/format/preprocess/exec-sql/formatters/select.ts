import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex,
  splitSelectClauses,
  parseWithClauses,
  trimTrailingSemicolon
} from '../utils';
import { scanStringAware } from '../../../utils/string-scan';
import { formatFromClause } from './from';
import { formatSelectSetOperations } from './select-set';

// Format SELECT and WITH queries into structured layout.
export const formatSelect = (text: string, baseIndent: string, nestedIndent: string): string[] => {
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

  const setLines = formatSelectSetOperations(remainder, baseIndent, nestedIndent, formatSelect);
  if (setLines) {
    lines.push(...setLines);
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
