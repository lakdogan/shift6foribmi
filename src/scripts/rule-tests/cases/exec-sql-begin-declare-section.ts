import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-begin-declare-section',
  input: [
    '**free',
    'exec sql begin declare section;',
    'dcl-s hv_CustId packed(9:0);',
    'exec sql end declare section;'
  ].join('\n'),
  mustInclude: [
    'exec sql begin declare section;',
    'exec sql end declare section;'
  ],
  mustExclude: [
    'begin\n',
    'end;\nend;'
  ]
};

export default testCase;
