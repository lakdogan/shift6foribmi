// Determine if a character belongs to a token for operator spacing decisions.
export const isTokenChar = (ch: string): boolean => /[A-Za-z0-9_@#$\])}\(.'"]/.test(ch);
