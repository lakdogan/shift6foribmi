import type { Case } from '../types';

const testCase: Case = {
  name: 'multiline-if-or-chain',
  input: [
    '**free',
    'dcl-proc pr_ValidateRequest;',
    '  dcl-pi *n ind;',
    '    ai_Request likeds(Request) const;',
    '  end-pi;',
    '',
    "  if %trim(ai_Request.Company) = ''",
    "  or %trim(ai_Request.Library) = ''",
    "  or %trim(ai_Request.Hash) = ''",
    "  or %trim(ai_Request.Language) = ''",
    "  or %trim(ai_Request.User) = '';",
    "    pr_SendJsonError('502': 'Parameter Error');",
    '    return *off;',
    '  endif;',
    '',
    '  return *on;',
    'end-proc;'
  ].join('\n'),
  config: {
    wrapLongStrings: true,
    concatStyle: 'fill'
  },
  mustInclude: [
    "if %trim(ai_Request.Company) = ''",
    "or %trim(ai_Request.Library) = ''",
    "or %trim(ai_Request.Hash) = ''",
    "or %trim(ai_Request.Language) = ''",
    "or %trim(ai_Request.User) = '';",
    "pr_SendJsonError('502': 'Parameter Error');",
    'return *off;',
    'endif;'
  ]
};

export default testCase;
