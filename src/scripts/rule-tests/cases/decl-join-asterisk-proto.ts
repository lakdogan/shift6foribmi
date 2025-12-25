import type { Case } from '../types';

const testCase: Case = {
  name: 'decl-join-asterisk-proto',
  input: ['**free', 'dcl-pr MyProto;', '  * testvar;', 'end-pr;'].join('\n'),
  mustInclude: ['*testvar;']
};

export default testCase;
