import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAppStore } from '../app/AppStore';

type PrivacyContextValue = {
  privacyScreenOn: boolean;
  togglePrivacyScreen: () => void;
  setPrivacyScreenOn: (value: boolean) => void;
};

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

const PrivacyScreenOverlay = ({ open }: { open: boolean }) => {
  const reduceMotion = useReducedMotion();
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '');
  const modifier = isMac ? 'Cmd' : 'Ctrl';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 privacy-noise" aria-hidden="true" />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0b0f14] p-8 text-center text-sm"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-muted">LOCKED</p>
            <h2 className="mt-2 text-lg font-semibold text-text">Privacy Screen</h2>
            <p className="mt-2 text-xs text-muted">
              Press {modifier}+Shift+L to return.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const PrivacyScreenProvider = ({ children }: { children: ReactNode }) => {
  const { state } = useAppStore();
  const [privacyScreenOn, setPrivacyScreenOn] = useState(false);
  const hotkeyEnabled = state?.settings.privacyScreenHotkeyEnabled ?? true;

  useEffect(() => {
    if (!hotkeyEnabled) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setPrivacyScreenOn((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [hotkeyEnabled]);

  useEffect(() => {
    if (!hotkeyEnabled && privacyScreenOn) {
      setPrivacyScreenOn(false);
    }
  }, [hotkeyEnabled, privacyScreenOn]);

  const value = useMemo(
    () => ({
      privacyScreenOn,
      togglePrivacyScreen: () => setPrivacyScreenOn((prev) => !prev),
      setPrivacyScreenOn
    }),
    [privacyScreenOn]
  );

  return (
    <PrivacyContext.Provider value={value}>
      {children}
      <PrivacyScreenOverlay open={privacyScreenOn} />
    </PrivacyContext.Provider>
  );
};

export const usePrivacyScreen = () => {
  const ctx = useContext(PrivacyContext);
  if (!ctx) {
    throw new Error('usePrivacyScreen must be used within PrivacyScreenProvider');
  }
  return ctx;
};
