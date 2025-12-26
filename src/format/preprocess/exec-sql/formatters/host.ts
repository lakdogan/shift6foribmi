import {
  normalizeSqlWhitespace,
  stripTrailingSemicolon
} from '../utils';

export const formatHostAndConnection = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const formatClause = (prefix: string, startIndex: number, lowerRest = false): string[] => {
    const rest = normalizeSqlWhitespace(cleaned.slice(startIndex).trimStart());
    return [baseIndent + `${prefix} ${lowerRest ? rest.toLowerCase() : rest};`];
  };

  if (upper.startsWith('DECLARE SECTION')) {
    return [baseIndent + 'declare section;'];
  }
  if (upper.startsWith('END DECLARE SECTION')) {
    return [baseIndent + 'end declare section;'];
  }
  if (upper.startsWith('INCLUDE ')) {
    return formatClause('include', 7, true);
  }
  if (upper.startsWith('WHENEVER ')) {
    return formatClause('whenever', 9);
  }
  if (upper.startsWith('CONNECT ')) {
    return formatClause('connect', 7);
  }
  if (upper.startsWith('SET CONNECTION')) {
    return formatClause('set connection', 'set connection'.length);
  }
  if (upper.startsWith('DISCONNECT ')) {
    return formatClause('disconnect', 10);
  }
  if (upper.startsWith('RELEASE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `release${rest ? ` ${rest}` : ''};`];
  }

  return [baseIndent + cleaned + ';'];
};
