import { Shift6Config } from './types';

export interface Shift6ConfigInput {
  spaces?: number;
  blockIndent?: number;
  collapseTokenSpaces?: boolean;
  trimStringParentheses?: boolean;
  alignPlusContinuation?: boolean;
  continuationColumn?: number | string;
  joinAsteriskTokensInDecl?: boolean;
}

export const SHIFT6_DEFAULTS: Shift6ConfigInput = {
  spaces: 6,
  blockIndent: 2,
  collapseTokenSpaces: true,
  trimStringParentheses: true,
  alignPlusContinuation: true,
  continuationColumn: 66,
  joinAsteriskTokensInDecl: true
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
  const continuationColumnRaw = input.continuationColumn ?? SHIFT6_DEFAULTS.continuationColumn;
  const continuationColumnValue = Number(continuationColumnRaw);
  const continuationColumn = Number.isFinite(continuationColumnValue)
    ? Math.max(1, Math.floor(continuationColumnValue))
    : 66;
  const joinAsteriskTokensInDecl = Boolean(
    input.joinAsteriskTokensInDecl ?? SHIFT6_DEFAULTS.joinAsteriskTokensInDecl
  );

  return {
    spaces,
    targetBaseIndent: spaces,
    blockIndent,
    normalizedFree: '**free',
    collapseTokenSpaces,
    trimStringParentheses,
    alignPlusContinuation,
    continuationColumn,
    joinAsteriskTokensInDecl
  };
}
