import type { Case } from '../types';

const testCase: Case = {
  name: 'parentheses-trim',
  input: ['**free', 'x = inz(             2      );', 'y = inz(         2);'].join('\n'),
  mustInclude: ['x = inz(2);', 'y = inz(2);']
};

export default testCase;
