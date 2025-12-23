export const CLOSERS = [
  'END-PROC',
  'ENDPROC',
  'ENDIF',
  'END-IF',
  'ENDDO',
  'END-DO',
  'ENDSL',
  'END-SELECT',
  'ENDSELECT',
  'ENDMON',
  'END-MON',
  'ENDSR',
  'END-SR',
  'ENDFOR',
  'END-FOR',
  'ENDON-EXIT',
  'END-DS',
  'END-PR',
  'END-PI',
  'END-ENUM',
  '/ENDIF'
];

export const OPENERS = [
  'DCL-PROC',
  'IF',
  'DOW',
  'DOU',
  'MONITOR',
  'FOR',
  'SELECT',
  'BEGSR',
  'DCL-DS',
  'DCL-PR',
  'DCL-PI',
  'DCL-ENUM',
  '/IF'
];

export const MID_KEYWORDS = [
  'ELSE',
  'ELSEIF',
  'ELSE IF',
  'WHEN',
  'WHEN-IS',
  'WHEN-IN',
  'OTHER',
  'ON-ERROR',
  'ON-EXIT',
  '/ELSE',
  '/ELSEIF'
];

export const DASH_KEYWORD_PREFIX = /^(DCL|END|ON|WHEN|ELSE|CTL)-[A-Z0-9-]+$/;

export const PATTERNS = [
  '**/*.rpgle',
  '**/*.sqlrpgle',
  '**/*.rpg',
  '**/*.sqlrpg',
  '**/*.rpginc',
  '**/*.rpgleinc'
];

export const LANGUAGE_IDS = ['rpgle', 'sqlrpgle', 'rpg', 'rpginc'];
