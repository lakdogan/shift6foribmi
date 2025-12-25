// Normalize percent builtin name spacing in non-string segments.
export const normalizePercentBuiltinNames = (segment: string): string => {
  return segment.replace(/%\s+([A-Za-z0-9_]+)/g, '%$1');
};

// Normalize percent builtin argument spacing in non-string segments.
export const normalizePercentBuiltinArgs = (segment: string): string => {
  return segment.replace(/(%[A-Za-z0-9_]+)\(\s*([^)]+?)\s*\)/g, '$1($2)');
};
