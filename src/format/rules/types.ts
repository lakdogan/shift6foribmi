import { Shift6Config } from '../../config';
import { FormatContext, LineFlags, LineInfo } from '../context';

export interface LineState {
  original: string;
  current: string;
  info: LineInfo;
  targetIndent: number;
  commentIndentOverride: number | null;
  paramContinuationDepth: number;
}

export interface RuleResult {
  state: LineState;
  ctx: FormatContext;
  changed: boolean;
}

export interface Rule {
  id: string;
  apply(state: LineState, ctx: FormatContext, cfg: Shift6Config, flags: LineFlags): RuleResult;
}
