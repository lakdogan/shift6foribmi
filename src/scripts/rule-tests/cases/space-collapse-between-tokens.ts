import type { Case } from '../types';

const testCase: Case = {
  name: 'space-collapse-between-tokens',
  input: ['**free', 'if  a   =   b  ;'].join('\n'),
  mustInclude: ['if a = b;']
};

export default testCase;
