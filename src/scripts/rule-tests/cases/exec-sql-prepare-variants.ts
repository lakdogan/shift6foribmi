import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-prepare-variants',
  input: [
    '**free',
    'exec sql prepare S1 from :stmt;',
    'end-exec;',
    'exec sql execute S1;',
    'end-exec;',
    'exec sql execute immediate :stmt using :a;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'prepare S1 from',
    ':stmt;',
    'execute S1;',
    'execute immediate',
    ':stmt',
    'using',
    ':a;'
  ]
};

export default testCase;
