import * as vscode from 'vscode';
import { CONFIG_KEYS } from './config/keys';
import { normalizeConfig } from './config/schema';
import { Shift6Config } from './config/types';

export type { Shift6Config };

// Read VS Code configuration values and normalize them into formatter config.
export function getConfig(): Shift6Config {
  const cfg = vscode.workspace.getConfiguration();
  return normalizeConfig({
    spaces: cfg.get<number>(CONFIG_KEYS.spaces),
    blockIndent: cfg.get<number>(CONFIG_KEYS.blockIndent),
    collapseTokenSpaces: cfg.get<boolean>(CONFIG_KEYS.collapseTokenSpaces),
    trimStringParentheses: cfg.get<boolean>(CONFIG_KEYS.trimStringParentheses),
    alignPlusContinuation: cfg.get<boolean>(CONFIG_KEYS.alignPlusContinuation),
    continuationColumn: cfg.get<number | string>(CONFIG_KEYS.continuationColumn),
    joinAsteriskTokensInDecl: cfg.get<boolean>(CONFIG_KEYS.joinAsteriskTokensInDecl)
  });
}
