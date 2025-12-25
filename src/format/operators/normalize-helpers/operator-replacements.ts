// Normalize operator token spacing inside a non-string segment.
export const applyOperatorReplacements = (segment: string): string => {
  let next = segment;
  next = next.replace(/\s*<=\s*/g, ' __LE__ ');
  next = next.replace(/\s*>=\s*/g, ' __GE__ ');
  next = next.replace(/\s*<>\s*/g, ' __NE__ ');
  next = next.replace(/\s*([+\-*/%])\s*=\s*/g, ' __CASSIGN_$1__ ');
  next = next.replace(/\s*<\s*/g, ' < ');
  next = next.replace(/\s*>\s*/g, ' > ');
  next = next.replace(/\s*=\s*/g, ' = ');
  next = next.replace(/__LE__/g, ' <= ');
  next = next.replace(/__GE__/g, ' >= ');
  next = next.replace(/__NE__/g, ' <> ');
  next = next.replace(/__CASSIGN_([+\-*/%])__/g, ' $1= ');
  next = next.replace(/\s+([+\-*/%]=)/g, ' $1');
  next = next.replace(/([+\-*/%]=)\s+/g, '$1 ');
  next = next.replace(
    /\s*\b(AND|OR|NOT|XOR)\b\s*/gi,
    (match: string, op: string, offset: number, source: string) => {
      const before = source.slice(0, offset);
      const atStart = before.trim().length === 0;
      return (atStart ? '' : ' ') + op + ' ';
    }
  );
  next = next.replace(
    /\s*(\*AND|\*OR|\*NOT|\*XOR)\s*/gi,
    (match: string, op: string, offset: number, source: string) => {
      const before = source.slice(0, offset);
      const atStart = before.trim().length === 0;
      return (atStart ? '' : ' ') + op + ' ';
    }
  );
  return next;
};
