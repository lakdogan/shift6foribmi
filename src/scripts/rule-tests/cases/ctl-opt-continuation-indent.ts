import type { Case } from '../types';

const testCase: Case = {
  name: 'ctl-opt-continuation-indent',
  input: [
    '**free',
    'ctl-opt nomain option(*srcstmt:*nodebugio)',
    "copyright('x');"
  ].join('\n'),
  mustInclude: [
    "      ctl-opt nomain option(*srcstmt:*nodebugio)\n              copyright('x');"
  ]
};

export default testCase;
