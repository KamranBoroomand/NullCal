const encoder = new TextEncoder();

const toBase64 = (data: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(data)));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

export type PinHash = {
  hash: string;
  salt: string;
  iterations: number;
};

export const hashPin = async (pin: string): Promise<PinHash> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 90000;
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
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

export const verifyPin = async (pin: string, stored: PinHash) => {
  const salt = fromBase64(stored.salt);
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, [
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
