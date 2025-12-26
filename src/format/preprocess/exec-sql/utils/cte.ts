import { findMatchingParenIndex } from './find';

// Parse WITH CTE blocks into named bodies and remainder SQL.
export const parseWithClauses = (
  text: string
): { ctes: { name: string; body: string }[]; remainder: string } => {
  let remaining = text.trimStart();
  const ctes: { name: string; body: string }[] = [];

  while (remaining.length > 0) {
    const match = remaining.match(/^([A-Z0-9_]+)\s+AS\s*\(/i);
    if (!match) {
      return { ctes, remainder: remaining };
    }
    const name = match[1];
    const openIndex = remaining.indexOf('(', match[0].length - 1);
    if (openIndex < 0) {
      return { ctes, remainder: remaining };
    }
    const closeIndex = findMatchingParenIndex(remaining, openIndex);
    if (closeIndex === null) {
      return { ctes, remainder: remaining };
    }
    const body = remaining.slice(openIndex + 1, closeIndex).trim();
    ctes.push({ name, body });
    remaining = remaining.slice(closeIndex + 1).trimStart();
    if (remaining.startsWith(',')) {
      remaining = remaining.slice(1).trimStart();
      continue;
    }
    return { ctes, remainder: remaining };
  }

  return { ctes, remainder: '' };
};
