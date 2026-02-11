const normalizeDigit = (char: string): string => {
  const code = char.charCodeAt(0);
  if (code >= 0x30 && code <= 0x39) {
    return char;
  }
  if (code >= 0x0660 && code <= 0x0669) {
    return String(code - 0x0660);
  }
  if (code >= 0x06f0 && code <= 0x06f9) {
    return String(code - 0x06f0);
  }
  if (code >= 0xff10 && code <= 0xff19) {
    return String(code - 0xff10);
  }
  return '';
};

export const normalizeOtpCode = (input: string) =>
  Array.from(input ?? '')
    .map((char) => normalizeDigit(char))
    .join('');
