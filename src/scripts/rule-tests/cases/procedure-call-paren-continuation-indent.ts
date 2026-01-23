import type { Case } from '../types';

const testCase: Case = {
  name: 'procedure-call-paren-continuation-indent',
  input: [
    '**free',
    'dcl-proc pr_Test;',
    '  dcl-pi *n ind; end-pi;',
    '  ok = pr_InsertComplexWithNC(',
    '  1:2:3:',
    "  'A':'B');",
    'end-proc;'
  ].join('\n'),
  mustInclude: [
    'ok = pr_InsertComplexWithNC(',
    '\n          1:2:3:',
    "\n          'A':'B');"
  ]
};

export default testCase;
