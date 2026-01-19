import { findCommentIndexOutsideStrings } from '../utils/string-scan';

interface NormalizeEmptyDclDsResult {
  lines: string[];
  changed: boolean;
}

// Join empty DCL-DS blocks into a single line when END-DS follows immediately.
export const normalizeEmptyDclDsBlocks = (lines: string[]): NormalizeEmptyDclDsResult => {
  const out: string[] = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedStart = line.trimStart();
    if (!/^DCL-DS\b/i.test(trimmedStart)) {
      out.push(line);
      continue;
    }

    const commentIndex = findCommentIndexOutsideStrings(line);
    const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
    const commentPart = commentIndex >= 0 ? line.slice(commentIndex) : '';
    const codeTrimmed = codePart.trim();

    if (!/^DCL-DS\b/i.test(codeTrimmed)) {
      out.push(line);
      continue;
    }
    if (!codeTrimmed.endsWith(';')) {
      out.push(line);
      continue;
    }
    if (/\bEND-DS\b|\bENDDS\b/i.test(codeTrimmed)) {
      out.push(line);
      continue;
    }

    const nextLine = lines[i + 1];
    if (!nextLine) {
      out.push(line);
      continue;
    }
    const nextCommentIndex = findCommentIndexOutsideStrings(nextLine);
    const nextCodePart = nextCommentIndex >= 0 ? nextLine.slice(0, nextCommentIndex) : nextLine;
    const nextCodeTrimmed = nextCodePart.trim();
    if (nextCommentIndex >= 0) {
      out.push(line);
      continue;
    }
    if (!/^(END-DS|ENDDS)\b/i.test(nextCodeTrimmed)) {
      out.push(line);
      continue;
    }
    if (!nextCodeTrimmed.endsWith(';')) {
      out.push(line);
      continue;
    }

    const base = codePart.trimEnd();
    const spacer = base.endsWith(' ') ? '' : ' ';
    let combined = base + spacer + 'end-ds;';
    if (commentPart) {
      const commentSpacer = combined.endsWith(' ') ? '' : ' ';
      combined += commentSpacer + commentPart;
    }
    out.push(combined);
    changed = true;
    i++;
  }

  return { lines: out, changed };
};
