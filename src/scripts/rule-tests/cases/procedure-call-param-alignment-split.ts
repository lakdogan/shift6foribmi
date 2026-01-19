import type { Case } from '../types';

const testCase: Case = {
  name: 'procedure-call-param-alignment-split',
  input: [
    '**free',
    'x = p(a : b : c);',
    'x = p(',
    'a',
    ': b',
    ': c',
    ');'
  ].join('\n'),
  config: {
    alignProcedureCallParameters: true,
    spaces: 0,
    blockIndent: 0
  },
  mustInclude: [
    'x = p(a\n      : b\n      : c\n      );',
    'x = p(\n      a\n      : b\n      : c\n      );'
  ]
};

export default testCase;
