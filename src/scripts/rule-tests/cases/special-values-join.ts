import type { Case } from '../types';

const testCase: Case = {
  name: 'special-values-join',
  input: [
    '**free',
    'dcl-proc Test;',
    'if * on; r=1; endif;',
    'if * IN99; r=2; endif;',
    'if * program; r=3; endif;',
    'end-proc;'
  ].join('\n'),
  mustInclude: ['if *on;', 'if *IN99;', 'if *program;']
};

export default testCase;
