import { normalizeOtpCode } from './otp';

const CHALLENGE_KEY = 'nullcal:2fa:challenge';
const VERIFIED_KEY = 'nullcal:2fa:verified';
const encoder = new TextEncoder();
const OTP_CODE_DIGITS = 6;

export type TwoFactorChannel = 'email' | 'sms';

type StoredChallenge = {
  hash: string;
  salt: string;
  expiresAt: number;
};

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

const hashCode = async (code: string, salt: Uint8Array<ArrayBuffer>) => {
  const payload = `${code}:${toBase64(salt)}`;
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
  return toBase64(digest);
};

const saveChallenge = (challenge: StoredChallenge) => {
  window.sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
};

const readChallenge = (): StoredChallenge | null => {
  const raw = window.sessionStorage.getItem(CHALLENGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredChallenge;
  } catch {
    return null;
  }
};

export const clearTwoFactorChallenge = () => {
  window.sessionStorage.removeItem(CHALLENGE_KEY);
};

export const clearTwoFactorSession = () => {
  window.sessionStorage.removeItem(VERIFIED_KEY);
  clearTwoFactorChallenge();
};

export const isTwoFactorVerified = () => window.sessionStorage.getItem(VERIFIED_KEY) === '1';

export const markTwoFactorVerified = () => {
  window.sessionStorage.setItem(VERIFIED_KEY, '1');
  clearTwoFactorChallenge();
};

const notifyFallback = async (code: string) => {
  if (typeof Notification === 'undefined') {
    return false;
  }
  let permission = Notification.permission;
  if (Notification.permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }
  if (permission === 'granted') {
    new Notification('NullCal verification code', {
      body: `Your code: ${code}`
    });
    return true;
  }
  return false;
};

export const startTwoFactorChallenge = async (channel: TwoFactorChannel, destination: string | undefined) => {
  if (!destination) {
    throw new Error('Two-factor destination required.');
  }
  const code = `${crypto.getRandomValues(new Uint32Array(1))[0] % 1000000}`.padStart(6, '0');
  const salt = randomBytes(16);
  const hash = await hashCode(code, salt);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  saveChallenge({ hash, salt: toBase64(salt), expiresAt });

  let deliveredByGateway = false;
  let gatewayError: unknown;
  try {
    const { sendTwoFactorCode } = await import('./notifications');
    await sendTwoFactorCode(channel, destination, code);
    deliveredByGateway = true;
  } catch (error) {
    gatewayError = error;
  }

  const deliveredByFallback = await notifyFallback(code);
  if (!deliveredByGateway && !deliveredByFallback) {
    clearTwoFactorChallenge();
    throw gatewayError ?? new Error('Unable to deliver verification code.');
  }
};

export const verifyTwoFactorCode = async (input: string) => {
  const challenge = readChallenge();
  if (!challenge) {
    return false;
  }
  if (Date.now() > challenge.expiresAt) {
    clearTwoFactorChallenge();
    return false;
  }
  const normalizedInput = normalizeOtpCode(input);
  if (normalizedInput.length !== OTP_CODE_DIGITS) {
    return false;
  }
  const salt = fromBase64(challenge.salt);
  const hash = await hashCode(normalizedInput, salt);
  if (hash !== challenge.hash) {
    return false;
  }
  markTwoFactorVerified();
  return true;
};
