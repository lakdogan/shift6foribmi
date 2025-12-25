import type { Shift6Config } from '../../../config';
import { countLeadingSpaces } from '../../utils';

// Compute the effective wrap limit based on current vs target indent.
export const getEffectiveColumnLimit = (
  line: string,
  targetIndent: number,
  cfg: Shift6Config
): number => {
  const currentIndent = countLeadingSpaces(line);
  return Math.max(1, cfg.continuationColumn - targetIndent + currentIndent);
};
