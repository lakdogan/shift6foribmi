import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-psm-handlers',
  input: [
    '**free',
    'exec sql create procedure P2() language sql begin declare continue handler for sqlexception set :err = 1; set :ok = 0; end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create procedure P2() language sql',
    'begin',
    'declare continue handler for sqlexception set :err = 1;',
    'set :ok = 0;',
    'end;'
  ]
};

export default testCase;
