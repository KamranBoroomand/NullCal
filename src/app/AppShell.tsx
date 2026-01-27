import { useEffect, type ReactNode } from 'react';

type AppShellProps = {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  mobileNav?: ReactNode;
  navOpen?: boolean;
  onNavClose?: () => void;
};

const AppShell = ({ topBar, sidebar, children, mobileNav, navOpen, onNavClose }: AppShellProps) => {
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
      <div className="mx-auto w-full max-w-[1600px] px-3 py-5 md:px-4 lg:px-5">
        <div className="flex gap-4">
          <aside className="hidden w-[260px] shrink-0 md:block">{sidebar}</aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <footer className="w-full border-t border-grid px-4 py-4 text-center text-[11px] text-muted">
        “NullCal lives off-grid. No clouds. No watchers. Your time stays yours.”
      </footer>
      {mobileNav && (
        <div
          className={`fixed inset-0 z-40 transition md:hidden ${
            navOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity ${navOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onNavClose}
            role="presentation"
          />
          <aside
            className={`absolute left-0 top-0 flex h-full w-[85vw] max-w-xs flex-col border-r border-grid bg-panel p-4 transition-transform ${
              navOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
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
          </aside>
        </div>
      )}
    </div>
  );
};

export default AppShell;
