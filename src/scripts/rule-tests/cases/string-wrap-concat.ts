import type { Case } from '../types';

const testCase: Case = {
  name: 'string-wrap-concat',
  input: [
    '**free',
    "msg='User='+%trim(user)+';Action='+%trim(action)+';Status='+%trim(status)+';Timestamp='+%char(%timestamp())+';Details='+",
    "'Some very long detail text that should show how continuation lines get aligned and made readable by the formatter in a consistent way';"
  ].join('\n'),
  mustInclude: [
    "msg = 'User=' + %trim(user) + ';Action=' + %trim(action)",
    "+ ';Details=' + 'Some",
    "+ 'detail text that should show how continuation lines get",
    "+ 'aligned and made readable by the formatter in a",
    "+ 'consistent way';"
  ],
  config: {
    wrapLongStrings: true
  }
};

export default testCase;
