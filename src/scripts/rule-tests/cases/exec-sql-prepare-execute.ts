import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-prepare-execute',
  input: [
    '**free',
    'exec sql prepare S1 from \'select ID,NAME from SALES/CUSTOMER where STATUS=?\';',
    'end-exec;',
    'exec sql execute S1 using :status,:flag;',
    'end-exec;',
    "exec sql execute immediate 'delete from SALES/CUSTOMER where STATUS=''I''';",
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'prepare S1 from',
    '\'select ID,NAME from SALES/CUSTOMER where STATUS=?\';',
    'execute S1',
    'using',
    ':status,',
    ':flag;',
    'execute immediate',
    "'delete from SALES/CUSTOMER where STATUS=''I''';"
  ]
};

export default testCase;
