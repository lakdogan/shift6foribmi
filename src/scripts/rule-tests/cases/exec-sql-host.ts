import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-host',
  input: [
    '**free',
    'exec sql declare section;',
    'dcl-s custId int(10);',
    'exec sql end declare section;',
    'exec sql include sqlca;',
    'exec sql whenever sqlerror continue;'
  ].join('\n'),
  mustInclude: [
    'declare section;',
    'end declare section;',
    'include sqlca;',
    'whenever sqlerror continue;'
  ]
};

export default testCase;
