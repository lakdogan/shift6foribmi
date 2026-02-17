import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-keyword-case-ddl-lower',
  input: [
    '**free',
    'exec sql',
    'CREATE TABLE IF NOT EXISTS FANTASY.HERO (',
    'HERO_ID integer generated always AS identity,',
    'CREATED_TS TIMESTAMP NOT NULL DEFAULT current_timestamp,',
    'PRIMARY key (QUEST_ID)',
    ');',
    'end-exec;',
    'exec sql select cast(NULL AS timestamp) from SYSIBM/SYSDUMMY1;',
    'end-exec;'
  ].join('\n'),
  config: {
    execSqlKeywordCase: 'lower'
  },
  mustInclude: [
    'create table if not exists FANTASY.HERO (',
    'HERO_ID     integer generated always as identity,',
    'CREATED_TS  timestamp not null default current_timestamp,',
    'primary key (QUEST_ID)',
    'cast(null as timestamp)'
  ],
  mustExclude: [
    'CREATE TABLE IF NOT EXISTS FANTASY.HERO (',
    'generated always AS identity,',
    'CREATED_TS  TIMESTAMP NOT NULL DEFAULT current_timestamp,',
    'PRIMARY key (QUEST_ID)',
    'cast(NULL AS timestamp)'
  ]
};

export default testCase;
