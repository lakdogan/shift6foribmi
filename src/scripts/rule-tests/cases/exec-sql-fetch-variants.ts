import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-fetch-variants',
  input: [
    '**free',
    'exec sql fetch next from C1 into :custId,:custName;',
    'end-exec;',
    'exec sql fetch prior from C1 into :custId,:custName;',
    'end-exec;',
    'exec sql fetch 5 from C1 into :custId,:custName;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'fetch next from C1',
    'fetch prior from C1',
    'fetch 5 from C1',
    'into',
    ':custId,',
    ':custName;'
  ]
};

export default testCase;
