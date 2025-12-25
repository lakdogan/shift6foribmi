import type { Case } from '../types';

const testCase: Case = {
  name: 'wrap-long-literal-new-line',
  input: [
    '**free',
    "msg = 'A' + 'B' + 'This is a very long literal that should split when it starts a new line due to column limits.';"
  ].join('\n'),
  mustInclude: ["+ 'literal that should split"],
  config: {
    wrapLongStrings: true,
    continuationColumn: 50
  }
};

export default testCase;
