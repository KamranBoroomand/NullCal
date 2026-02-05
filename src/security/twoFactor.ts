const CHALLENGE_KEY = 'nullcal:2fa:challenge';
const VERIFIED_KEY = 'nullcal:2fa:verified';
const encoder = new TextEncoder();

export type TwoFactorChannel = 'email' | 'sms';

type StoredChallenge = {
  hash: string;
  salt: string;
  expiresAt: number;
};

const toBase64 = (data: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(data)));

const fromBase64 = (data: string) =>
  Uint8Array.from(atob(data), (c) => c.charCodeAt(0));

const hashCode = async (code: string, salt: Uint8Array) => {
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

const notifyFallback = (code: string) => {
  if (typeof Notification === 'undefined') {
    return;
  }
  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    new Notification('NullCal verification code', {
      body: `Your code: ${code}`
    });
  }
};

export const startTwoFactorChallenge = async (channel: TwoFactorChannel, destination: string | undefined) => {
  if (!destination) {
    throw new Error('Two-factor destination required.');
  }
  const code = `${crypto.getRandomValues(new Uint32Array(1))[0] % 1000000}`.padStart(6, '0');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashCode(code, salt);
  const expiresAt = Date.now() + 10 * 60 * 1000;
  saveChallenge({ hash, salt: toBase64(salt), expiresAt });

  const { sendTwoFactorCode } = await import('./notifications');
  await sendTwoFactorCode(channel, destination, code);
  notifyFallback(code);
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
  const salt = fromBase64(challenge.salt);
  const hash = await hashCode(input.trim(), salt);
  if (hash !== challenge.hash) {
    return false;
  }
  markTwoFactorVerified();
  return true;
};
