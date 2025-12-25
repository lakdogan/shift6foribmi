// Split a string at the last space within maxLen, returning chunk and rest.
export function splitStringBySpaces(
  text: string,
  maxLen: number
): { chunk: string; rest: string } | null {
  if (text.length <= maxLen) {
    return { chunk: text, rest: '' };
  }
  const splitAt = text.lastIndexOf(' ', maxLen);
  if (splitAt <= 0) return null;
  const chunk = text.slice(0, splitAt + 1);
  const rest = text.slice(splitAt + 1);
  return { chunk, rest };
}
