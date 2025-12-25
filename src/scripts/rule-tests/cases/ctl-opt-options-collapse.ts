import type { Case } from '../types';

const testCase: Case = {
  name: 'ctl-opt-options-collapse',
  input: [
    '**free',
    'ctl-opt option( *srcstmt : *nodebugio : *nounref ) alwnull( *usrctl );'
  ].join('\n'),
  mustInclude: ['option(*srcstmt : *nodebugio : *nounref)', 'alwnull(*usrctl)']
};

export default testCase;
