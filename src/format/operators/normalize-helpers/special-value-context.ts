// Normalize spacing for special-value contexts in non-string segments.
export const applySpecialValueContextSpacing = (
  segment: string,
  contextPattern: RegExp
): string => {
  return segment
    .replace(contextPattern, '$1 *$2')
    .replace(
      /\b(IF|ELSEIF|WHEN|DOW|DOU|FOR|ON-ERROR|ON-EXIT)\s+\*\s+IN\s*([0-9A-Z]{2})\b/gi,
      '$1 *IN$2'
    );
};
