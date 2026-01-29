import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Clock from '../components/Clock';
import Segmented from '../components/Segmented';
import type { ThemeMode } from '../theme/ThemeProvider';
import HotkeysModal from './HotkeysModal';
import Modal from '../components/Modal';
import ThemePicker from '../components/ThemePicker';
import { THEME_PACKS } from '../theme/themePacks';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;
const pillBase =
  'pill-base h-9 rounded-full border border-grid bg-panel px-4 text-[11px] tracking-[0.18em] uppercase inline-flex items-center justify-center whitespace-nowrap transition hover:bg-panel2';

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
      <div className={`${pillBase} min-w-0 px-3 text-muted`}>
        <span className="truncate">Profile: {activeLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative min-w-0" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} min-w-0 gap-2 px-3 text-muted hover:text-text`}
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

type OverflowAction = {
  key: string;
  label: string;
  onClick: () => void;
  tone?: 'accent';
};

type OverflowMenuProps = {
  actions: OverflowAction[];
  showProfileList: boolean;
  showCreateProfileItem: boolean;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
};

const OverflowMenu = ({
  actions,
  showProfileList,
  showCreateProfileItem,
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
            {(showProfileList || showCreateProfileItem) && (
              <div className="mb-2 border-b border-grid pb-2">
                {showProfileList &&
                  profiles.map((profile) => (
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
                {showCreateProfileItem && (
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
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                  action.tone === 'accent' ? 'text-accent' : 'text-muted'
                }`}
              >
                {action.label}
              </button>
            ))}
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
  onOpenNav?: () => void;
  palette: string;
  onPaletteChange: (paletteId: string, themeMode: ThemeMode) => void;
  onCommandAdd?: () => void;
  onCommandDecoy?: () => void;
  onCommandExport?: (mode: 'clean' | 'full') => void;
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
  onOpenNav,
  palette,
  onPaletteChange,
  onCommandAdd,
  onCommandDecoy,
  onCommandExport
}: TopBarProps) => {
  const reduceMotion = useReducedMotion();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const pillMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 }
      };

  const focusInput = useCallback(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const input = isDesktop ? desktopSearchInputRef.current : mobileSearchInputRef.current;
    input?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditable && !(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        setHotkeysOpen(true);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 'k') {
          event.preventDefault();
          focusInput();
          return;
        }
        if (key === 'n') {
          if (!onCommandAdd) {
            return;
          }
          event.preventDefault();
          onCommandAdd();
          return;
        }
        if (key === 'l') {
          event.preventDefault();
          onLockNow();
          return;
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 'd') {
          if (!onCommandDecoy) {
            return;
          }
          event.preventDefault();
          onCommandDecoy();
          return;
        }
        if (key === 'e') {
          if (!onCommandExport) {
            return;
          }
          event.preventDefault();
          onCommandExport('clean');
          return;
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft') {
        if (!onPrev) {
          return;
        }
        event.preventDefault();
        onPrev();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowRight') {
        if (!onNext) {
          return;
        }
        event.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusInput, onCommandAdd, onCommandDecoy, onCommandExport, onLockNow, onPrev, onNext]);

  const allowProfileSwitch = profileSwitchAllowed && profiles.length > 0;
  const allowCreateProfile = showCreateProfile && allowProfileSwitch;
  const themeOptions = THEME_PACKS;
  const activeTheme = useMemo(
    () => themeOptions.find((pack) => pack.id === palette) ?? themeOptions[0],
    [palette, themeOptions]
  );
  const desktopOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (allowCreateProfile) {
      actions.push({ key: 'profile', label: '+ Profile', onClick: onCreateProfile });
    }
    actions.push({ key: 'lock', label: 'Lock now', onClick: onLockNow, tone: 'accent' });
    actions.push({ key: 'settings', label: 'Settings', onClick: onOpenSettings });
    actions.push({ key: 'theme', label: 'Theme', onClick: () => setThemeOpen(true) });
    actions.push({ key: 'hotkeys', label: 'Hotkeys', onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [allowCreateProfile, onCreateProfile, onLockNow, onOpenSettings]);
  const mobileOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (allowCreateProfile) {
      actions.push({ key: 'profile', label: '+ Profile', onClick: onCreateProfile });
    }
    actions.push({ key: 'lock', label: 'Lock now', onClick: onLockNow, tone: 'accent' });
    actions.push({ key: 'settings', label: 'Settings', onClick: onOpenSettings });
    actions.push({ key: 'theme', label: 'Theme', onClick: () => setThemeOpen(true) });
    actions.push({ key: 'hotkeys', label: 'Hotkeys', onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [allowCreateProfile, onCreateProfile, onLockNow, onOpenSettings]);
  const showDesktopOverflow = allowProfileSwitch || desktopOverflowActions.length > 0;

  const renderSearchInput = (inputRef: React.RefObject<HTMLInputElement>) => (
    <motion.div className={`${pillBase} w-full min-w-0 justify-start gap-2 px-3 text-muted hover:text-text`} {...pillMotion}>
      <span className="flex-none text-muted">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        value={search ?? ''}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder="Search events"
        readOnly={!onSearchChange}
        aria-disabled={!onSearchChange}
        className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-text placeholder:text-muted focus:outline-none"
      />
    </motion.div>
  );

  return (
    <header className="topbar relative w-full text-sm">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <div className="py-2">
          <div className="hidden min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_auto] items-center gap-x-4 gap-y-2 lg:grid">
            <div className="col-start-1 row-start-1 flex min-w-0 items-center">
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
            </div>

            <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-center gap-3">
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
                      label: (
                        <>
                          <span className="hidden xl:inline">Week</span>
                          <span className="xl:hidden">Wk</span>
                        </>
                      ),
                      onClick: () => onViewChange('timeGridWeek'),
                      active: view === 'timeGridWeek'
                    },
                    {
                      key: 'month',
                      label: (
                        <>
                          <span className="hidden xl:inline">Month</span>
                          <span className="xl:hidden">Mo</span>
                        </>
                      ),
                      onClick: () => onViewChange('dayGridMonth'),
                      active: view === 'dayGridMonth'
                    }
                  ]}
                />
              )}
            </div>

            <div className="col-start-3 row-start-1 flex min-w-0 items-center justify-end gap-3">
              <div className="min-w-0 max-w-[420px] flex-1">
                <div className="w-[clamp(200px,32vw,420px)]">{renderSearchInput(desktopSearchInputRef)}</div>
              </div>
              {showDesktopOverflow && (
                <OverflowMenu
                  actions={desktopOverflowActions}
                  showProfileList={allowProfileSwitch}
                  showCreateProfileItem={allowCreateProfile}
                  profiles={profiles}
                  activeProfileId={activeProfileId}
                  onProfileChange={onProfileChange}
                  onCreateProfile={onCreateProfile}
                />
              )}
            </div>

            <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-center">
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

            <div className="col-start-3 row-start-2 flex min-w-0 items-center justify-end text-xs">
              <Clock />
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
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <ProfileMenu
                options={profiles}
                activeId={activeProfileId}
                onChange={allowProfileSwitch ? onProfileChange : undefined}
                disabled={!allowProfileSwitch}
              />
              <OverflowMenu
                actions={mobileOverflowActions}
                showProfileList={false}
                showCreateProfileItem={false}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onProfileChange={onProfileChange}
                onCreateProfile={onCreateProfile}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 lg:hidden">
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
            <motion.button
              onClick={onLockNow}
              className={`${pillBase} flex-none px-4 text-muted hover:text-text`}
              {...pillMotion}
            >
              Lock now
            </motion.button>
            <div className="w-full min-w-0">
              {renderSearchInput(mobileSearchInputRef)}
            </div>
          </div>
        </div>
      </div>
      <HotkeysModal open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
      <Modal title="Theme Packs" open={themeOpen} onClose={() => setThemeOpen(false)}>
        <div className="space-y-3 text-sm text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-muted">Current</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-text">{activeTheme.name}</span>
          </div>
          <p className="text-xs text-muted">Select a theme pack to restyle the entire interface.</p>
          <ThemePicker
            themes={themeOptions}
            activeId={palette}
            onSelect={(nextId) => {
              const next = themeOptions.find((pack) => pack.id === nextId);
              if (!next) {
                return;
              }
              onPaletteChange(next.id, next.mode);
              setThemeOpen(false);
            }}
          />
        </div>
      </Modal>
    </header>
  );
};

export default TopBar;

// Layout notes: desktop uses a 3-zone grid (left/center/right) with stacked view + nav controls.
