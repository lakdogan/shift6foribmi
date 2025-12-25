// Trim spaces before semicolons in non-string segments.
export const trimSpaceBeforeSemicolon = (segment: string): string => {
  return segment.replace(/\s+;/g, ';');
};
