const toBase64 = (data: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(data)));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

const randomBuffer = (size: number) => crypto.getRandomValues(new Uint8Array(size));

export const isWebAuthnSupported = () =>
  typeof window !== 'undefined' && 'PublicKeyCredential' in window;

export const registerPasskey = async () => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn not supported.');
  }
  const challenge = randomBuffer(32);
  const userId = randomBuffer(16);
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'NullCal' },
      user: {
        id: userId,
        name: 'local@nullcal',
        displayName: 'NullCal User'
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Passkey creation cancelled.');
  }

  return toBase64(credential.rawId);
};

export const authenticatePasskey = async (credentialId: string) => {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn not supported.');
  }
  const challenge = randomBuffer(32);
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: fromBase64(credentialId),
          type: 'public-key'
        }
      ],
      userVerification: 'preferred',
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  return Boolean(credential);
};
