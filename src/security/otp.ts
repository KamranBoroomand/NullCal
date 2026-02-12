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

const isSoftSeparator = (char: string) =>
  char === ' ' || char === '-' || char === '_' || char === '.' || char === ':';

export const extractOtpCode = (input: string, digits = 6) => {
  const raw = Array.from(input ?? '');
  let candidate = '';

  for (const char of raw) {
    const digit = normalizeDigit(char);
    if (digit) {
      candidate += digit;
      if (candidate.length === digits) {
        return candidate;
      }
      continue;
    }
    if (candidate.length === 0) {
      continue;
    }
    if (isSoftSeparator(char) && candidate.length < digits) {
      continue;
    }
    candidate = '';
  }

  const normalized = normalizeOtpCode(input);
  if (normalized.length >= digits) {
    return normalized.slice(0, digits);
  }
  return normalized;
};
