import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Clock from '../components/Clock';
import Segmented from '../components/Segmented';
import ThemeToggle from '../components/ThemeToggle';
import type { ThemeMode } from '../theme/ThemeProvider';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;
const pillBase =
  'h-9 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] tracking-[0.18em] uppercase inline-flex items-center justify-center whitespace-nowrap transition';

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

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

type ProfileOption = {
  id: string;
  name: string;
};

type AgentDropdownProps = {
  options: ProfileOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

const AgentDropdown = ({ options, activeId, onChange, className }: AgentDropdownProps) => {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const activeLabel = options.find((option) => option.id === activeId)?.name ?? 'Agent';

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} w-full min-w-[140px] gap-2 px-4 text-muted hover:text-text`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span className="truncate text-center">{activeLabel}</span>
          <span className="flex items-center text-[10px]">▾</span>
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-40 mt-2 w-52 rounded-2xl border border-grid bg-panel p-2 shadow-2xl"
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                  option.id === activeId ? 'bg-panel2 text-text' : 'text-muted'
                }`}
              >
                {option.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type ProfileMenuProps = {
  options: ProfileOption[];
  activeId: string;
  onChange?: (id: string) => void;
  onCreateProfile?: () => void;
  disabled?: boolean;
};

const ProfileMenu = ({ options, activeId, onChange, onCreateProfile, disabled }: ProfileMenuProps) => {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const activeLabel = options.find((option) => option.id === activeId)?.name ?? 'Profile';

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (disabled) {
    return (
      <div className={`${pillBase} px-3 text-muted`}>
        <span className="truncate">Profile: {activeLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} gap-2 px-3 text-muted hover:text-text`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Profile
        <span className="text-[10px]">▾</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-grid bg-panel p-2 shadow-2xl"
          >
            <div className="px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted">
              Active: <span className="text-text">{activeLabel}</span>
            </div>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange?.(option.id);
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                  option.id === activeId ? 'bg-panel2 text-text' : 'text-muted'
                }`}
              >
                {option.name}
              </button>
            ))}
            {onCreateProfile && (
              <button
                type="button"
                onClick={() => {
                  onCreateProfile();
                  setOpen(false);
                }}
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
              >
                + Profile
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type OverflowMenuProps = {
  onLockNow: () => void;
  onOpenSettings: () => void;
  onThemeToggle: () => void;
  onInstall?: () => void;
  showProfileItems: boolean;
  allowCreateProfile: boolean;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
};

const OverflowMenu = ({
  onLockNow,
  onOpenSettings,
  onThemeToggle,
  onInstall,
  showProfileItems,
  allowCreateProfile,
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateProfile
}: OverflowMenuProps) => {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} px-3 text-muted hover:text-text`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ⋯
        <span className="sr-only">Open overflow menu</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-40 mt-2 w-52 rounded-2xl border border-grid bg-panel p-2 shadow-2xl"
          >
            {showProfileItems && (
              <div className="mb-2 border-b border-grid pb-2">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onProfileChange(profile.id);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                      profile.id === activeProfileId ? 'bg-panel2 text-text' : 'text-muted'
                    }`}
                  >
                    {profile.name}
                  </button>
                ))}
                {allowCreateProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateProfile();
                      setOpen(false);
                    }}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
                  >
                    + Profile
                  </button>
                )}
              </div>
            )}
            {onInstall && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onInstall();
                  setOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-accent transition hover:text-text"
              >
                Install
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onThemeToggle();
                setOpen(false);
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
            >
              Theme toggle
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLockNow();
                setOpen(false);
              }}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
            >
              Lock now
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenSettings();
                setOpen(false);
              }}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
            >
              Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  profileSwitchAllowed?: boolean;
  showCreateProfile?: boolean;
  onOpenSettings: () => void;
  onLockNow: () => void;
  onInstall?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
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
  profileSwitchAllowed = true,
  showCreateProfile = true,
  onOpenSettings,
  onLockNow,
  onInstall,
  theme,
  onThemeChange,
  onOpenNav
}: TopBarProps) => {
  const reduceMotion = useReducedMotion();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const pillMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 }
      };

  useEffect(() => {
    if (!searchOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [searchOpen]);

  const activeProfileLabel = profiles.find((profile) => profile.id === activeProfileId)?.name ?? 'Profile';
  const allowProfileSwitch = profileSwitchAllowed && profiles.length > 0;
  const allowCreateProfile = showCreateProfile && allowProfileSwitch;
  const handleThemeToggle = () => onThemeChange(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="w-full text-sm">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <div className="py-3">
          <div className="hidden lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {onOpenNav && (
                <motion.button
                  type="button"
                  onClick={onOpenNav}
                  className={`${pillBase} flex-none px-3 text-muted hover:text-text lg:hidden`}
                  aria-label="Open navigation"
                  {...pillMotion}
                >
                  <HamburgerIcon />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={onHome}
                className="flex h-9 flex-none items-center gap-2 rounded-full border border-grid bg-panel px-3 text-text transition hover:border-accent/60"
                aria-label="Go to calendar"
                {...pillMotion}
              >
                <span className="h-6 w-6">
                  <img
                    src={mark2x}
                    srcSet={`${mark1x} 1x, ${mark2x} 2x`}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full rounded-lg"
                    draggable={false}
                  />
                </span>
                <span className="brand-glitch text-[0.7rem] font-medium leading-none tracking-[0.2em]">NullCal</span>
              </motion.button>
              {onToday && (
                <motion.button
                  onClick={onToday}
                  className={`${pillBase} px-3 text-muted hover:text-text`}
                  {...pillMotion}
                >
                  Today
                </motion.button>
              )}
              {view && onViewChange && (
                <Segmented
                  ariaLabel="Calendar view"
                  items={[
                    {
                      key: 'week',
                      label: 'Week',
                      onClick: () => onViewChange('timeGridWeek'),
                      active: view === 'timeGridWeek'
                    },
                    {
                      key: 'month',
                      label: 'Month',
                      onClick: () => onViewChange('dayGridMonth'),
                      active: view === 'dayGridMonth'
                    }
                  ]}
                />
              )}
              {onPrev && onNext && (
                <Segmented
                  ariaLabel="Navigate calendar"
                  items={[
                    {
                      key: 'prev',
                      label: 'Previous',
                      onClick: onPrev,
                      icon: <ChevronIcon direction="left" />
                    },
                    {
                      key: 'next',
                      label: 'Next',
                      onClick: onNext,
                      icon: <ChevronIcon direction="right" />
                    }
                  ]}
                />
              )}
            </div>

            <div className="flex items-center justify-center">
              {onSearchChange && (
                <div className="w-full max-w-[280px]" ref={searchRef}>
                  <motion.div
                    className={`${pillBase} w-full min-w-0 justify-start gap-2 px-3 text-muted hover:text-text`}
                    {...pillMotion}
                  >
                    <span className="flex-none text-muted">
                      <SearchIcon />
                    </span>
                    <input
                      value={search ?? ''}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="Search events"
                      className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-muted placeholder:text-muted/70 focus:outline-none"
                    />
                  </motion.div>
                </div>
              )}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-3">
              <div className="flex items-center gap-1">
                {allowProfileSwitch ? (
                  <AgentDropdown
                    options={profiles}
                    activeId={activeProfileId}
                    onChange={onProfileChange}
                    className="min-w-[140px]"
                  />
                ) : (
                  <div className={`${pillBase} px-3 text-muted`}>{activeProfileLabel}</div>
                )}
                {allowCreateProfile && (
                  <motion.button
                    onClick={onCreateProfile}
                    className={`${pillBase} px-4 text-muted hover:text-text`}
                    {...pillMotion}
                  >
                    + Profile
                  </motion.button>
                )}
              </div>
              {onInstall && (
                <motion.button
                  onClick={onInstall}
                  className={`${pillBase} px-4 border-accent/40 text-accent hover:border-accent hover:text-text`}
                  {...pillMotion}
                >
                  Install
                </motion.button>
              )}
              <motion.button
                onClick={onLockNow}
                className={`${pillBase} px-4 text-muted hover:text-text`}
                {...pillMotion}
              >
                Lock now
              </motion.button>
              <motion.button
                type="button"
                onClick={onOpenSettings}
                className={`${pillBase} px-3 text-muted hover:text-text`}
                aria-label="Settings"
                {...pillMotion}
              >
                <SettingsIcon />
              </motion.button>
              <ThemeToggle
                value={theme}
                onChange={onThemeChange}
                className={`${pillBase} px-4 text-muted hover:text-text glow-pulse`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <div className="flex flex-wrap items-center gap-2">
              {onOpenNav && (
                <motion.button
                  type="button"
                  onClick={onOpenNav}
                  className={`${pillBase} flex-none px-3 text-muted hover:text-text`}
                  aria-label="Open navigation"
                  {...pillMotion}
                >
                  <HamburgerIcon />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={onHome}
                className="flex h-9 flex-none items-center gap-2 rounded-full border border-grid bg-panel px-3 text-text transition hover:border-accent/60"
                aria-label="Go to calendar"
                {...pillMotion}
              >
                <span className="h-6 w-6">
                  <img
                    src={mark2x}
                    srcSet={`${mark1x} 1x, ${mark2x} 2x`}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full rounded-lg"
                    draggable={false}
                  />
                </span>
                <span className="brand-glitch text-[0.7rem] font-medium leading-none tracking-[0.2em]">NullCal</span>
              </motion.button>
              {onToday && (
                <motion.button
                  onClick={onToday}
                  className={`${pillBase} px-3 text-muted hover:text-text`}
                  {...pillMotion}
                >
                  Today
                </motion.button>
              )}
              {view && onViewChange && (
                <Segmented
                  ariaLabel="Calendar view"
                  items={[
                    {
                      key: 'week',
                      label: 'Week',
                      onClick: () => onViewChange('timeGridWeek'),
                      active: view === 'timeGridWeek'
                    },
                    {
                      key: 'month',
                      label: 'Month',
                      onClick: () => onViewChange('dayGridMonth'),
                      active: view === 'dayGridMonth'
                    }
                  ]}
                />
              )}
              {onPrev && onNext && (
                <Segmented
                  ariaLabel="Navigate calendar"
                  items={[
                    {
                      key: 'prev',
                      label: 'Previous',
                      onClick: onPrev,
                      icon: <ChevronIcon direction="left" />
                    },
                    {
                      key: 'next',
                      label: 'Next',
                      onClick: onNext,
                      icon: <ChevronIcon direction="right" />
                    }
                  ]}
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              {onSearchChange && (
                <div className="relative" ref={searchRef}>
                  <motion.button
                    type="button"
                    onClick={() => setSearchOpen((open) => !open)}
                    className={`${pillBase} px-3 text-muted hover:text-text`}
                    aria-haspopup="dialog"
                    aria-expanded={searchOpen}
                    {...pillMotion}
                  >
                    <SearchIcon />
                    <span className="sr-only">Search events</span>
                  </motion.button>
                  <AnimatePresence>
                    {searchOpen && (
                      <motion.div
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[80vw]"
                      >
                        <div className={`${pillBase} w-full justify-start gap-2 px-3 text-muted hover:text-text`}>
                          <span className="flex-none text-muted">
                            <SearchIcon />
                          </span>
                          <input
                            value={search ?? ''}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Search events"
                            className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-muted placeholder:text-muted/70 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <ProfileMenu
                options={profiles}
                activeId={activeProfileId}
                onChange={allowProfileSwitch ? onProfileChange : undefined}
                onCreateProfile={allowCreateProfile ? onCreateProfile : undefined}
                disabled={!allowProfileSwitch}
              />
              <OverflowMenu
                onLockNow={onLockNow}
                onOpenSettings={onOpenSettings}
                onThemeToggle={handleThemeToggle}
                onInstall={onInstall}
                showProfileItems={allowProfileSwitch}
                allowCreateProfile={allowCreateProfile}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onProfileChange={onProfileChange}
                onCreateProfile={onCreateProfile}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pb-2">
          <div className="text-xs">
            <Clock />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
