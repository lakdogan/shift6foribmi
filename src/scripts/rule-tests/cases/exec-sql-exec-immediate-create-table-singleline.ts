import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-exec-immediate-create-table-singleline',
  input: [
    '**free',
    'exec sql',
    'begin',
    '  execute immediate \'create table qtemp/demo (ID char(10), NAME char(10))\';',
    'end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute immediate',
    '\'create table qtemp/demo (',
    'ID    char(10),',
    'NAME  char(10)',
    ')\';'
  ],
  mustExclude: [
    '(ID char(10), NAME char(10))'
  ]
};

export default testCase;
