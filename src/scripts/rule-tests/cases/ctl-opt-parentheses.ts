import type { Case } from '../types';

const testCase: Case = {
  name: 'ctl-opt-parentheses',
  input: [
    '**free',
    'ctl-opt dftactgrp( *no) actgrp( *new);',
    'dcl-proc Test;',
    'end-proc;'
  ].join('\n'),
  mustInclude: ['dftactgrp(*no)', 'actgrp(*new)']
};

export default testCase;
