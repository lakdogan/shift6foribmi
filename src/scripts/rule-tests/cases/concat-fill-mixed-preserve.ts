import type { Case } from '../types';

const testCase: Case = {
  name: 'concat-fill-mixed-preserve',
  input: [
    '**free',
    'dcl-proc t;',
    '  dcl-pi *n; end-pi;',
    '  dcl-s ao_Sql varchar(1024);',
    "  ao_Sql = 'insert into ' + pr_QName(ai_Lib : 'BKP_REPORT')",
    "         + ' (run_id, run_ts, lib_name) '",
    "         + 'select cast(? as bigint), '",
    "         + 'cast(? as timestamp)';",
    'end-proc;'
  ].join('\n'),
  mustInclude: [
    "+ ' (run_id, run_ts, lib_name) '",
    "+ 'select cast(? as bigint), '"
  ],
  mustExclude: [
    "lib_name) select"
  ],
  config: {
    concatStyle: 'fill',
    continuationColumn: 200
  }
};

export default testCase;
