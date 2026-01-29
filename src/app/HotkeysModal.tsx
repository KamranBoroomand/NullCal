import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const modalPadding = {
  paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
  paddingRight: 'calc(env(safe-area-inset-right) + 1rem)',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
  paddingLeft: 'calc(env(safe-area-inset-left) + 1rem)'
};

type HotkeysModalProps = {
  open: boolean;
  onClose: () => void;
};

const HotkeysModal = ({ open, onClose }: HotkeysModalProps) => {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={modalPadding}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="w-full max-w-xl overflow-auto rounded-3xl border border-grid bg-panel p-6 text-sm text-muted shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Command Strip Hotkeys</p>
                <h2 className="mt-2 text-xl font-semibold text-text">Quick command reference</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-grid px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted hover:text-text"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-text">
                Privacy screen (cheat): Cmd/Ctrl+Shift+L
              </div>
              <ul className="grid gap-3">
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Privacy screen</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+L</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Lock now</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+K</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Focus command/search</span>
                  <span className="text-xs font-semibold text-text">/</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Toggle secure mode</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+S</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Toggle theme</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+T</span>
                </li>
              </ul>
              <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-muted">
                Command strip: /add, /lock, /privacy, /decoy, /export clean, /export full
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HotkeysModal;
