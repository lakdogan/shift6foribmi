import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-case-multiline-drift',
  input: [
    '**free',
    'exec sql',
    '  select',
    '    coalesce(sum(case when status = :statusDone',
    "                                                     and coalesce(trim(message), '') = ''",
    '                                                  then 1 else 0 end), 0)',
    '  from BKPSAVELOG',
    '  where run_id = :ai_RunId;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    "\n                               and coalesce(trim(message), '') = ''",
    '\n                            then 1 else 0 end), 0)'
  ]
};

export default testCase;
