import type { Case } from '../types';

const testCase: Case = {
  name: 'concat-fill-literals',
  input: [
    '**free',
    'dcl-proc t;',
    '  dcl-pi *n; end-pi;',
    '  dcl-s msg varchar(128);',
    "  msg = 'Alpha beta '",
    "       + 'gamma delta '",
    "       + 'epsilon zeta eta ';",
    'end-proc;'
  ].join('\n'),
  mustInclude: ["msg = 'Alpha beta gamma delta epsilon zeta eta ';"],
  mustExclude: ["+ 'gamma"],
  config: {
    concatStyle: 'fill',
    continuationColumn: 200
  }
};

export default testCase;
