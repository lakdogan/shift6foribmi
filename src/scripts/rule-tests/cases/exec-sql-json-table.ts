import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-json-table',
  input: [
    '**free',
    'exec sql select T.ID, T.NAME from json_table(:payload, \'$\' columns ID int path \'$.id\', NAME varchar(50) path \'$.name\') as T;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'json_table(:payload,',
    'columns ID int path \'$.id\', NAME varchar(50) path \'$.name\') as T',
    'from json_table'
  ]
};

export default testCase;
