const toBase64 = (data: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(data)));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

const randomBuffer = (size: number) => crypto.getRandomValues(new Uint8Array(size));

export const isBiometricSupported = async () => {
  if (typeof window === 'undefined' || !('PublicKeyCredential' in window)) {
    return false;
  }
  if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    return false;
  }
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
};

export const registerBiometricCredential = async () => {
  const supported = await isBiometricSupported();
  if (!supported) {
    throw new Error('Biometric authentication not supported.');
  }
  const challenge = randomBuffer(32);
  const userId = randomBuffer(16);
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'NullCal' },
      user: {
        id: userId,
        name: 'biometric@nullcal',
        displayName: 'NullCal Biometric'
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required'
      },
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Biometric registration cancelled.');
  }

  return toBase64(credential.rawId);
};

export const authenticateBiometricCredential = async (credentialId: string) => {
  const supported = await isBiometricSupported();
  if (!supported) {
    throw new Error('Biometric authentication not supported.');
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
      userVerification: 'required',
      timeout: 60000
    }
  })) as PublicKeyCredential | null;

  return Boolean(credential);
};
