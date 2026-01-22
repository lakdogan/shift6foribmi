import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-exec-immediate-multiline',
  input: [
    '**free',
    'exec sql',
    'begin',
    '  execute immediate',
    '    \'create table qtemp/demo_ins (',
    '       ID char(10),',
    '       NAME char(10)',
    '     )\';',
    'end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute immediate',
    '\'create table qtemp/demo_ins (',
    'ID char(10),',
    'NAME char(10)',
    ')\';'
  ],
  mustExclude: [
    "+ '"
  ]
};

export default testCase;
