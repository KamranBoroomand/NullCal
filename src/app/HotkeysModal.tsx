import { useEffect, useRef } from 'react';
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
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
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-grid bg-panel p-6 text-sm text-muted shadow-2xl"
            style={{ maxHeight: 'calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Hotkeys</p>
                <h2 className="mt-2 text-xl font-semibold text-text">Quick command reference</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                ref={closeButtonRef}
                aria-label="Close hotkeys"
                className="rounded-full border border-grid px-3 py-1 text-xs uppercase tracking-[0.3em] text-muted hover:text-text"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 grid max-h-[60dvh] gap-3 overflow-auto pr-1">
              <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-text">
                Privacy Screen: Cmd/Ctrl+Shift+P (works even when unfocused)
              </div>
              <ul className="grid gap-3">
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Focus search</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+K</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">New event</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+N</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Previous period</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+←</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Next period</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+→</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Lock now</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+L</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Privacy screen</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+P</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Decoy profile</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+D</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Quick export</span>
                  <span className="text-xs font-semibold text-text">Cmd/Ctrl+Shift+E</span>
                </li>
                <li className="flex items-center justify-between rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Open hotkeys</span>
                  <span className="text-xs font-semibold text-text">?</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HotkeysModal;
