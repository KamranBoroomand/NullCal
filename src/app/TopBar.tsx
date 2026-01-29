import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Clock from '../components/Clock';
import Segmented from '../components/Segmented';
import ThemeToggle from '../components/ThemeToggle';
import type { ThemeMode } from '../theme/ThemeProvider';
import HotkeysModal from './HotkeysModal';
import { useToast } from '../components/ToastProvider';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;
const pillBase =
  'pill-base h-9 rounded-full border border-grid bg-panel px-4 text-[11px] tracking-[0.18em] uppercase inline-flex items-center justify-center whitespace-nowrap transition hover:bg-panel2';

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path
      d="M9.999 6.1a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Zm8.1 3.9a7.9 7.9 0 0 0-.08-1.12l1.87-1.45-1.88-3.26-2.27.88a7.9 7.9 0 0 0-1.94-1.12l-.35-2.4H7.59l-.35 2.4a7.9 7.9 0 0 0-1.94 1.12l-2.27-.88-1.88 3.26 1.87 1.45a8.35 8.35 0 0 0 0 2.24L1.15 12.7l1.88 3.26 2.27-.88c.6.46 1.25.84 1.94 1.12l.35 2.4h4.77l.35-2.4a7.9 7.9 0 0 0 1.94-1.12l2.27.88 1.88-3.26-1.87-1.46c.05-.37.08-.74.08-1.12Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 2.5 16 4.8v5.2c0 4.2-2.9 7.3-6 7.5-3.1-.2-6-3.3-6-7.5V4.8L10 2.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
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
    <div className={`relative min-w-0 ${className ?? ''}`} ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} w-full min-w-0 gap-2 px-4 text-muted hover:text-text`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex w-full min-w-0 items-center justify-between gap-3">
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
  onInstall?: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  secureMode: boolean;
  onToggleSecureMode: () => void;
  onOpenNav?: () => void;
  commandStripMode?: boolean;
  locked?: boolean;
  onCommandAdd?: () => void;
  onCommandPrivacy?: () => void;
  onCommandDecoy?: () => void;
  onCommandExport?: (mode: 'clean' | 'full') => void;
};

type HiddenAction = 'agent' | 'lock' | 'settings' | 'theme' | 'secure';

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
  secureMode,
  onToggleSecureMode,
  onOpenNav,
  commandStripMode = false,
  locked = false,
  onCommandAdd,
  onCommandPrivacy,
  onCommandDecoy,
  onCommandExport
}: TopBarProps) => {
  const reduceMotion = useReducedMotion();
  const { notify } = useToast();
  const [hiddenActions, setHiddenActions] = useState<HiddenAction[]>([]);
  const [altHeld, setAltHeld] = useState(false);
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const [commandValue, setCommandValue] = useState(search ?? '');
  const desktopGridRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const desktopCommandInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCommandInputRef = useRef<HTMLInputElement | null>(null);
  const pillMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 }
      };

  const handleThemeToggle = useCallback(
    () => onThemeChange(theme === 'dark' ? 'light' : 'dark'),
    [onThemeChange, theme]
  );

  const focusInput = useCallback(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const input = commandStripMode
      ? isDesktop
        ? desktopCommandInputRef.current
        : mobileCommandInputRef.current
      : isDesktop
        ? desktopSearchInputRef.current
        : mobileSearchInputRef.current;
    input?.focus();
  }, [commandStripMode]);

  useEffect(() => {
    if (!commandStripMode) {
      setAltHeld(false);
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setAltHeld(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setAltHeld(false);
      }
    };
    const handleBlur = () => setAltHeld(false);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [commandStripMode]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      if (event.key === '?') {
        event.preventDefault();
        setHotkeysOpen(true);
        return;
      }
      if (
        event.key === '/' &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        if (!onSearchChange && !commandStripMode) {
          return;
        }
        event.preventDefault();
        requestAnimationFrame(() => {
          focusInput();
        });
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === 's') {
          event.preventDefault();
          onToggleSecureMode();
        }
        if (key === 't') {
          event.preventDefault();
          handleThemeToggle();
        }
        if (key === 'k') {
          event.preventDefault();
          onLockNow();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandStripMode, focusInput, handleThemeToggle, onLockNow, onSearchChange, onToggleSecureMode]);

  useEffect(() => {
    if (!commandStripMode) {
      return;
    }
    if (!commandValue.startsWith('/')) {
      setCommandValue(search ?? '');
    }
  }, [commandStripMode, commandValue, search]);

  useEffect(() => {
    const element = desktopGridRef.current;
    if (!element) {
      return;
    }
    const update = () => {
      const width = element.getBoundingClientRect().width;
      const nextHidden: HiddenAction[] = [];
      if (width < 1340) {
        nextHidden.push('agent');
      }
      if (width < 1260) {
        nextHidden.push('lock');
      }
      if (width < 1180) {
        nextHidden.push('settings');
      }
      if (width < 1120) {
        nextHidden.push('theme');
      }
      if (width < 1060) {
        nextHidden.push('secure');
      }
      setHiddenActions((prev) => {
        if (prev.length === nextHidden.length && prev.every((item, index) => item === nextHidden[index])) {
          return prev;
        }
        return nextHidden;
      });
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleCommand = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed.startsWith('/')) {
        return false;
      }
      const [command, ...rest] = trimmed.slice(1).split(' ');
      const arg = rest.join(' ').trim().toLowerCase();
      switch (command.toLowerCase()) {
        case 'add':
          if (!onCommandAdd) {
            notify('Add command is not available here.', 'error');
            return true;
          }
          onCommandAdd();
          return true;
        case 'lock':
          onLockNow();
          return true;
        case 'privacy':
          if (!onCommandPrivacy) {
            notify('Privacy screen toggle is unavailable.', 'error');
            return true;
          }
          onCommandPrivacy();
          return true;
        case 'decoy':
          if (!onCommandDecoy) {
            notify('Decoy profile action is unavailable.', 'error');
            return true;
          }
          onCommandDecoy();
          return true;
        case 'export':
          if (!onCommandExport) {
            notify('Export commands are unavailable.', 'error');
            return true;
          }
          if (arg !== 'clean' && arg !== 'full') {
            notify('Use /export clean or /export full.', 'error');
            return true;
          }
          onCommandExport(arg);
          return true;
        default:
          notify('Unknown command. Try /add, /lock, /privacy, /decoy, /export clean, /export full.', 'error');
          return true;
      }
    },
    [notify, onCommandAdd, onCommandDecoy, onCommandExport, onCommandPrivacy, onLockNow]
  );

  const handleCommandSubmit = useCallback(() => {
    if (!commandValue.trim()) {
      return;
    }
    if (handleCommand(commandValue)) {
      setCommandValue('');
      onSearchChange?.('');
    }
  }, [commandValue, handleCommand, onSearchChange]);

  const activeProfileLabel = profiles.find((profile) => profile.id === activeProfileId)?.name ?? 'Profile';
  const allowProfileSwitch = profileSwitchAllowed && profiles.length > 0;
  const allowCreateProfile = showCreateProfile && allowProfileSwitch;
  const hiddenSet = useMemo(() => new Set(hiddenActions), [hiddenActions]);
  const isActionHidden = (key: HiddenAction) => hiddenSet.has(key);
  const showOverflowProfileList = allowProfileSwitch && isActionHidden('agent');
  const showOverflowCreateProfile = allowCreateProfile && isActionHidden('agent');
  const desktopOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (isActionHidden('lock')) {
      actions.push({ key: 'lock', label: 'Lock now', onClick: onLockNow });
    }
    if (isActionHidden('settings')) {
      actions.push({ key: 'settings', label: 'Settings', onClick: onOpenSettings });
    }
    if (isActionHidden('theme')) {
      actions.push({ key: 'theme', label: 'Theme toggle', onClick: handleThemeToggle });
    }
    if (isActionHidden('secure')) {
      actions.push({
        key: 'secure',
        label: secureMode ? 'Secure mode on' : 'Secure mode off',
        onClick: onToggleSecureMode
      });
    }
    actions.push({ key: 'hotkeys', label: 'Hotkeys', onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [handleThemeToggle, isActionHidden, onLockNow, onOpenSettings, onToggleSecureMode, secureMode]);
  const mobileOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (onInstall) {
      actions.push({ key: 'install', label: 'Install', onClick: onInstall, tone: 'accent' });
    }
    actions.push({ key: 'settings', label: 'Settings', onClick: onOpenSettings });
    actions.push({ key: 'theme', label: 'Theme toggle', onClick: handleThemeToggle });
    actions.push({
      key: 'secure',
      label: secureMode ? 'Secure mode on' : 'Secure mode off',
      onClick: onToggleSecureMode
    });
    actions.push({ key: 'lock', label: 'Lock now', onClick: onLockNow });
    actions.push({ key: 'hotkeys', label: 'Hotkeys', onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [handleThemeToggle, onInstall, onLockNow, onOpenSettings, onToggleSecureMode, secureMode]);
  const showDesktopOverflow =
    desktopOverflowActions.length > 0 || showOverflowProfileList || showOverflowCreateProfile;

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
        className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-text placeholder:text-muted focus:outline-none"
      />
    </motion.div>
  );

  const renderCommandInput = (inputRef: React.RefObject<HTMLInputElement>) => (
    <motion.div className={`${pillBase} w-full min-w-0 justify-start gap-2 px-3 text-muted hover:text-text`} {...pillMotion}>
      <span className="flex-none text-muted">›</span>
      <input
        ref={inputRef}
        value={commandValue}
        onChange={(event) => {
          const next = event.target.value;
          setCommandValue(next);
          if (!next.trim().startsWith('/')) {
            onSearchChange?.(next);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleCommandSubmit();
          }
        }}
        placeholder="/add, /lock, /privacy, /decoy, /export clean"
        className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-text placeholder:text-muted focus:outline-none"
      />
    </motion.div>
  );

  return (
    <header className="topbar relative w-full text-sm">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
        <div className="py-2">
          <div
            ref={desktopGridRef}
            className="hidden items-center gap-4 lg:grid"
            style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)' }}
          >
            <div className="min-w-0">
              <div className="grid min-w-0 grid-cols-[auto_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
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
                    <span className="brand-glitch text-[0.7rem] font-medium leading-none tracking-[0.2em]">
                      NullCal
                    </span>
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

                <div className="flex min-w-0 justify-center">
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

                <div className="col-start-2 row-start-2 flex justify-center">
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
              </div>
            </div>

            <div className="flex min-w-0 items-center justify-center">
              {commandStripMode
                ? renderCommandInput(desktopCommandInputRef)
                : onSearchChange && (
                    <div className="w-full min-w-0" style={{ width: 'min(520px, 100%)', minWidth: '240px' }}>
                      {renderSearchInput(desktopSearchInputRef)}
                    </div>
                  )}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-2">
              {allowProfileSwitch ? (
                !isActionHidden('agent') && (
                  <div className="flex min-w-0 items-center gap-2">
                    <AgentDropdown
                      options={profiles}
                      activeId={activeProfileId}
                      onChange={onProfileChange}
                      className="min-w-0 w-[clamp(140px,16vw,200px)]"
                    />
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
                )
              ) : (
                <div className={`${pillBase} px-3 text-muted`}>{activeProfileLabel}</div>
              )}
              {onInstall && (
                <motion.button
                  onClick={onInstall}
                  className={`${pillBase} px-4 border-accent/40 text-accent hover:border-accent hover:text-text`}
                  {...pillMotion}
                >
                  Install
                </motion.button>
              )}
              {!isActionHidden('secure') && (
                <motion.button
                  onClick={onToggleSecureMode}
                  className={`${pillBase} gap-2 px-4 ${
                    secureMode ? 'border-accent/60 text-accent' : 'text-muted hover:text-text'
                  }`}
                  {...pillMotion}
                >
                  <ShieldIcon />
                  Secure
                </motion.button>
              )}
              {!isActionHidden('lock') && (
                <motion.button
                  onClick={onLockNow}
                  className={`${pillBase} gap-2 px-4 text-muted hover:text-text`}
                  {...pillMotion}
                >
                  {commandStripMode && (
                    <span
                      className={`cmdstrip-led ${locked ? 'cmdstrip-led--locked' : 'cmdstrip-led--unlocked'}`}
                      aria-hidden="true"
                    />
                  )}
                  Lock now
                </motion.button>
              )}
              {!isActionHidden('settings') && (
                <motion.button
                  type="button"
                  onClick={onOpenSettings}
                  className={`${pillBase} px-3 text-muted hover:text-text`}
                  aria-label="Settings"
                  {...pillMotion}
                >
                  <SettingsIcon />
                </motion.button>
              )}
              {!isActionHidden('theme') && (
                <ThemeToggle
                  value={theme}
                  onChange={onThemeChange}
                  className={`${pillBase} px-4 text-muted hover:text-text glow-pulse`}
                />
              )}
              {showDesktopOverflow && (
                <OverflowMenu
                  actions={desktopOverflowActions}
                  showProfileList={showOverflowProfileList}
                  showCreateProfileItem={showOverflowCreateProfile}
                  profiles={profiles}
                  activeProfileId={activeProfileId}
                  onProfileChange={onProfileChange}
                  onCreateProfile={onCreateProfile}
                />
              )}
              <div className="text-xs">
                <Clock />
              </div>
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
                onCreateProfile={allowCreateProfile ? onCreateProfile : undefined}
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
            {(commandStripMode || onSearchChange) && (
              <div className="w-full min-w-0">
                {commandStripMode
                  ? renderCommandInput(mobileCommandInputRef)
                  : onSearchChange && renderSearchInput(mobileSearchInputRef)}
              </div>
            )}
          </div>
        </div>
      </div>
      {commandStripMode && altHeld && (
        <div className="cmdstrip-hotkeys" role="status" aria-live="polite">
          <div className="cmdstrip-hotkeys-title">Command Strip Hotkeys</div>
          <div className="cmdstrip-hotkeys-grid">
            <span className="cmdstrip-hotkeys-item">
              <kbd>/</kbd> Search
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>N</kbd> New event
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>L</kbd> Lock
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>P</kbd> Privacy
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>D</kbd> Decoy
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>T</kbd> Theme
            </span>
            <span className="cmdstrip-hotkeys-item">
              <kbd>S</kbd> Settings
            </span>
          </div>
        </div>
      )}
      <HotkeysModal open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
    </header>
  );
};

export default TopBar;

// Layout notes: desktop uses a 3-zone grid (left/center/right) with stacked view + nav controls.
