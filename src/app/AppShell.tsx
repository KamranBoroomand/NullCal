import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTranslations } from '../i18n/useTranslations';

type AppShellProps = {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileNav?: ReactNode;
  navOpen?: boolean;
  onNavClose?: () => void;
};

const AppShell = ({ topBar, sidebar, children, mobileNav, navOpen, onNavClose }: AppShellProps) => {
  const reduceMotion = useReducedMotion();
  const { isOnline } = useNetworkStatus();
  const { t } = useTranslations();

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onNavClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [navOpen, onNavClose]);

  return (
    <div className="min-h-[100dvh] bg-panel2">
      <aside className="fixed left-0 top-0 hidden h-full w-[250px] border-r border-grid bg-panel px-4 py-6 md:flex">
        <div className="flex h-full w-full flex-col overflow-y-auto pr-2">{sidebar}</div>
      </aside>
      <div className="flex min-h-[100dvh] flex-col md:pl-[250px]">
        <header className="sticky top-0 z-20 border-b border-grid bg-panel/95 backdrop-blur">
          {topBar}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="border-t border-grid bg-panel2 px-4 py-2 text-center text-[11px] uppercase tracking-[0.25em] text-accent"
                role="status"
                aria-live="polite"
              >
                {t('app.offline')}
              </motion.div>
            )}
          </AnimatePresence>
        </header>
        <div className="flex-1 px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </div>
        <footer className="w-full border-t border-grid px-4 py-4 text-center text-[11px] text-muted">
          “No cloud. No observers. Your time stays yours.”
        </footer>
      </div>
      <AnimatePresence>
        {mobileNav && navOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
              onClick={onNavClose}
              role="presentation"
            />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-[85vw] max-w-[300px] flex-col border-r border-grid bg-panel p-4 shadow-2xl"
              initial={reduceMotion ? { x: 0 } : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={reduceMotion ? { x: 0 } : { x: '-100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Menu</p>
                <button
                  type="button"
                  onClick={onNavClose}
                  className="rounded-full border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted"
                >
                  Close
                </button>
              </div>
              <div className="mt-4 flex-1 overflow-y-auto pr-2">{mobileNav}</div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppShell;
