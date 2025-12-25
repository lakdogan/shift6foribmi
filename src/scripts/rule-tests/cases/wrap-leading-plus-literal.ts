import type { Case } from '../types';

const testCase: Case = {
  name: 'wrap-leading-plus-literal',
  input: [
    '**free',
    "msg = 'A'",
    "+ 'This is a very long literal that should wrap when the column limit is small.';"
  ].join('\n'),
  mustInclude: ["+ 'This is a very long literal"],
  config: {
    wrapLongStrings: true,
    continuationColumn: 50
  }
};

export default testCase;
