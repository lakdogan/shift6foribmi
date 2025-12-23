import { Shift6Config } from '../config';
import { PreprocessResult } from './preprocess';
import { DEFAULT_RULES, runRules } from './rules';
import { FormatCoreResult } from './types';

// Apply the formatting rule pipeline to preprocessed lines.
export function formatCore(pre: PreprocessResult, cfg: Shift6Config): FormatCoreResult {
  return runRules(pre, cfg, DEFAULT_RULES);
}
