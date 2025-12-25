import type { Case } from '../types';

const testCase: Case = {
  name: 'concat-one-per-line',
  input: ['**free', "msg = 'A' + 'B' + 'C';"].join('\n'),
  mustInclude: ["msg = 'A'", "+ 'B'", "+ 'C';"],
  config: {
    concatStyle: 'one-per-line'
  }
};

export default testCase;
