import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-update-case-multiline',
  input: [
    '**free',
    'exec sql',
    '  update BKPSAVELOG',
    '  set',
    '    status = :statusFailure,',
    "    message = case when coalesce(trim(message), '') = '' then :timeoutMsg else message end,",
    '    end_ts = coalesce(end_ts, current timestamp),',
    '    dur_sec = coalesce(dur_sec, 0)',
    '  where',
    '    run_id = :ai_RunId',
    '    and status not in (:statusDone, :statusFailure);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    '           set status = :statusFailure,',
    '\n               message = case',
    "\n                         when coalesce(trim(message), '') = ''",
    '\n                         then :timeoutMsg',
    '\n                         else message',
    '\n                         end,',
    '\n         where run_id = :ai_RunId',
    '\n           and status not in (:statusDone, :statusFailure);'
  ]
};

export default testCase;
