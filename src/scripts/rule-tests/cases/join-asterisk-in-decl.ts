import type { Case } from '../types';

const testCase: Case = {
  name: 'join-asterisk-in-decl',
  input: [
    '**free',
    'dcl-proc Test;',
    'dcl-pi * n;',
    'end-pi;',
    'end-proc;'
  ].join('\n'),
  mustInclude: ['dcl-pi *n;']
};

export default testCase;
