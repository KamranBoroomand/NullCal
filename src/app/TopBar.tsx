import { useEffect, useRef, useState } from 'react';
import IconButton from '../components/IconButton';
import Clock from '../components/Clock';
import ThemeToggle from '../components/ThemeToggle';
import SecurityBadge from '../components/SecurityBadge';
import type { ThemeMode } from '../theme/ThemeProvider';

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

const BrandMark = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="12" fill="#070A0F" stroke="#141A23" strokeWidth="2" />
    <rect x="10" y="10" width="44" height="10" rx="3" fill="#F4FF00" />
    <g stroke="#10151D" strokeWidth="1" opacity="0.9">
      <line x1="22" y1="22" x2="22" y2="54" />
      <line x1="42" y1="22" x2="42" y2="54" />
      <line x1="10" y1="32" x2="54" y2="32" />
      <line x1="10" y1="44" x2="54" y2="44" />
    </g>
    <circle cx="32" cy="38" r="4" fill="#F4FF00" />
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
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-4 text-sm sm:gap-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            className="rounded-full border border-grid bg-panel px-3 py-2 text-muted transition hover:text-text md:hidden"
            aria-label="Open navigation"
          >
            <HamburgerIcon />
          </button>
        )}
        <button
          type="button"
          onClick={onHome}
          className="flex flex-col items-center gap-1 rounded-2xl border border-grid bg-panel px-3 py-2 text-text transition hover:border-accent/60"
          aria-label="Go to calendar"
        >
          <span className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8">
            <BrandMark />
          </span>
          <span className="text-[0.7rem] font-medium leading-none tracking-[0.2em]">NullCal</span>
          <span className="h-0.5 w-6 rounded-full bg-accent/80" />
        </button>
        {onToday && (
          <button
            onClick={onToday}
            className="rounded-full border border-grid bg-panel px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
          >
            Today
          </button>
        )}
        {onPrev && onNext && (
          <div className="hidden items-center gap-2 sm:flex">
            <IconButton label="Previous" onClick={onPrev}>
              <ChevronIcon direction="left" />
            </IconButton>
            <IconButton label="Next" onClick={onNext}>
              <ChevronIcon direction="right" />
            </IconButton>
          </div>
        )}
      </div>
      {view && onViewChange && (
        <div className="flex items-center gap-2 rounded-full border border-grid bg-panel p-1">
          <button
            onClick={() => onViewChange('timeGridWeek')}
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
              view === 'timeGridWeek' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => onViewChange('dayGridMonth')}
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
              view === 'dayGridMonth' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
            }`}
          >
            Month
          </button>
        </div>
      )}
      <div className="ml-auto hidden flex-wrap items-center gap-3 md:flex">
        <SecurityBadge networkLocked={networkLocked} />
        <ThemeToggle value={theme} onChange={onThemeChange} />
        <Clock />
        <div className="relative">
          {onSearchChange && (
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search events"
              className="h-10 w-56 rounded-full border border-grid bg-panel px-4 text-xs text-muted placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeProfileId}
            onChange={(event) => onProfileChange(event.target.value)}
            className="h-10 rounded-full border border-grid bg-panel px-3 text-xs text-muted"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id} className="bg-panel2">
                {profile.name}
              </option>
            ))}
          </select>
          <button
            onClick={onCreateProfile}
            className="h-10 rounded-full border border-grid bg-panel px-3 text-xs text-muted transition hover:text-text"
          >
            + Profile
          </button>
        </div>
        {onInstall && (
          <button
            onClick={onInstall}
            className="rounded-full border border-accent/40 bg-panel px-3 py-2 text-xs uppercase tracking-[0.2em] text-accent transition hover:border-accent hover:text-text"
          >
            Install
          </button>
        )}
        <button
          onClick={onLockNow}
          className="rounded-full border border-grid bg-panel px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
        >
          Lock now
        </button>
        <IconButton label="Settings" onClick={onOpenSettings}>
          <SettingsIcon />
        </IconButton>
      </div>
      <div className="relative ml-auto flex items-center gap-2 md:hidden" ref={menuRef}>
        <SecurityBadge networkLocked={networkLocked} />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-full border border-grid bg-panel px-3 py-2 text-muted transition hover:text-text"
          aria-label="Open menu"
        >
          <OverflowIcon />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-grid bg-panel p-4 shadow-2xl">
            <div className="grid gap-3 text-xs text-muted">
              {onSearchChange && (
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search events"
                  className="h-10 w-full rounded-full border border-grid bg-panel2 px-4 text-xs text-muted placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              )}
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <ThemeToggle value={theme} onChange={onThemeChange} />
              </div>
              <div className="flex items-center justify-between">
                <span>Clock</span>
                <Clock />
              </div>
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
                  onLockNow();
                  setMenuOpen(false);
                }}
                className="rounded-full border border-grid px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted"
              >
                Lock now
              </button>
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
  );
};

export default TopBar;
