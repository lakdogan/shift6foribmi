import type { Case } from '../types';

const testCase: Case = {
  name: 'no-drop-empty-string-decl',
  input: [
    '**free',
    'dcl-proc p export;',
    '  dcl-pi *n ind;',
    '  end-pi;',
    "  dcl-s warnMsg varchar(128) inz('');",
    '  dcl-s reportFromTs timestamp;',
    '  if %len(warnMsg) = 0;',
    "    warnMsg = 'ok';",
    '  endif;',
    '  return *on;',
    'end-proc;'
  ].join('\n'),
  config: {
    alignProcedureCallParameters: true,
    fixMultilineStringLiterals: true
  },
  mustInclude: [
    "dcl-s warnMsg varchar(128) inz('');",
    'dcl-s reportFromTs timestamp;',
    'if %len(warnMsg) = 0;'
  ]
};

export default testCase;
