const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ISSUER = 'NullCal';
const STEP_SECONDS = 30;
const CODE_DIGITS = 6;
const HASH_ALGORITHM = 'SHA1';

const randomBytes = (length: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
};

const toBase32 = (bytes: Uint8Array<ArrayBuffer>) => {
  let bits = 0;
  let value = 0;
  let output = '';
  bytes.forEach((byte) => {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  });
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
};

const fromBase32 = (input: string): Uint8Array<ArrayBuffer> => {
  const normalized = input.trim().replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
};

const toCounterBuffer = (counter: number) => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter);
  return buffer;
};

const hmacSha1 = async (secret: Uint8Array<ArrayBuffer>, counter: number) => {
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-1' }, false, [
    'sign'
  ]);
  return crypto.subtle.sign('HMAC', key, toCounterBuffer(counter));
};

const truncate = (hmac: ArrayBuffer) => {
  const bytes = new Uint8Array(hmac);
  const offset = bytes[bytes.length - 1] & 0x0f;
  const code =
    ((bytes[offset] & 0x7f) << 24) |
    ((bytes[offset + 1] & 0xff) << 16) |
    ((bytes[offset + 2] & 0xff) << 8) |
    (bytes[offset + 3] & 0xff);
  return (code % 10 ** CODE_DIGITS).toString().padStart(CODE_DIGITS, '0');
};

export const generateTotpSecret = () => toBase32(randomBytes(20));

export const buildTotpUri = (accountLabel: string, secret: string) =>
  `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(
    accountLabel
  )}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(ISSUER)}&algorithm=${HASH_ALGORITHM}&digits=${CODE_DIGITS}&period=${STEP_SECONDS}`;

const buildTotpCode = async (secret: string, timestamp: number) => {
  const counter = Math.floor(timestamp / 1000 / STEP_SECONDS);
  const hmac = await hmacSha1(fromBase32(secret), counter);
  return truncate(hmac);
};

export const verifyTotpCode = async (code: string, secret: string) => {
  const normalized = code.replace(/\D/g, '');
  if (normalized.length !== CODE_DIGITS) {
    return false;
  }
  const now = Date.now();
  const windows = [0, -1, 1];
  for (const offset of windows) {
    const candidate = await buildTotpCode(secret, now + offset * STEP_SECONDS * 1000);
    if (candidate === normalized) {
      return true;
    }
  }
  return false;
};
