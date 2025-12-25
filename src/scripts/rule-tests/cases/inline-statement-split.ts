import type { Case } from '../types';

const testCase: Case = {
  name: 'inline-statement-split',
  input: ['**free', 'a=1; b=2; if a=1; b=3; endif;'].join('\n'),
  mustInclude: ['a = 1;', 'b = 2;', 'if a = 1;', 'b = 3;', 'endif;']
};

export default testCase;
