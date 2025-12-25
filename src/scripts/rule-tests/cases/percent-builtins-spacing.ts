import type { Case } from '../types';

const testCase: Case = {
  name: 'percent-builtins-spacing',
  input: ['**free', 'r = % subst( txt : 1 : 3 );'].join('\n'),
  mustInclude: ['r = %subst(txt : 1 : 3);']
};

export default testCase;
