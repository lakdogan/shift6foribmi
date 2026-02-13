import type { Case } from '../types';

const testCase: Case = {
  name: 'continuation-column-indent-aware',
  input: [
    '**free',
    'dcl-proc Test;',
    '  dcl-s msg varchar(2000);',
    "  msg = 'A' + 'B' + 'C' + 'D' + 'E' + 'F';",
    'end-proc;'
  ].join('\n'),
  mustInclude: ["msg = 'A' + 'BCDEF';"],
  config: {
    continuationColumn: 50,
    wrapLongStrings: false
  }
};

export default testCase;
