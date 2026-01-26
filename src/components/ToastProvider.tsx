import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Toast = {
  id: string;
  message: string;
  tone?: 'success' | 'error' | 'info';
};

type ToastContextValue = {
  notify: (message: string, tone?: Toast['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduceMotion = useReducedMotion();

  const notify = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const toast: Toast = { id: crypto.randomUUID(), message, tone };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reduceMotion ? false : { opacity: 0, x: 40 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border border-grid bg-panel px-4 py-3 text-xs text-text shadow-card ${
                toast.tone === 'success'
                  ? 'text-accent'
                  : toast.tone === 'error'
                    ? 'text-danger'
                    : 'text-text'
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
