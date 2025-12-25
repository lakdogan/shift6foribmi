// Normalize ctl-opt argument spacing in non-string segments.
export const normalizeCtlOptParentheses = (segment: string): string => {
  return segment.replace(/\(\s+([^)]+?)\)/g, '($1)').replace(/\(([^)]+?)\s+\)/g, '($1)');
};

// Normalize ctl-opt asterisk tokens inside parentheses.
export const normalizeCtlOptAsteriskTokens = (segment: string): string => {
  return segment.replace(/\(\s*([^)]+?)\s*\)/g, (_match, inner: string) => {
    const joined = inner.replace(/\*\s+([A-Za-z0-9_]+)/g, '*$1');
    return `(${joined})`;
  });
};
