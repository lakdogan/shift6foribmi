import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-psm-blocks',
  input: [
    '**free',
    'exec sql create procedure P1() language sql begin declare v int default 0; set v = 1; if v = 1 then set v = 2; end if; return; end;',
    'end-exec;',
    'exec sql create function F1() returns int language sql begin declare outv int default 10; set outv = outv + 1; return outv; end;',
    'end-exec;',
    'exec sql begin declare x int default 3; set x = x + 1; end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create procedure P1()',
    'begin declare v int default 0;',
    'end if;',
    'create function F1() returns int',
    'return outv;',
    'begin declare x int default 3;'
  ]
};

export default testCase;
