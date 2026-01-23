import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-psm-or-replace',
  input: [
    '**free',
    'exec sql create or replace procedure QTEMP/SHIFT6_PSM_DEMO (in pIn int, out pOut varchar(20)) language sql begin declare v int default 0; set v = pIn + 1; if v > 10 then set pOut = \'GT10\'; else set pOut = \'LE10\'; end if; end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create or replace procedure QTEMP/SHIFT6_PSM_DEMO (',
    'in pIn int,',
    'out pOut varchar(20)',
    'language sql',
    'begin',
    'declare v int default 0;',
    'set v = pIn + 1;',
    'if v > 10 then',
    'set pOut = \'GT10\';',
    'else',
    'set pOut = \'LE10\';',
    'end if;',
    'end;'
  ]
};

export default testCase;
