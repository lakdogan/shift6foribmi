import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-dynamic-variants',
  input: [
    '**free',
    'exec sql prepare S1 from :stmt;',
    'end-exec;',
    'exec sql execute S1 into :id using descriptor :desc;',
    'end-exec;',
    'exec sql execute immediate :stmt into :id,:name using descriptor :desc;',
    'end-exec;',
    'exec sql execute immediate :stmt using :a,:b;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'prepare S1 from',
    ':stmt;',
    'execute S1',
    'into',
    ':id',
    'using',
    'descriptor :desc;',
    'execute immediate',
    'into',
    ':name',
    'descriptor :desc;',
    ':a,',
    ':b;'
  ]
};

export default testCase;
