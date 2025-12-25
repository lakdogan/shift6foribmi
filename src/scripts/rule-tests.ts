import { normalizeConfig } from '../config/schema';
import { formatCore } from '../format/format-core';
import { postProcessBlankLines } from '../format/postprocess';
import { preprocessDocument } from '../format/preprocess';
import { cases } from './rule-tests/cases';
import type { Case } from './rule-tests/types';

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

declare const process: {
  exitCode?: number;
};

// Execute the full formatting pipeline on a single test case.
function runCase(testCase: Case): string {
  const lines = testCase.input.split(/\r?\n/);
  const cfg = normalizeConfig(testCase.config ?? {});
  const pre = preprocessDocument(lines, cfg);
  const core = formatCore(pre, cfg);
  const post = postProcessBlankLines(core.resultLines);
  return post.resultLines.join('\n');
}

// Assert that formatted output contains expected substrings.
function assertIncludes(name: string, output: string, expected: string): void {
  if (!output.includes(expected)) {
    throw new Error(`Case "${name}" expected to include "${expected}"`);
  }
}

let failed = false;
for (const testCase of cases) {
  try {
    const output = runCase(testCase);
    for (const expected of testCase.mustInclude) {
      assertIncludes(testCase.name, output, expected);
    }
  } catch (error) {
    failed = true;
    console.error(String(error));
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('Rule tests passed.');
}
