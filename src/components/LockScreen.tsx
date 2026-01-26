import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type LockScreenProps = {
  open: boolean;
  pinEnabled: boolean;
  onUnlock: (pin?: string) => Promise<boolean>;
};

const LockScreen = ({ open, pinEnabled, onUnlock }: LockScreenProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const reduceMotion = useReducedMotion();

  const handleUnlock = async () => {
    const ok = await onUnlock(pin);
    if (!ok) {
      setError('Invalid PIN');
    } else {
      setError('');
      setPin('');
    }
  };

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
              {pinEnabled ? 'Enter your PIN to continue.' : 'Tap unlock to resume.'}
            </p>
            {pinEnabled && (
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                placeholder="PIN"
              />
            )}
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <button
              type="button"
              onClick={handleUnlock}
              className="mt-4 w-full rounded-xl bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14]"
            >
              Unlock
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LockScreen;
