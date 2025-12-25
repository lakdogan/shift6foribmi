import type { Case } from '../types';

const testCase: Case = {
  name: 'trim-space-before-semicolon',
  input: ['**free', 'if a = b ;'].join('\n'),
  mustInclude: ['if a = b;']
};

export default testCase;
