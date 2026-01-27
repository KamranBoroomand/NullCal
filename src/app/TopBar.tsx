import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import IconButton from '../components/IconButton';
import Clock from '../components/Clock';
import ThemeToggle from '../components/ThemeToggle';
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
        whileHover={reduceMotion ? undefined : { y: -2, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.16)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="h-10 min-w-[140px] rounded-full border border-white/10 bg-panel px-4 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span className="truncate text-center">{activeLabel}</span>
          <span className="text-[10px]">▾</span>
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
  onOpenNav
}: TopBarProps) => {
  const reduceMotion = useReducedMotion();
  const pillBase =
    'h-10 px-4 rounded-full border border-white/10 bg-panel text-sm leading-none inline-flex items-center justify-center gap-2 whitespace-nowrap transition hover:text-text';
  const pillMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -2, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.16)' },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 }
      };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 text-sm sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {onOpenNav && (
              <motion.button
                type="button"
                onClick={onOpenNav}
                className="flex-none rounded-full border border-grid bg-panel px-3 py-2 text-muted transition hover:text-text md:hidden"
                aria-label="Open navigation"
                {...pillMotion}
              >
                <HamburgerIcon />
              </motion.button>
            )}
            <motion.button
              type="button"
              onClick={onHome}
              className="flex flex-none flex-col items-center gap-1 rounded-2xl border border-grid bg-panel px-3 py-2 text-text transition hover:border-accent/60"
              aria-label="Go to calendar"
              {...pillMotion}
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
              <span className="brand-glitch text-[0.7rem] font-medium leading-none tracking-[0.2em]">
                NullCal
              </span>
              <span className="h-0.5 w-6 rounded-full bg-accent/80" />
            </motion.button>
            {onToday && (
              <motion.button
                onClick={onToday}
                className={`${pillBase} uppercase tracking-[0.2em] text-muted`}
                {...pillMotion}
              >
                Today
              </motion.button>
            )}
            {view && onViewChange && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => onViewChange('timeGridWeek')}
                    className={`${pillBase} uppercase tracking-[0.2em] transition ${
                      view === 'timeGridWeek' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
                    }`}
                    {...pillMotion}
                  >
                    Week
                  </motion.button>
                  <motion.button
                    onClick={() => onViewChange('dayGridMonth')}
                    className={`${pillBase} uppercase tracking-[0.2em] transition ${
                      view === 'dayGridMonth' ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted'
                    }`}
                    {...pillMotion}
                  >
                    Month
                  </motion.button>
                </div>
                {onPrev && onNext && (
                  <div className="flex items-center gap-2">
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

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {onSearchChange && (
              <div className="min-w-[180px] max-w-[240px] flex-1">
                <motion.div className={`${pillBase} w-full min-w-0 overflow-hidden text-muted`} {...pillMotion}>
                  <span className="flex-none text-muted">
                    <SearchIcon />
                  </span>
                  <input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search events"
                    className="w-full min-w-0 bg-transparent text-sm leading-none text-muted placeholder:text-muted/70 focus:outline-none"
                  />
                </motion.div>
              </div>
            )}
            <AgentDropdown options={profiles} activeId={activeProfileId} onChange={onProfileChange} />
            <motion.button
              onClick={onCreateProfile}
              className={`${pillBase} text-xs uppercase tracking-[0.2em] text-muted`}
              {...pillMotion}
            >
              + Profile
            </motion.button>
            {onInstall && (
              <motion.button
                onClick={onInstall}
                className="flex-none whitespace-nowrap rounded-full border border-accent/40 bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent transition hover:border-accent hover:text-text"
                {...pillMotion}
              >
                Install
              </motion.button>
            )}
            <motion.button
              onClick={onLockNow}
              className={`${pillBase} uppercase tracking-[0.2em] text-muted`}
              {...pillMotion}
            >
              Lock now
            </motion.button>
            <motion.button
              type="button"
              onClick={onOpenSettings}
              className={`${pillBase} px-3 text-muted`}
              aria-label="Settings"
              {...pillMotion}
            >
              <SettingsIcon />
            </motion.button>
            <div className="ml-auto">
              <ThemeToggle value={theme} onChange={onThemeChange} className="h-10" />
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-end text-right">
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
