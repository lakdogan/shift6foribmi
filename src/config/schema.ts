import { Shift6Config } from './types';

export interface Shift6ConfigInput {
  spaces?: number;
  blockIndent?: number;
  collapseTokenSpaces?: boolean;
  trimStringParentheses?: boolean;
  alignPlusContinuation?: boolean;
  alignProcedureCallParameters?: boolean;
  continuationColumn?: number | string;
  joinAsteriskTokensInDecl?: boolean;
  wrapLongStrings?: boolean;
  fixMultilineStringLiterals?: boolean;
  concatStyle?: string;
}

export const SHIFT6_DEFAULTS: Shift6ConfigInput = {
  spaces: 6,
  blockIndent: 2,
  collapseTokenSpaces: true,
  trimStringParentheses: true,
  alignPlusContinuation: true,
  alignProcedureCallParameters: false,
  continuationColumn: 66,
  joinAsteriskTokensInDecl: true,
  wrapLongStrings: false,
  fixMultilineStringLiterals: true,
  concatStyle: 'compact'
};

// Apply defaults and sanitize config inputs into a stable config object.
export function normalizeConfig(input: Shift6ConfigInput): Shift6Config {
  const spaces = Math.max(0, Number(input.spaces ?? SHIFT6_DEFAULTS.spaces));
  const blockIndent = Math.max(0, Number(input.blockIndent ?? SHIFT6_DEFAULTS.blockIndent));
  const collapseTokenSpaces = Boolean(
    input.collapseTokenSpaces ?? SHIFT6_DEFAULTS.collapseTokenSpaces
  );
  const trimStringParentheses = Boolean(
    input.trimStringParentheses ?? SHIFT6_DEFAULTS.trimStringParentheses
  );
  const alignPlusContinuation = Boolean(
    input.alignPlusContinuation ?? SHIFT6_DEFAULTS.alignPlusContinuation
  );
  const alignProcedureCallParameters = Boolean(
    input.alignProcedureCallParameters ?? SHIFT6_DEFAULTS.alignProcedureCallParameters
  );
  const continuationColumnRaw = input.continuationColumn ?? SHIFT6_DEFAULTS.continuationColumn;
  const continuationColumnValue = Number(continuationColumnRaw);
  const continuationColumn = Number.isFinite(continuationColumnValue)
    ? Math.max(40, Math.floor(continuationColumnValue))
    : 66;
  const joinAsteriskTokensInDecl = Boolean(
    input.joinAsteriskTokensInDecl ?? SHIFT6_DEFAULTS.joinAsteriskTokensInDecl
  );
  const wrapLongStrings = Boolean(input.wrapLongStrings ?? SHIFT6_DEFAULTS.wrapLongStrings);
  const fixMultilineStringLiterals = Boolean(
    input.fixMultilineStringLiterals ?? SHIFT6_DEFAULTS.fixMultilineStringLiterals
  );
  const concatStyleInput = (input.concatStyle ?? SHIFT6_DEFAULTS.concatStyle) as string;
  const concatStyleNormalized = String(concatStyleInput).toLowerCase();
  const concatStyle =
    concatStyleNormalized === 'one-per-line' ? 'one-per-line' : 'compact';

  return {
    spaces,
    targetBaseIndent: spaces,
    blockIndent,
    normalizedFree: '**free',
    collapseTokenSpaces,
    trimStringParentheses,
    alignPlusContinuation,
    alignProcedureCallParameters,
    continuationColumn,
    joinAsteriskTokensInDecl,
    wrapLongStrings,
    fixMultilineStringLiterals,
    concatStyle
  };
}
