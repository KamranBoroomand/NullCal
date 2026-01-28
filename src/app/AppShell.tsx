import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-20 border-b border-grid bg-panel backdrop-blur">
        {topBar}
      </header>
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-4 lg:px-5">
        <div className="flex gap-3">
          <aside className="hidden w-[260px] shrink-0 md:block">{sidebar}</aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <footer className="w-full border-t border-grid px-4 py-4 text-center text-[11px] text-muted">
        “No cloud. No observers. Your time stays yours.”
      </footer>
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
              className="absolute left-0 top-0 flex h-full w-[85vw] max-w-xs flex-col border-r border-grid bg-panel p-4 shadow-2xl"
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
