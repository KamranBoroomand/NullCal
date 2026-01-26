import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div className="absolute inset-0" onClick={onClose} role="presentation" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-[#101822] p-6 text-sm shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:text-white"
          >
            ESC
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
