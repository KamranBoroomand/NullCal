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

export type LocalAuthHash = {
  hash: string;
  salt: string;
  iterations: number;
};

export const hashLocalSecret = async (secret: string): Promise<LocalAuthHash> => {
  const salt = randomBytes(16);
  const iterations = 140000;
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, [
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

export const verifyLocalSecret = async (secret: string, stored: LocalAuthHash) => {
  const salt = fromBase64(stored.salt);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, [
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
