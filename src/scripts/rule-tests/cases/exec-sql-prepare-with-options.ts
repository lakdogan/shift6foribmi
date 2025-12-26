import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-prepare-with-options',
  input: [
    '**free',
    'exec sql prepare S1 from :stmt;',
    'end-exec;',
    'exec sql execute S1 using :a,:b;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'prepare S1 from',
    ':stmt;',
    'execute S1',
    'using',
    ':a,',
    ':b;'
  ]
};

export default testCase;
