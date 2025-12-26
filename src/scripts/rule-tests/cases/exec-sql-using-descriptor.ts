import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-using-descriptor',
  input: [
    '**free',
    'exec sql execute S1 using descriptor :desc;',
    'end-exec;',
    'exec sql execute immediate :stmt using descriptor :desc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute S1',
    'using',
    'descriptor :desc;',
    'execute immediate',
    ':stmt',
    'using',
    'descriptor :desc;'
  ]
};

export default testCase;
