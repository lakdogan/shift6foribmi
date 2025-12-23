import { Shift6Config } from '../../config';
import { buildLineInfo, getLineFlags, initFormatContext, updateContextAfterLine, updateContextBeforeLine } from '../context';
import { PreprocessResult } from '../preprocess';
import { FormatCoreResult } from '../types';
import { Rule } from './types';

// Execute all formatting rules in order, tracking context and changes.
export function runRules(pre: PreprocessResult, cfg: Shift6Config, rules: Rule[]): FormatCoreResult {
  const resultLines: string[] = [];
  let anyChanged = false;

  let ctx = initFormatContext();

  resultLines.push(cfg.normalizedFree);
  if (cfg.normalizedFree !== pre.firstLineText) {
    anyChanged = true;
  }

  for (const original of pre.linesToProcess) {
    const info = buildLineInfo(original);
    const flags = getLineFlags(info);

    ctx = updateContextBeforeLine(ctx, flags);

    let state = {
      original,
      current: original,
      info,
      targetIndent: cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent
    };

    for (const rule of rules) {
      const result = rule.apply(state, ctx, cfg, flags);
      state = result.state;
      ctx = result.ctx;
      if (result.changed) {
        anyChanged = true;
      }
    }

    resultLines.push(state.current);
    if (state.current !== original) {
      anyChanged = true;
    }

    ctx = updateContextAfterLine(ctx, flags);
  }

  return { resultLines, anyChanged };
}
