import type { Case } from '../types';

const testCase: Case = {
  name: 'no-drop-empty-string-decl-after-unclosed',
  input: [
    '**free',
    "dcl-s broken varchar(10) inz('abc",
    "dcl-s warnMsg varchar(128) inz('');",
    'dcl-s reportFromTs timestamp;'
  ].join('\n'),
  mustInclude: [
    "dcl-s warnMsg varchar(128) inz('');",
    'dcl-s reportFromTs timestamp;'
  ]
};

export default testCase;
