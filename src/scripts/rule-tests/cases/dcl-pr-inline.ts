import type { Case } from '../types';

const testCase: Case = {
  name: 'dcl-pr-inline',
  input: [
    '**free',
    'dcl-pr pr_Init_Pgm likeds(r_ZProcStsDS); end-pr;',
    'dcl-pr pr_Exit_Pgm; end-pr;'
  ].join('\n'),
  mustInclude: [
    'dcl-pr pr_Init_Pgm likeds(r_ZProcStsDS); end-pr;',
    'dcl-pr pr_Exit_Pgm; end-pr;'
  ]
};

export default testCase;
