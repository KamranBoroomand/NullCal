import { useEffect, useRef, useState } from 'react';
import IconButton from '../components/IconButton';
import Clock from '../components/Clock';
import ThemeToggle from '../components/ThemeToggle';
import SecurityBadge from '../components/SecurityBadge';
import type { ThemeMode } from '../theme/ThemeProvider';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path
      d="M9.999 6.1a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Zm8.1 3.9a7.9 7.9 0 0 0-.08-1.12l1.87-1.45-1.88-3.26-2.27.88a7.9 7.9 0 0 0-1.94-1.12l-.35-2.4H7.59l-.35 2.4a7.9 7.9 0 0 0-1.94 1.12l-2.27-.88-1.88 3.26 1.87 1.45a8.35 8.35 0 0 0 0 2.24L1.15 12.7l1.88 3.26 2.27-.88c.6.46 1.25.84 1.94 1.12l.35 2.4h4.77l.35-2.4a7.9 7.9 0 0 0 1.94-1.12l2.27.88 1.88-3.26-1.87-1.46c.05-.37.08-.74.08-1.12Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d={direction === 'left' ? 'M7.5 2.25 4.5 6l3 3.75' : 'M4.5 2.25 7.5 6l-3 3.75'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 6h14M3 10h14M3 14h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const OverflowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="3" cy="8" r="1.4" fill="currentColor" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    <circle cx="13" cy="8" r="1.4" fill="currentColor" />
  </svg>
);

type ProfileOption = {
  id: string;
  name: string;
};

type TopBarProps = {
  view?: 'timeGridWeek' | 'dayGridMonth';
  onViewChange?: (view: 'timeGridWeek' | 'dayGridMonth') => void;
  onToday?: () => void;
  onHome: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
  onOpenSettings: () => void;
  onLockNow: () => void;
  onInstall?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  networkLocked: boolean;
  onOpenNav?: () => void;
};

const TopBar = ({
  view,
  onViewChange,
  onToday,
  onHome,
  onPrev,
  onNext,
  search,
  onSearchChange,
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateProfile,
  onOpenSettings,
  onLockNow,
  onInstall,
  theme,
  onThemeChange,
  networkLocked,
  onOpenNav
}: TopBarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuOpen]);

  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[auto,1fr,auto] items-start gap-3 px-4 py-4 text-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            className="flex-none rounded-full border border-grid bg-panel px-3 py-2 text-muted transition hover:text-text md:hidden"
            aria-label="Open navigation"
          >
            <span className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
              <img
                src={mark2x}
                srcSet={`${mark1x} 1x, ${mark2x} 2x`}
                alt=""
                aria-hidden="true"
                className="h-full w-full rounded-xl"
                draggable={false}
              />
            </span>
            <span className="text-[0.7rem] font-medium leading-none tracking-[0.2em]">NullCal</span>
            <span className="h-0.5 w-6 rounded-full bg-accent/80" />
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          className="flex flex-none flex-col items-center gap-1 rounded-2xl border border-grid bg-panel px-3 py-2 text-text transition hover:border-accent/60"
          aria-label="Go to calendar"
        >
          <span className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
            <img
              src={mark2x}
              srcSet={`${mark1x} 1x, ${mark2x} 2x`}
              alt=""
              aria-hidden="true"
              className="h-full w-full rounded-xl"
              draggable={false}
            />
          </span>
          <span className="text-[0.7rem] font-medium leading-none tracking-[0.2em]">NullCal</span>
          <span className="h-0.5 w-6 rounded-full bg-accent/80" />
        </button>
        {onToday && (
          <button
            onClick={onToday}
            className="flex h-10 items-center whitespace-nowrap rounded-full border border-grid bg-panel px-4 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
          >
            Today
          </button>
        )}
        {view && onViewChange && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-full border border-grid bg-panel px-1 whitespace-nowrap">
              <button
                onClick={() => onViewChange('timeGridWeek')}
                className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 text-xs uppercase tracking-[0.2em] transition ${
                  view === 'timeGridWeek' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => onViewChange('dayGridMonth')}
                className={`flex h-10 items-center whitespace-nowrap rounded-full px-4 text-xs uppercase tracking-[0.2em] transition ${
                  view === 'dayGridMonth' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
                }`}
              >
                Month
              </button>
            </div>
            {onPrev && onNext && (
              <div className="hidden items-center gap-2 lg:flex">
                <IconButton label="Previous" onClick={onPrev}>
                  <ChevronIcon direction="left" />
                </IconButton>
                <IconButton label="Next" onClick={onNext}>
                  <ChevronIcon direction="right" />
                </IconButton>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex-none">
          <SecurityBadge networkLocked={networkLocked} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden min-w-[160px] max-w-[260px] w-[240px] shrink md:block">
            {onSearchChange && (
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search events"
                className="h-10 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-grid bg-panel px-4 text-xs text-muted placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            )}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <select
              value={activeProfileId}
              onChange={(event) => onProfileChange(event.target.value)}
              className="h-10 w-[120px] flex-none whitespace-nowrap rounded-full border border-grid bg-panel px-3 text-xs text-muted"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id} className="bg-panel2">
                  {profile.name}
                </option>
              ))}
            </select>
            <button
              onClick={onCreateProfile}
              className="hidden h-10 flex-none whitespace-nowrap rounded-full border border-grid bg-panel px-4 text-xs text-muted transition hover:text-text lg:inline-flex"
            >
              + Profile
            </button>
          </div>
          {onInstall && (
            <button
              onClick={onInstall}
              className="hidden flex-none whitespace-nowrap rounded-full border border-accent/40 bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent transition hover:border-accent hover:text-text md:inline-flex"
            >
              Install
            </button>
          )}
          <button
            onClick={onLockNow}
            className="flex h-10 items-center whitespace-nowrap rounded-full border border-grid bg-panel px-4 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
          >
            Lock now
          </button>
          <div className="flex-none">
            <IconButton label="Settings" onClick={onOpenSettings}>
              <SettingsIcon />
            </IconButton>
          </div>
          <ThemeToggle value={theme} onChange={onThemeChange} />
          <div className="relative md:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full border border-grid bg-panel px-3 py-2 text-muted transition hover:text-text"
              aria-label="Open menu"
            >
              <OverflowIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-grid bg-panel p-4 shadow-2xl">
                <div className="grid gap-3 text-xs text-muted">
                  {onSearchChange && (
                    <input
                      value={search}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="Search events"
                      className="h-10 w-full rounded-full border border-grid bg-panel2 px-4 text-xs text-muted placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
                    />
                  )}
                  <div className="grid gap-2">
                    <select
                      value={activeProfileId}
                      onChange={(event) => onProfileChange(event.target.value)}
                      className="h-10 rounded-full border border-grid bg-panel2 px-3 text-xs text-muted"
                    >
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id} className="bg-panel2">
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        onCreateProfile();
                        setMenuOpen(false);
                      }}
                      className="h-10 rounded-full border border-grid bg-panel2 px-3 text-xs text-muted transition hover:text-text"
                    >
                      + Profile
                    </button>
                  </div>
                  {onInstall && (
                    <button
                      onClick={() => {
                        onInstall();
                        setMenuOpen(false);
                      }}
                      className="rounded-full border border-accent/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-accent"
                    >
                      Install
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setMenuOpen(false);
                    }}
                    className="rounded-full border border-grid px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                  >
                    Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="hidden items-center justify-end md:flex">
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
