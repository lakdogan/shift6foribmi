// Check if text begins with any keyword (case already normalized upstream).
export const startsWithKeyword = (upperText: string, keywords: string[]): boolean =>
  keywords.some((kw) => upperText.startsWith(kw));

// Check whether any keyword appears as a token in the line.
export const containsKeywordToken = (upperText: string, keywords: string[]): boolean => {
  const tokens = upperText.split(/[^A-Z0-9*\/-]+/).filter(Boolean);
  return keywords.some((kw) => tokens.includes(kw));
};

// Count leading spaces for indentation calculations.
export const countLeadingSpaces = (text: string): number => {
  let i = 0;
  while (i < text.length && text.charAt(i) === ' ') {
    i++;
  }
  return i;
};
