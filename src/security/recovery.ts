const encoder = new TextEncoder();

const toBase64 = (data: ArrayBuffer | ArrayBufferView) =>
  btoa(
    String.fromCharCode(
      ...(
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      )
    )
  );

const fromBase64 = (data: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

const randomBytes = (length: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
};

export type RecoveryCodeHash = {
  hash: string;
  salt: string;
  iterations: number;
};

export const normalizeRecoveryCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

export const generateRecoveryCode = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(16);
  const code = Array.from(bytes)
    .map((value) => charset[value % charset.length])
    .join('');
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
};

export const hashRecoveryCode = async (rawCode: string): Promise<RecoveryCodeHash> => {
  const normalizedCode = normalizeRecoveryCode(rawCode);
  const salt = randomBytes(16);
  const iterations = 180000;
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(normalizedCode), 'PBKDF2', false, [
    'deriveBits'
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return {
    hash: toBase64(bits),
    salt: toBase64(salt),
    iterations
  };
};

export const verifyRecoveryCode = async (rawCode: string, stored: RecoveryCodeHash) => {
  const normalizedCode = normalizeRecoveryCode(rawCode);
  const salt = fromBase64(stored.salt);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(normalizedCode), 'PBKDF2', false, [
    'deriveBits'
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: stored.iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return toBase64(bits) === stored.hash;
};
