import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-function-return-select',
  input: [
    '**free',
    'exec sql',
    '  create or replace function FANTASY.F_TOP_HEROES()',
    '  returns table',
    '    (HERO_NAME varchar(60), GOLD decimal(15,2))',
    '  language sql',
    '  return',
    '    select HERO_NAME, GOLD',
    '      from FANTASY.HERO',
    '      order by GOLD desc',
    '      fetch first 3 rows only;',
    'end-exec;'
  ].join('\n'),
  config: {
    execSqlKeywordCase: 'upper'
  },
  mustInclude: [
    'EXEC SQL',
    'CREATE OR REPLACE FUNCTION FANTASY.F_TOP_HEROES()',
    'RETURNS TABLE (',
    'HERO_NAME VARCHAR(60),',
    'GOLD DECIMAL(15,2)',
    'LANGUAGE SQL',
    'RETURN',
    'SELECT',
    'FROM FANTASY.HERO',
    'ORDER BY',
    'FETCH FIRST 3 ROWS ONLY;'
  ],
  mustExclude: [
    'EXEC SQL CREATE OR REPLACE FUNCTION FANTASY.F_TOP_HEROES() RETURNS TABLE'
  ]
};

export default testCase;
