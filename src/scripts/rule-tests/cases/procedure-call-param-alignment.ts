import type { Case } from '../types';

const testCase: Case = {
  name: 'procedure-call-param-alignment',
  input: ['**free', 'x = pr(a', ':b', '    :  c);'].join('\n'),
  config: {
    alignProcedureCallParameters: true,
    spaces: 0,
    blockIndent: 0
  },
  mustInclude: ['x = pr(a\n       : b\n       : c\n       );']
};

export default testCase;
