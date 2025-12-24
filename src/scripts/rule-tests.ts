import { normalizeConfig, Shift6ConfigInput } from '../config/schema';
import { formatCore } from '../format/format-core';
import { postProcessBlankLines } from '../format/postprocess';
import { preprocessDocument } from '../format/preprocess';

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

declare const process: {
  exitCode?: number;
};

interface Case {
  name: string;
  input: string;
  mustInclude: string[];
  config?: Shift6ConfigInput;
}

const cases: Case[] = [
  {
    name: 'join-asterisk-in-decl',
    input: [
      '**free',
      'dcl-proc Test;',
      'dcl-pi * n;',
      'end-pi;',
      'end-proc;'
    ].join('\n'),
    mustInclude: ['dcl-pi *n;']
  },
  {
    name: 'percent-builtins',
    input: ['**free', 'dcl-proc Test;', 'r = % int(3);', 'end-proc;'].join('\n'),
    mustInclude: ['r = %int(3);']
  },
  {
    name: 'ctl-opt-parentheses',
    input: [
      '**free',
      'ctl-opt dftactgrp( *no) actgrp( *new);',
      'dcl-proc Test;',
      'end-proc;'
    ].join('\n'),
    mustInclude: ['dftactgrp(*no)', 'actgrp(*new)']
  },
  {
    name: 'operator-spacing-basic',
    input: ['**free', 'dcl-proc Test;', 'r = a+b-c* d;', 'end-proc;'].join('\n'),
    mustInclude: ['r = a + b - c * d;']
  },
  {
    name: 'special-values-join',
    input: [
      '**free',
      'dcl-proc Test;',
      'if * on; r=1; endif;',
      'if * IN99; r=2; endif;',
      'if * program; r=3; endif;',
      'end-proc;'
    ].join('\n'),
    mustInclude: ['if *on;', 'if *IN99;', 'if *program;']
  },
  {
    name: 'on-error-special-value',
    input: ['**free', 'monitor;', 'on-error * program;', 'endmon;'].join('\n'),
    mustInclude: ['on-error *program;']
  },
  {
    name: 'continuation-alignment',
    input: [
      '**free',
      'dcl-proc Test;',
      'r = a + b + c;',
      '+ d + e;',
      'end-proc;'
    ].join('\n'),
    mustInclude: ['r = a + b + c;', '+ d + e;']
  },
  {
    name: 'decl-join-asterisk-proto',
    input: ['**free', 'dcl-pr MyProto;', '  * testvar;', 'end-pr;'].join('\n'),
    mustInclude: ['*testvar;']
  },
  {
    name: 'ctl-opt-options-collapse',
    input: [
      '**free',
      'ctl-opt option( *srcstmt : *nodebugio : *nounref ) alwnull( *usrctl );'
    ].join('\n'),
    mustInclude: ['option(*srcstmt : *nodebugio : *nounref)', 'alwnull(*usrctl)']
  },
  {
    name: 'inline-statement-split',
    input: ['**free', 'a=1; b=2; if a=1; b=3; endif;'].join('\n'),
    mustInclude: ['a = 1;', 'b = 2;', 'if a = 1;', 'b = 3;', 'endif;']
  },
  {
    name: 'string-parentheses-trim',
    input: ['**free', "msg = (  'abc'  );"].join('\n'),
    mustInclude: ["msg = ('abc');"]
  },
  {
    name: 'space-collapse-between-tokens',
    input: ['**free', 'if  a   =   b  ;'].join('\n'),
    mustInclude: ['if a = b;']
  },
  {
    name: 'percent-builtins-spacing',
    input: ['**free', 'r = % subst( txt : 1 : 3 );'].join('\n'),
    mustInclude: ['r = %subst(txt : 1 : 3);']
  },
  {
    name: 'multiplication-spacing',
    input: ['**free', 'r=n*n;'].join('\n'),
    mustInclude: ['r = n * n;']
  },
  {
    name: 'parentheses-trim',
    input: ['**free', 'x = inz(             2      );', 'y = inz(         2);'].join('\n'),
    mustInclude: ['x = inz(2);', 'y = inz(2);']
  },
  {
    name: 'string-wrap-concat',
    input: [
      '**free',
      "msg='User='+%trim(user)+';Action='+%trim(action)+';Status='+%trim(status)+';Timestamp='+%char(%timestamp())+';Details='+",
      "'Some very long detail text that should show how continuation lines get aligned and made readable by the formatter in a consistent way';"
    ].join('\n'),
    mustInclude: [
      "msg = 'User=' + %trim(user) + ';Action=' + %trim(action)",
      "+ ';Details=' + 'Some",
      "+ 'detail text that should show how continuation lines get",
      "+ 'aligned and made readable by the formatter in a",
      "+ 'consistent way';"
    ],
    config: {
      wrapLongStrings: true
    }
  },
  {
    name: 'multiline-string-normalization',
    input: ['**free', "msg = 'Hello", 'World\';', 'dsply(msg);'].join('\n'),
    mustInclude: ["msg = 'Hello'", "+ 'World';"]
  },
  {
    name: 'wrap-leading-plus-literal',
    input: [
      '**free',
      "msg = 'A'",
      "+ 'This is a very long literal that should wrap when the column limit is small.';"
    ].join('\n'),
    mustInclude: ["+ 'This is a very long literal"],
    config: {
      wrapLongStrings: true,
      continuationColumn: 50
    }
  },
  {
    name: 'concat-one-per-line',
    input: ['**free', "msg = 'A' + 'B' + 'C';"].join('\n'),
    mustInclude: ["msg = 'A'", "+ 'B'", "+ 'C';"],
    config: {
      concatStyle: 'one-per-line'
    }
  },
  {
    name: 'continuation-column-indent-aware',
    input: [
      '**free',
      'dcl-proc Test;',
      '  dcl-s msg varchar(2000);',
      "  msg = 'A' + 'B' + 'C' + 'D' + 'E' + 'F';",
      'end-proc;'
    ].join('\n'),
    mustInclude: ["msg = 'A' + 'B' + 'C'", "+ 'D' + 'E' + 'F';"],
    config: {
      continuationColumn: 50,
      wrapLongStrings: false
    }
  },
  {
    name: 'trim-space-before-semicolon',
    input: ['**free', 'if a = b ;'].join('\n'),
    mustInclude: ['if a = b;']
  },
  {
    name: 'multiline-string-disabled',
    input: ['**free', "msg = 'Hello", 'World\';'].join('\n'),
    mustInclude: ["msg = 'Hello", 'World\';'],
    config: {
      fixMultilineStringLiterals: false
    }
  }
];

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
