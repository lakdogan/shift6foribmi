import type { Case } from '../types';

const testCase: Case = {
  name: 'comment-indent-following',
  input: [
    '**free',
    'if flag;',
    '// comment before code',
    'dcl-s foo int;',
    '// another comment',
    'dcl-s bar int;',
    'endif;'
  ].join('\n'),
  mustInclude: [
    '  // comment before code',
    '  // another comment'
  ]
};

export default testCase;
