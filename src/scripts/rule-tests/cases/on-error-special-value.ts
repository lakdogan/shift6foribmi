import type { Case } from '../types';

const testCase: Case = {
  name: 'on-error-special-value',
  input: ['**free', 'monitor;', 'on-error * program;', 'endmon;'].join('\n'),
  mustInclude: ['on-error *program;']
};

export default testCase;
