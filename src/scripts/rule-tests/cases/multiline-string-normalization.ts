import type { Case } from '../types';

const testCase: Case = {
  name: 'multiline-string-normalization',
  input: ['**free', "msg = 'Hello", "World';", 'dsply(msg);'].join('\n'),
  mustInclude: ["msg = 'Hello'", "+ 'World';"]
};

export default testCase;
