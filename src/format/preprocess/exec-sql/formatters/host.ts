import {
  normalizeSqlWhitespace,
  stripTrailingSemicolon
} from '../utils';

export const formatHostAndConnection = (text: string, baseIndent: string): string[] => {
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
