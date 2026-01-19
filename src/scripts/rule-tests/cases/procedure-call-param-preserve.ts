import type { Case } from '../types';

const testCase: Case = {
  name: 'procedure-call-param-preserve',
  input: [
    '**free',
    'x = pr_Main(',
    '    custId',
    '    : dateFrom',
    '    : procSts',
    '    );'
  ].join('\n'),
  config: {
    alignProcedureCallParameters: false,
    spaces: 0,
    blockIndent: 0
  },
  mustInclude: [
    'x = pr_Main(\n    custId\n    : dateFrom\n    : procSts\n    );'
  ]
};

export default testCase;
