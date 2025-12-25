import { isSpecialValueToken } from '../helpers/keyword-tokens';

// Normalize asterisk spacing outside declarations (avoid special values).
export const normalizeAsteriskSpacing = (segment: string): string => {
  return segment.replace(
    /([A-Za-z0-9_)\]])\s*\*\s*([A-Za-z0-9_\(])/g,
    (match: string, left: string, right: string, offset: number) => {
      const starIndex = offset + match.indexOf('*');
      if (isSpecialValueToken(segment, starIndex)) {
        return left + ' *' + right;
      }
      return left + ' * ' + right;
    }
  );
};
