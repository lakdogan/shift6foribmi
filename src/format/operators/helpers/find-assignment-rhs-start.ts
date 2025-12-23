// Locate the column where assignment RHS begins, ignoring ==, <=, >=.
export const findAssignmentRhsStart = (line: string): number | null => {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < codePart.length; i++) {
    const ch = codePart[i];

    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < codePart.length && codePart[i + 1] === quoteChar) {
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === '=') {
      const prev = i > 0 ? codePart[i - 1] : '';
      const next = i + 1 < codePart.length ? codePart[i + 1] : '';
      if (prev === '<' || prev === '>' || next === '=') {
        continue;
      }
      return i + 2;
    }
  }

  return null;
};
