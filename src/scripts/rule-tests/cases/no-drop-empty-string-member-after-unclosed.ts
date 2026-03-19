import type { Case } from '../types';

const testCase: Case = {
  name: 'no-drop-empty-string-member-after-unclosed',
  input: [
    '**free',
    'dcl-ds Request qualified inz;',
    "  Broken varchar(10) inz('abc",
    "  User varchar(200) ccsid(*utf8) inz('');",
    "  UserRaw varchar(200) ccsid(*utf8) inz('');",
    'end-ds;',
    'dcl-s after timestamp;'
  ].join('\n'),
  config: {
    fixMultilineStringLiterals: true
  },
  mustInclude: [
    'dcl-ds Request qualified inz;',
    "Broken varchar(10) inz('abc'",
    "User varchar(200) ccsid(*utf8) inz('');",
    "UserRaw varchar(200) ccsid(*utf8) inz('');",
    'end-ds;',
    'dcl-s after timestamp;'
  ],
  mustExclude: [
    "+ '  User varchar(200) ccsid(*utf8) inz('');'",
    "+ '  UserRaw varchar(200) ccsid(*utf8) inz('');'",
    "+ 'end-ds;'",
    "+ 'dcl-s after timestamp;'"
  ]
};

export default testCase;
