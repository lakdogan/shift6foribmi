import type { Case } from '../types';

const testCase: Case = {
  name: 'string-parentheses-trim',
  input: ['**free', "msg = (  'abc'  );"].join('\n'),
  mustInclude: ["msg = ('abc');"]
};

export default testCase;
