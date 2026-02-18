import type { Case } from '../types';

const testCase: Case = {
  name: 'ctl-opt-literal-options-no-concat',
  input: [
    '**free',
    'ctl-opt option(*srcstmt:*nodebugio)',
    "        copyright('(C) COPYRIGHT PORTOLAN Commerce Solutions GmbH')",
    "        text('BKP_RUN backup driver for nightly operations and incremental runs');",
    "ctl-opt option(*srcstmt:*nodebugio) text('This control statement literal should stay intact without concat splitting');"
  ].join('\n'),
  mustInclude: [
    "copyright('(C) COPYRIGHT PORTOLAN Commerce Solutions GmbH')",
    "text('BKP_RUN backup driver for nightly operations and incremental runs');",
    "ctl-opt option(*srcstmt:*nodebugio) text('This control statement literal should stay intact without concat splitting');"
  ],
  mustExclude: [
    "+ 'GmbH",
    "+ 'driver",
    "+ 'without concat"
  ],
  config: {
    concatStyle: 'fill',
    wrapLongStrings: true,
    continuationColumn: 50
  }
};

export default testCase;
