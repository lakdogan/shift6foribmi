import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex,
  splitSelectClauses,
  splitSetOperations,
  parseWithClauses,
  trimTrailingSemicolon
} from '../utils/index';
import { scanStringAware } from '../../../utils/string-scan';
import { formatFromClause } from './from';
import { formatBooleanClause } from './conditions';
import { formatCaseExpression } from './case';

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
  const indentStep = Math.max(0, nestedIndent.length - baseIndent.length);
  const caseNestedIndent = nestedIndent + ' '.repeat(indentStep);
  for (let i = 0; i < columns.length; i++) {
    const suffix = i < columns.length - 1 ? ',' : '';
    const caseLines = formatCaseExpression(columns[i], nestedIndent, caseNestedIndent);
    if (caseLines) {
      caseLines[caseLines.length - 1] = caseLines[caseLines.length - 1] + suffix;
      lines.push(...caseLines);
      continue;
    }
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

  const formatSelectClauses = (clauseText: string, finalize: boolean): string[] => {
    const clauseLines: string[] = [];
    const clauses = splitSelectClauses(clauseText);
    for (let i = 0; i < clauses.length; i++) {
      const clause = normalizeSqlWhitespace(clauses[i]);
      const match = clause.match(
        /^(FROM|WHERE CURRENT OF|WHERE|GROUP BY|HAVING|ORDER BY|OFFSET|FETCH|FOR UPDATE|FOR READ ONLY|FOR FETCH ONLY|WITH)\b/i
      );
      if (!match) continue;
      const keyword = match[1].toLowerCase();
      const restClause = clause.slice(match[0].length).trimStart();
      const isLast = i === clauses.length - 1;
      const suffix = finalize && isLast ? ';' : '';

      if (keyword === 'group by' || keyword === 'order by') {
        const items = splitTopLevel(restClause, ',').map(normalizeSqlExpression);
        clauseLines.push(baseIndent + keyword);
        for (let j = 0; j < items.length; j++) {
          const itemSuffix = j < items.length - 1 ? ',' : '';
          clauseLines.push(nestedIndent + items[j] + itemSuffix);
        }
        if (finalize && isLast) {
          clauseLines[clauseLines.length - 1] = clauseLines[clauseLines.length - 1] + ';';
        }
        continue;
      }

      if (keyword === 'where current of') {
        clauseLines.push(
          baseIndent + `where current of ${normalizeSqlWhitespace(restClause)}` + suffix
        );
        continue;
      }

      if (keyword === 'where' || keyword === 'having') {
        const whereLines = formatBooleanClause(
          keyword as 'where' | 'having',
          restClause,
          baseIndent,
          nestedIndent
        );
        if (finalize && isLast) {
          whereLines[whereLines.length - 1] = whereLines[whereLines.length - 1] + ';';
        }
        clauseLines.push(...whereLines);
        continue;
      }

      if (keyword === 'from') {
        const fromLines = formatFromClause(restClause, baseIndent, nestedIndent, formatSelect);
        clauseLines.push(...fromLines);
        if (finalize && isLast && fromLines.length > 0) {
          clauseLines[clauseLines.length - 1] = clauseLines[clauseLines.length - 1] + ';';
        }
        continue;
      }

      if (keyword === 'fetch') {
        clauseLines.push(baseIndent + `fetch ${normalizeSqlWhitespace(restClause)}` + suffix);
        continue;
      }

      if (keyword === 'offset') {
        clauseLines.push(baseIndent + `offset ${normalizeSqlWhitespace(restClause)}` + suffix);
        continue;
      }

      if (keyword === 'for update') {
        const restUpper = restClause.toUpperCase();
        if (restUpper.startsWith('OF ')) {
          const columnsText = restClause.slice(3).trimStart();
          const columns = splitTopLevel(columnsText, ',').map(normalizeSqlExpression);
          clauseLines.push(baseIndent + 'for update of');
          for (let j = 0; j < columns.length; j++) {
            const colSuffix = j < columns.length - 1 ? ',' : '';
            clauseLines.push(nestedIndent + columns[j] + colSuffix);
          }
          if (finalize && isLast) {
            clauseLines[clauseLines.length - 1] = clauseLines[clauseLines.length - 1] + ';';
          }
          continue;
        }
        clauseLines.push(
          baseIndent +
            'for update' +
            (restClause ? ` ${normalizeSqlWhitespace(restClause)}` : '') +
            suffix
        );
        continue;
      }
      if (keyword === 'for read only') {
        const withHint = restClause.toUpperCase().startsWith('WITH ')
          ? ` ${normalizeSqlWhitespace(restClause)}`
          : '';
        clauseLines.push(baseIndent + `for read only${withHint}` + suffix);
        continue;
      }
      if (keyword === 'for fetch only') {
        clauseLines.push(baseIndent + 'fetch only' + suffix);
        continue;
      }
      if (keyword === 'with') {
        clauseLines.push(baseIndent + `with ${normalizeSqlWhitespace(restClause)}` + suffix);
        continue;
      }

      clauseLines.push(
        baseIndent + [keyword, normalizeSqlExpression(restClause)].filter(Boolean).join(' ') + suffix
      );
    }
    return clauseLines;
  };

  const setParts = splitSetOperations(remainder);
  if (setParts.length > 1) {
    const firstPart = setParts[0];
    lines.push(...formatSelectClauses(firstPart, false));
    for (let i = 1; i < setParts.length; i++) {
      const part = setParts[i];
      const upperPart = part.toUpperCase();
      if (
        upperPart === 'UNION' ||
        upperPart === 'UNION ALL' ||
        upperPart === 'INTERSECT' ||
        upperPart === 'EXCEPT'
      ) {
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

  lines.push(...formatSelectClauses(remainder, true));

  return lines;
};
