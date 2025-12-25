import type { Case } from '../types';

const testCase: Case = {
  name: 'percent-builtin-no-space',
  input: ['**free', 'r = %char(% timestamp());'].join('\n'),
  mustInclude: ['r = %char(%timestamp());']
};

export default testCase;
