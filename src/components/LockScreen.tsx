import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type LockScreenProps = {
  open: boolean;
  pinEnabled: boolean;
  passwordEnabled: boolean;
  webAuthnEnabled: boolean;
  biometricEnabled: boolean;
  twoFactorPending: boolean;
  twoFactorMode?: 'otp' | 'totp';
  onUnlock: (pin?: string) => Promise<boolean>;
  onUnlockWithWebAuthn: () => Promise<boolean>;
  onUnlockWithBiometric: () => Promise<boolean>;
  onVerifyTwoFactor: (code: string) => Promise<boolean>;
  onResendTwoFactor: () => Promise<void>;
};

const LockScreen = ({
  open,
  pinEnabled,
  passwordEnabled,
  webAuthnEnabled,
  biometricEnabled,
  twoFactorPending,
  twoFactorMode = 'otp',
  onUnlock,
  onUnlockWithWebAuthn,
  onUnlockWithBiometric,
  onVerifyTwoFactor,
  onResendTwoFactor
}: LockScreenProps) => {
  const [pin, setPin] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const reduceMotion = useReducedMotion();

  const handleUnlock = async () => {
    const ok = await onUnlock(pin);
    if (!ok) {
      setError('Invalid credentials');
    } else {
      setError('');
      setPin('');
    }
  };

  const handleWebAuthn = async () => {
    const ok = await onUnlockWithWebAuthn();
    if (!ok) {
      setError('Passkey authentication failed.');
    } else {
      setError('');
      setPin('');
    }
  };

  const handleBiometric = async () => {
    const ok = await onUnlockWithBiometric();
    if (!ok) {
      setError('Biometric authentication failed.');
    } else {
      setError('');
      setPin('');
    }
  };

  const handleVerifyTwoFactor = async () => {
    const ok = await onVerifyTwoFactor(twoFactorCode);
    if (!ok) {
      setError('Invalid verification code.');
      return;
    }
    setError('');
    setTwoFactorCode('');
  };

  const showSecretInput = pinEnabled || passwordEnabled;
  const secretLabel = pinEnabled ? 'PIN' : 'Passphrase';

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
                : pinEnabled
                  ? 'Enter your PIN to continue.'
                  : passwordEnabled
                    ? 'Enter your passphrase to continue.'
                    : 'Tap unlock to resume.'}
            </p>
            {showSecretInput && !twoFactorPending && (
              <input
                type="password"
                inputMode={pinEnabled ? 'numeric' : 'text'}
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                placeholder={secretLabel}
              />
            )}
            {twoFactorPending && (
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                placeholder={twoFactorMode === 'totp' ? 'Authenticator code' : 'Verification code'}
              />
            )}
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            {!twoFactorPending && (
              <button
                type="button"
                onClick={handleUnlock}
                className="mt-4 w-full rounded-xl bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
              >
                Unlock
              </button>
            )}
            {twoFactorPending && (
              <button
                type="button"
                onClick={handleVerifyTwoFactor}
                className="mt-4 w-full rounded-xl bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
              >
                Verify code
              </button>
            )}
            {webAuthnEnabled && !twoFactorPending && (
              <button
                type="button"
                onClick={handleWebAuthn}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"
              >
                Use passkey
              </button>
            )}
            {biometricEnabled && !twoFactorPending && (
              <button
                type="button"
                onClick={handleBiometric}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"
              >
                Use biometric unlock
              </button>
            )}
            {twoFactorPending && twoFactorMode === 'otp' && (
              <button
                type="button"
                onClick={onResendTwoFactor}
                className="mt-2 w-full rounded-xl border border-grid px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted"
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
