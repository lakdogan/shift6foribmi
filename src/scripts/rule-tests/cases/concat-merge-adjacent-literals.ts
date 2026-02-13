import type { Case } from '../types';

const testCase: Case = {
  name: 'concat-merge-adjacent-literals',
  input: [
    '**free',
    'dcl-proc t;',
    '  dcl-pi *n; end-pi;',
    '  dcl-s stmt varchar(512);',
    "  stmt = 'insert into BKPRIDLOG ' + '(run_id, run_ts, event_ts, event_code, step, detail) ' + 'values (cast(? as bigint), cast(? as timestamp), ' + 'cast(? as timestamp), cast(? as char(1)), ' + 'cast(? ' + 'as char(20)), cast(? as varchar(128)))';",
    'end-proc;'
  ].join('\n'),
  mustInclude: [
    "+ '(run_id, run_ts, event_ts, event_code, step, detail) values (cast(? as bigint), cast(? as timestamp), cast(? as timestamp), cast(? as char(1)), cast(? as char(20)), cast(? as varchar(128)))';"
  ],
  mustExclude: [
    "cast(? as char(1)), ' + 'cast(? "
  ],
  config: {
    continuationColumn: 120
  }
};

export default testCase;
