import type { Case } from '../types';

const testCase: Case = {
  name: 'dcl-ds-inline',
  input: [
    '**free',
    'dcl-proc Test;',
    '  dcl-ds ZProcSts likeds(r_ZProcStsDS) inz;',
    '  end-ds;',
    '  return;',
    'end-proc;'
  ].join('\n'),
  mustInclude: ['dcl-ds ZProcSts likeds(r_ZProcStsDS) inz; end-ds;']
};

export default testCase;
