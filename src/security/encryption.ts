const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

export type EncryptedPayload = {
  version: 1;
  salt: string;
  iv: string;
  ciphertext: string;
};

const deriveKey = async (passphrase: string, salt: Uint8Array<ArrayBuffer>) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptPayload = async (data: unknown, passphrase: string): Promise<EncryptedPayload> => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  const encoded = textEncoder.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext)
  };
};

export const decryptPayload = async (payload: EncryptedPayload, passphrase: string) => {
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(payload.ciphertext)
  );
  return JSON.parse(textDecoder.decode(decrypted));
};

const NOTE_PREFIX = 'enc:v1:';

export const isEncryptedNote = (value?: string) => Boolean(value?.startsWith(NOTE_PREFIX));

export const encryptNote = async (note: string, passphrase: string) => {
  const payload = await encryptPayload({ note }, passphrase);
  return `${NOTE_PREFIX}${JSON.stringify(payload)}`;
};

export const decryptNote = async (payload: string, passphrase: string) => {
  if (!payload.startsWith(NOTE_PREFIX)) {
    return payload;
  }
  const raw = payload.slice(NOTE_PREFIX.length);
  const parsed = JSON.parse(raw) as EncryptedPayload;
  const data = await decryptPayload(parsed, passphrase);
  return typeof data?.note === 'string' ? data.note : '';
};
