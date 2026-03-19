import { normalizeConfig } from '../config/schema';
import { formatCore } from '../format/format-core';
import { postProcessBlankLines } from '../format/postprocess';
import { preprocessDocument, restoreDroppedEmptyStringInitLines } from '../format/preprocess';
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

// Assert that formatted output does not contain a forbidden substring.
function assertExcludes(name: string, output: string, forbidden: string): void {
  if (output.includes(forbidden)) {
    throw new Error(`Case "${name}" expected to exclude "${forbidden}"`);
  }
}

function assertRestoreKeepsDuplicateDeclBlocksStable(): void {
  const sourceLines = [
    '**free',
    'dcl-ds Request qualified inz;',
    "  User varchar(200) ccsid(*utf8) inz('');",
    'end-ds;',
    '',
    'dcl-ds ReportRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    '  ReportOrder int(10) inz(0);',
    "  DisplayName varchar(100) ccsid(*utf8) inz('');",
    "  DisplayText varchar(100) ccsid(*utf8) inz('');",
    'end-ds;',
    '',
    'dcl-ds SelectorRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    "  Name varchar(200) ccsid(*utf8) inz('');",
    'end-ds;'
  ];

  const droppedOutputLines = [
    'dcl-ds Request qualified inz;',
    "  User varchar(200) ccsid(*utf8) inz('');",
    'end-ds;',
    '',
    'dcl-ds ReportRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    '  ReportOrder int(10) inz(0);',
    'end-ds;',
    '',
    'dcl-ds SelectorRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    'end-ds;'
  ];

  const restored = restoreDroppedEmptyStringInitLines(sourceLines, droppedOutputLines);
  const expected = [
    'dcl-ds Request qualified inz;',
    "  User varchar(200) ccsid(*utf8) inz('');",
    'end-ds;',
    '',
    'dcl-ds ReportRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    '  ReportOrder int(10) inz(0);',
    "  DisplayName varchar(100) ccsid(*utf8) inz('');",
    "  DisplayText varchar(100) ccsid(*utf8) inz('');",
    'end-ds;',
    '',
    'dcl-ds SelectorRow qualified inz;',
    "  Variant varchar(100) ccsid(*utf8) inz('');",
    "  Name varchar(200) ccsid(*utf8) inz('');",
    'end-ds;'
  ].join('\n');

  const actual = restored.lines.join('\n');
  if (actual !== expected) {
    throw new Error('Direct restore regression: duplicate declaration lines were reinserted into the wrong block');
  }
}

let failed = false;
for (const testCase of cases) {
  try {
    const output = runCase(testCase);
    for (const expected of testCase.mustInclude) {
      assertIncludes(testCase.name, output, expected);
    }
    if (testCase.mustExclude) {
      for (const forbidden of testCase.mustExclude) {
        assertExcludes(testCase.name, output, forbidden);
      }
    }
  } catch (error) {
    failed = true;
    console.error(String(error));
  }
}

try {
  assertRestoreKeepsDuplicateDeclBlocksStable();
} catch (error) {
  failed = true;
  console.error(String(error));
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('Rule tests passed.');
}
