import type { Case } from '../types';

const testCase: Case = {
  name: 'multiplication-spacing',
  input: ['**free', 'r=n*n;'].join('\n'),
  mustInclude: ['r = n * n;']
};

export default testCase;
