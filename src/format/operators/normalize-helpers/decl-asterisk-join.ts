// Join '* name' tokens where declarations expect '*name'.
export const joinAsteriskTokensInDecl = (segment: string): string => {
  return segment.replace(/(^|[(\s])\*\s+([A-Za-z0-9_]+)/, '$1*$2');
};

// Normalize DCL-* declarations with asterisk return types.
export const joinDeclReturnAsterisk = (segment: string): string => {
  return segment.replace(/(\bDCL-(?:PI|PR|PROC)\b)\s+\*\s+([A-Za-z0-9_]+)/i, '$1 *$2');
};
