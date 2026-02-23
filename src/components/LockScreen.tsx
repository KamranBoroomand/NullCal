import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type LockScreenProps = {
  open: boolean;
  pinEnabled: boolean;
  passwordEnabled: boolean;
  recoveryEnabled?: boolean;
  webAuthnEnabled: boolean;
  biometricEnabled: boolean;
  twoFactorPending: boolean;
  twoFactorMode?: 'otp' | 'totp';
  availableTwoFactorModes?: Array<'otp' | 'totp'>;
  onSelectTwoFactorMode?: (mode: 'otp' | 'totp') => Promise<void>;
  onUnlock: (secret?: string, method?: 'auto' | 'pin' | 'passphrase' | 'recovery') => Promise<boolean>;
  onUnlockWithWebAuthn: () => Promise<boolean>;
  onUnlockWithBiometric: () => Promise<boolean>;
  onVerifyTwoFactor: (code: string) => Promise<boolean>;
  onResendTwoFactor: () => Promise<void>;
};

type AuthAction = 'unlock' | 'webauthn' | 'biometric' | 'verify' | 'resend' | 'twoFactorMode';

const LockScreen = ({
  open,
  pinEnabled,
  passwordEnabled,
  recoveryEnabled = false,
  webAuthnEnabled,
  biometricEnabled,
  twoFactorPending,
  twoFactorMode = 'otp',
  availableTwoFactorModes = ['otp'],
  onSelectTwoFactorMode,
  onUnlock,
  onUnlockWithWebAuthn,
  onUnlockWithBiometric,
  onVerifyTwoFactor,
  onResendTwoFactor
}: LockScreenProps) => {
  const [secret, setSecret] = useState('');
  const [secretMethod, setSecretMethod] = useState<'pin' | 'passphrase' | 'recovery'>(
    pinEnabled ? 'pin' : passwordEnabled ? 'passphrase' : 'recovery'
  );
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState<AuthAction | null>(null);
  const reduceMotion = useReducedMotion();
  const busy = busyAction !== null;

  useEffect(() => {
    if (open) {
      return;
    }
    setSecret('');
    setTwoFactorCode('');
    setError('');
    setBusyAction(null);
  }, [open]);

  const availableSecretMethods = [
    pinEnabled ? ('pin' as const) : null,
    passwordEnabled ? ('passphrase' as const) : null,
    recoveryEnabled ? ('recovery' as const) : null
  ].filter((value): value is 'pin' | 'passphrase' | 'recovery' => Boolean(value));

  useEffect(() => {
    if (availableSecretMethods.length === 0) {
      return;
    }
    if (availableSecretMethods.includes(secretMethod)) {
      return;
    }
    setSecretMethod(availableSecretMethods[0]);
  }, [availableSecretMethods, secretMethod]);

  const handleUnlock = async () => {
    if (busy) {
      return;
    }
    setBusyAction('unlock');
    try {
      const resolvedMethod =
        availableSecretMethods.length > 1
          ? secretMethod
          : availableSecretMethods[0] ?? ('auto' as const);
      const ok = await onUnlock(secret, resolvedMethod);
      if (!ok) {
        setError('Invalid credentials');
      } else {
        setError('');
        setSecret('');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleWebAuthn = async () => {
    if (busy) {
      return;
    }
    setBusyAction('webauthn');
    try {
      const ok = await onUnlockWithWebAuthn();
      if (!ok) {
        setError('Passkey authentication failed.');
      } else {
        setError('');
        setSecret('');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleBiometric = async () => {
    if (busy) {
      return;
    }
    setBusyAction('biometric');
    try {
      const ok = await onUnlockWithBiometric();
      if (!ok) {
        setError('Biometric authentication failed.');
      } else {
        setError('');
        setSecret('');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (busy) {
      return;
    }
    setBusyAction('verify');
    try {
      const ok = await onVerifyTwoFactor(twoFactorCode);
      if (!ok) {
        setError('Invalid verification code.');
        return;
      }
      setError('');
      setTwoFactorCode('');
    } finally {
      setBusyAction(null);
    }
  };

  const handleResendTwoFactor = async () => {
    if (busy) {
      return;
    }
    setBusyAction('resend');
    try {
      await onResendTwoFactor();
      setError('');
      setTwoFactorCode('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to send verification code.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSelectTwoFactorMode = async (mode: 'otp' | 'totp') => {
    if (busy || mode === twoFactorMode) {
      return;
    }
    if (!onSelectTwoFactorMode) {
      return;
    }
    setBusyAction('twoFactorMode');
    try {
      await onSelectTwoFactorMode(mode);
      setTwoFactorCode('');
      setError('');
    } finally {
      setBusyAction(null);
    }
  };

  const showSecretInput = availableSecretMethods.length > 0;
  const supportsSecretMethodChoice = availableSecretMethods.length > 1;
  const resolvedSecretMethod = supportsSecretMethodChoice ? secretMethod : availableSecretMethods[0] ?? 'passphrase';
  const secretLabel =
    resolvedSecretMethod === 'pin' ? 'PIN' : resolvedSecretMethod === 'recovery' ? 'Recovery code' : 'Passphrase';
  const canChooseTwoFactorMode = twoFactorPending && availableTwoFactorModes.length > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="photon-panel w-full max-w-sm rounded-3xl border border-grid p-6 text-center text-sm"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Secure Lock</p>
            <h2 className="mt-2 text-lg font-semibold text-text">NullCAL Locked</h2>
            <p className="mt-2 text-sm text-muted">
              {twoFactorPending
                ? twoFactorMode === 'totp'
                  ? 'Enter your authenticator code to finish unlocking.'
                  : 'Enter your verification code to finish unlocking.'
                : resolvedSecretMethod === 'pin'
                  ? 'Enter your PIN to continue.'
                  : resolvedSecretMethod === 'recovery'
                    ? 'Enter your recovery code to unlock your profile.'
                  : resolvedSecretMethod === 'passphrase'
                    ? 'Enter your passphrase to continue.'
                    : 'Tap unlock to resume.'}
            </p>
            {supportsSecretMethodChoice && !twoFactorPending && (
              <div className="mt-4 grid gap-2 rounded-xl border border-grid bg-panel2 p-1">
                {availableSecretMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSecretMethod(method)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition ${
                      secretMethod === method
                        ? 'bg-accent text-[var(--accentText)]'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {method === 'pin' ? 'PIN' : method === 'recovery' ? 'Recovery' : 'Passphrase'}
                  </button>
                ))}
              </div>
            )}
            {showSecretInput && !twoFactorPending && (
              <input
                type="password"
                inputMode={resolvedSecretMethod === 'pin' ? 'numeric' : 'text'}
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                placeholder={secretLabel}
                disabled={busy}
              />
            )}
            {canChooseTwoFactorMode && (
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-grid bg-panel2 p-1">
                <button
                  type="button"
                  onClick={() => void handleSelectTwoFactorMode('otp')}
                  className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition ${
                    twoFactorMode === 'otp'
                      ? 'bg-accent text-[var(--accentText)]'
                      : 'text-muted hover:text-text'
                  }`}
                  disabled={busy}
                >
                  SMS / Email
                </button>
                <button
                  type="button"
                  onClick={() => void handleSelectTwoFactorMode('totp')}
                  className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] transition ${
                    twoFactorMode === 'totp'
                      ? 'bg-accent text-[var(--accentText)]'
                      : 'text-muted hover:text-text'
                  }`}
                  disabled={busy}
                >
                  Authenticator
                </button>
              </div>
            )}
            {twoFactorPending && (
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                placeholder={twoFactorMode === 'totp' ? 'Authenticator code' : 'Verification code'}
                disabled={busy}
              />
            )}
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            {!twoFactorPending && (
              <button
                type="button"
                onClick={handleUnlock}
                className="mt-4 w-full rounded-xl bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                Unlock
              </button>
            )}
            {twoFactorPending && (
              <button
                type="button"
                onClick={handleVerifyTwoFactor}
                className="mt-4 w-full rounded-xl bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                Verify code
              </button>
            )}
            {webAuthnEnabled && !twoFactorPending && (
              <button
                type="button"
                onClick={handleWebAuthn}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                Use passkey
              </button>
            )}
            {biometricEnabled && !twoFactorPending && (
              <button
                type="button"
                onClick={handleBiometric}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                Use biometric unlock
              </button>
            )}
            {twoFactorPending && twoFactorMode === 'otp' && (
              <button
                type="button"
                onClick={handleResendTwoFactor}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
              >
                Resend code
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LockScreen;
