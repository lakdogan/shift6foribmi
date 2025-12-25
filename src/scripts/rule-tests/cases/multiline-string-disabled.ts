import type { Case } from '../types';

const testCase: Case = {
  name: 'multiline-string-disabled',
  input: ['**free', "msg = 'Hello", "World';"].join('\n'),
  mustInclude: ["msg = 'Hello", "World';"],
  config: {
    fixMultilineStringLiterals: false
  }
};

export default testCase;
