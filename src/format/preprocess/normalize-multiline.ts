// Normalize multi-line string literals into explicit concatenations.
export function normalizeMultilineStringLiterals(
  lines: string[]
): { lines: string[]; changed: boolean } {
  const out: string[] = [];
  let inMultiline = false;
  let baseIndent = '';
  let prefix = '';
  let changed = false;

  const findUnclosedStringStart = (line: string): number | null => {
    let inString = false;
    let openIndex = -1;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (!inString) {
        if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
          break;
        }
        if (ch === '\'') {
          inString = true;
          openIndex = i;
        }
        continue;
      }
      if (ch === '\'') {
        if (i + 1 < line.length && line[i + 1] === '\'') {
          i++;
          continue;
        }
        inString = false;
        openIndex = -1;
      }
    }
    return inString ? openIndex : null;
  };

  const findClosingQuote = (line: string): number | null => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '\'') {
        if (i + 1 < line.length && line[i + 1] === '\'') {
          i++;
          continue;
        }
        return i;
      }
    }
    return null;
  };

  for (const line of lines) {
    if (!inMultiline) {
      const startIndex = findUnclosedStringStart(line);
      if (startIndex !== null) {
        const indentMatch = line.match(/^(\s*)/);
        baseIndent = indentMatch ? indentMatch[1] : '';
        prefix = line.slice(0, startIndex);
        const content = line.slice(startIndex + 1);
        out.push(prefix + '\'' + content + '\'');
        inMultiline = true;
        changed = true;
        continue;
      }
      out.push(line);
      continue;
    }

    const closingIndex = findClosingQuote(line);
    if (closingIndex === null) {
      out.push(baseIndent + '+ \'' + line + '\'');
      changed = true;
      continue;
    }

    const content = line.slice(0, closingIndex);
    const suffix = line.slice(closingIndex + 1);
    out.push(baseIndent + '+ \'' + content + '\'' + suffix);
    inMultiline = false;
    changed = true;
  }

  return { lines: out, changed };
}
