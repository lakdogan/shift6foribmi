import type { Case } from '../types';

const testCase: Case = {
  name: 'continuation-alignment',
  input: [
    '**free',
    'dcl-proc Test;',
    'r = a + b + c;',
    '+ d + e;',
    'end-proc;'
  ].join('\n'),
  mustInclude: ['r = a + b + c;', '+ d + e;']
};

export default testCase;
