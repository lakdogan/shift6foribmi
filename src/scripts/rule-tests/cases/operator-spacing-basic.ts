import type { Case } from '../types';

const testCase: Case = {
  name: 'operator-spacing-basic',
  input: ['**free', 'dcl-proc Test;', 'r = a+b-c* d;', 'end-proc;'].join('\n'),
  mustInclude: ['r = a + b - c * d;']
};

export default testCase;
