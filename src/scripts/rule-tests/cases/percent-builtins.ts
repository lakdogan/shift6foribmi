import type { Case } from '../types';

const testCase: Case = {
  name: 'percent-builtins',
  input: ['**free', 'dcl-proc Test;', 'r = % int(3);', 'end-proc;'].join('\n'),
  mustInclude: ['r = %int(3);']
};

export default testCase;
