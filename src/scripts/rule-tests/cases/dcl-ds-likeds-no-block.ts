import type { Case } from '../types';

const testCase: Case = {
  name: 'dcl-ds-likeds-no-block',
  input: [
    '**free',
    'dcl-proc Test;',
    '  dcl-ds lclRunCtx likeds(RunCtx);',
    '  dcl-s runStatus char(1);',
    '  return;',
    'end-proc;'
  ].join('\n'),
  mustInclude: [
    '      dcl-proc Test;',
    '        dcl-ds lclRunCtx likeds(RunCtx);',
    '        dcl-s runStatus char(1);',
    '      end-proc;'
  ]
};

export default testCase;
