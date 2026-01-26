import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

const Modal = ({ title, open, onClose, children }: ModalProps) => {
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

  const reduceMotion = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0" onClick={onClose} role="presentation" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 mx-4 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-grid bg-panel2 p-4 text-sm shadow-2xl sm:mx-0 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full border border-grid px-2 py-1 text-xs text-muted transition hover:text-text"
              >
                ESC
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
