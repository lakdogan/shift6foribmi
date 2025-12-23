import { CONTINUATION_OPERATORS } from '../constants';

// Return the leading operator if the line starts with one.
export const getLeadingOperator = (text: string): string | null => {
  const trimmed = text.trimStart();
  if (trimmed.length === 0) return null;
  return CONTINUATION_OPERATORS.includes(trimmed[0]) ? trimmed[0] : null;
};
