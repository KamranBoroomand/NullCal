import type { ReactNode } from 'react';

type AppShellProps = {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
};

const AppShell = ({ topBar, sidebar, children }: AppShellProps) => (
  <div className="min-h-screen">
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0f14]/80 backdrop-blur">
      {topBar}
    </header>
    <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-6">
      <aside className="hidden w-[280px] shrink-0 lg:block">{sidebar}</aside>
      <main className="flex-1">{children}</main>
    </div>
  </div>
);

export default AppShell;
