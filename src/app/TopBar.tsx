import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Clock from '../components/Clock';
import Segmented from '../components/Segmented';
import HotkeysModal from './HotkeysModal';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import type { Language } from '../i18n/translations';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;
const pillBase =
  'pill-base h-9 rounded-full border border-grid bg-panel px-4 text-[11px] tracking-[0.18em] uppercase inline-flex items-center justify-center whitespace-nowrap transition hover:bg-panel2';
const iconButtonBase =
  'flex h-9 w-9 items-center justify-center rounded-full border border-grid bg-panel text-muted transition hover:border-accent/60 hover:text-text';

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

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 3.2c2.2 0 4 1.8 4 4v2.2l1.4 2.6H4.6L6 9.4V7.2c0-2.2 1.8-4 4-4Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M8.2 15c.4 1 1.3 1.6 1.8 1.6s1.4-.6 1.8-1.6" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 9v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="10" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 3.2 15.2 5v4.4c0 3.6-2.4 6.3-5.2 7.4-2.8-1.1-5.2-3.8-5.2-7.4V5L10 3.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="4.5" y="8" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 8V6.2a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

type TopBarCopy = {
  agent: string;
  activeAgent: string;
  addProfile: string;
  hotkey: string;
  openOverflowMenu: string;
  openNavigation: string;
  goToCalendar: string;
  today: string;
  calendarView: string;
  week: string;
  weekShort: string;
  month: string;
  monthShort: string;
  navigateCalendar: string;
  previous: string;
  next: string;
  searchEvents: string;
  closeSearch: string;
  openSearch: string;
  newEvent: string;
  sync: string;
  syncOffline: string;
  syncIpfs: string;
  syncP2p: string;
  syncLocalOnly: string;
  syncTrustedDevices: string;
  syncManualPairing: string;
  notifications: string;
  helpShortcuts: string;
  lockNow: string;
  securitySecureMode: string;
  securityObfuscated: string;
  securityEncryptedNotes: string;
  securityTwoFactorReady: string;
  securityStandard: string;
  languageLabel: string;
  installApp: string;
};

const topBarCopy: Record<Language, TopBarCopy> = {
  en: {
    agent: 'Agent',
    activeAgent: 'Active agent',
    addProfile: '+ Profile',
    hotkey: 'Hotkey',
    openOverflowMenu: 'Open overflow menu',
    openNavigation: 'Open navigation',
    goToCalendar: 'Go to calendar',
    today: 'Today',
    calendarView: 'Calendar view',
    week: 'Week',
    weekShort: 'Wk',
    month: 'Month',
    monthShort: 'Mo',
    navigateCalendar: 'Navigate calendar',
    previous: 'Previous',
    next: 'Next',
    searchEvents: 'Search events',
    closeSearch: 'Close search',
    openSearch: 'Open search',
    newEvent: 'New event',
    sync: 'SYNC',
    syncOffline: 'Offline',
    syncIpfs: 'IPFS sync',
    syncP2p: 'P2P sync',
    syncLocalOnly: 'Local only',
    syncTrustedDevices: 'Trusted devices',
    syncManualPairing: 'Manual pairing',
    notifications: 'Notifications',
    helpShortcuts: 'Help & shortcuts',
    lockNow: 'Lock now',
    securitySecureMode: 'Secure mode',
    securityObfuscated: 'Obfuscated',
    securityEncryptedNotes: 'Encrypted notes',
    securityTwoFactorReady: '2FA ready',
    securityStandard: 'Standard',
    languageLabel: 'Language',
    installApp: 'Install app'
  },
  ru: {
    agent: 'Агент',
    activeAgent: 'Активный агент',
    addProfile: '+ Профиль',
    hotkey: 'Хоткей',
    openOverflowMenu: 'Открыть меню',
    openNavigation: 'Открыть навигацию',
    goToCalendar: 'Открыть календарь',
    today: 'Сегодня',
    calendarView: 'Вид календаря',
    week: 'Неделя',
    weekShort: 'Нед',
    month: 'Месяц',
    monthShort: 'Мес',
    navigateCalendar: 'Навигация календаря',
    previous: 'Назад',
    next: 'Вперед',
    searchEvents: 'Поиск событий',
    closeSearch: 'Закрыть поиск',
    openSearch: 'Открыть поиск',
    newEvent: 'Новое событие',
    sync: 'СИНХ',
    syncOffline: 'Офлайн',
    syncIpfs: 'Синхр. IPFS',
    syncP2p: 'Синхр. P2P',
    syncLocalOnly: 'Только локально',
    syncTrustedDevices: 'Доверенные устройства',
    syncManualPairing: 'Ручное сопряжение',
    notifications: 'Уведомления',
    helpShortcuts: 'Справка и хоткеи',
    lockNow: 'Заблокировать',
    securitySecureMode: 'Безопасный режим',
    securityObfuscated: 'Обфускация',
    securityEncryptedNotes: 'Зашифрованные заметки',
    securityTwoFactorReady: '2FA готово',
    securityStandard: 'Стандарт',
    languageLabel: 'Язык',
    installApp: 'Установить'
  },
  fa: {
    agent: 'نمایه',
    activeAgent: 'نمایه فعال',
    addProfile: '+ نمایه',
    hotkey: 'میانبر',
    openOverflowMenu: 'باز کردن منو',
    openNavigation: 'باز کردن ناوبری',
    goToCalendar: 'رفتن به تقویم',
    today: 'امروز',
    calendarView: 'نمای تقویم',
    week: 'هفته',
    weekShort: 'هف',
    month: 'ماه',
    monthShort: 'ماه',
    navigateCalendar: 'پیمایش تقویم',
    previous: 'قبلی',
    next: 'بعدی',
    searchEvents: 'جست‌وجوی رویدادها',
    closeSearch: 'بستن جست‌وجو',
    openSearch: 'باز کردن جست‌وجو',
    newEvent: 'رویداد جدید',
    sync: 'همگام',
    syncOffline: 'آفلاین',
    syncIpfs: 'همگام IPFS',
    syncP2p: 'همگام P2P',
    syncLocalOnly: 'فقط محلی',
    syncTrustedDevices: 'دستگاه‌های مورد اعتماد',
    syncManualPairing: 'جفت‌سازی دستی',
    notifications: 'اعلان‌ها',
    helpShortcuts: 'راهنما و میانبرها',
    lockNow: 'قفل فوری',
    securitySecureMode: 'حالت امن',
    securityObfuscated: 'مخفی‌سازی',
    securityEncryptedNotes: 'یادداشت رمزگذاری‌شده',
    securityTwoFactorReady: 'آماده ۲FA',
    securityStandard: 'استاندارد',
    languageLabel: 'زبان',
    installApp: 'نصب برنامه'
  }
};

type ProfileOption = {
  id: string;
  name: string;
  avatarEmoji?: string;
  avatarColor?: string;
  avatarUrl?: string;
};

type ProfileMenuProps = {
  options: ProfileOption[];
  activeId: string;
  label: string;
  activeLabel: string;
  addProfileLabel: string;
  onChange?: (id: string) => void;
  onCreateProfile?: () => void;
  disabled?: boolean;
};

const ProfileMenu = ({
  options,
  activeId,
  label,
  activeLabel,
  addProfileLabel,
  onChange,
  onCreateProfile,
  disabled
}: ProfileMenuProps) => {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const activeProfile = options.find((option) => option.id === activeId);
  const activeProfileLabel = activeProfile?.name ?? label;
  const activeEmoji = activeProfile?.avatarEmoji ?? '🛰️';

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
        <span className="truncate">
          {label}: {activeProfileLabel}
        </span>
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
        <span
          className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs"
          style={{ backgroundColor: activeProfile?.avatarColor ?? 'var(--panel2)' }}
          aria-hidden="true"
        >
          {activeProfile?.avatarUrl ? (
            <img src={activeProfile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            activeEmoji
          )}
        </span>
        {label}
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
              {activeLabel}: <span className="text-text">{activeProfileLabel}</span>
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
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                  option.id === activeId ? 'bg-panel2 text-text' : 'text-muted'
                }`}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs"
                  style={{ backgroundColor: option.avatarColor ?? 'var(--panel2)' }}
                  aria-hidden="true"
                >
                  {option.avatarUrl ? (
                    <img src={option.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    option.avatarEmoji ?? '🛰️'
                  )}
                </span>
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
                {addProfileLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type LanguageMenuProps = {
  language: Language;
  onChange: (language: Language) => void;
  label: string;
  options: Array<{ value: Language; code: string }>;
};

const LanguageMenu = ({ language, onChange, label, options }: LanguageMenuProps) => {
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

  const activeCode = options.find((option) => option.value === language)?.code ?? 'ENG';

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileHover={reduceMotion ? undefined : { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${pillBase} h-8 gap-1 px-2.5 text-[10px] tracking-[0.16em] text-muted hover:text-text`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: ${activeCode}`}
      >
        <span className="text-text">{activeCode}</span>
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
            className="absolute right-0 z-40 mt-2 w-28 rounded-2xl border border-grid bg-panel p-2 shadow-2xl"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-[10px] uppercase tracking-[0.16em] transition hover:text-text ${
                  option.value === language ? 'text-text' : 'text-muted'
                }`}
              >
                {option.code}
              </button>
            ))}
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
  openLabel: string;
  addProfileLabel: string;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
};

const OverflowMenu = ({
  actions,
  showProfileList,
  showCreateProfileItem,
  openLabel,
  addProfileLabel,
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
        <span className="sr-only">{openLabel}</span>
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
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition hover:text-text ${
                        profile.id === activeProfileId ? 'bg-panel2 text-text' : 'text-muted'
                      }`}
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full text-xs"
                        style={{ backgroundColor: profile.avatarColor ?? 'var(--panel2)' }}
                        aria-hidden="true"
                      >
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          profile.avatarEmoji ?? '🛰️'
                        )}
                      </span>
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
                    {addProfileLabel}
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
  showSearch?: boolean;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
  profileSwitchAllowed?: boolean;
  showCreateProfile?: boolean;
  onLockNow: () => void;
  onOpenNav?: () => void;
  onCommandAdd?: () => void;
  onCommandDecoy?: () => void;
  onCommandExport?: (mode: 'clean' | 'full') => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  secureMode: boolean;
  eventObfuscation: boolean;
  encryptedNotes: boolean;
  twoFactorEnabled: boolean;
  syncStrategy: 'offline' | 'ipfs' | 'p2p';
  syncTrustedDevices: boolean;
  notificationsCount?: number;
  variant?: 'full' | 'minimal';
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
  showSearch = true,
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateProfile,
  profileSwitchAllowed = true,
  showCreateProfile = true,
  onLockNow,
  onOpenNav,
  onCommandAdd,
  onCommandDecoy,
  onCommandExport,
  language,
  onLanguageChange,
  secureMode,
  eventObfuscation,
  encryptedNotes,
  twoFactorEnabled,
  syncStrategy,
  syncTrustedDevices,
  notificationsCount = 0,
  variant = 'full'
}: TopBarProps) => {
  const reduceMotion = useReducedMotion();
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  const { canInstall, promptInstall, isIOS } = useInstallPrompt();
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const copy = topBarCopy[language] ?? topBarCopy.en;
  const pillMotion = reduceMotion
    ? {}
    : {
        whileHover: { y: -1, boxShadow: '0 8px 16px rgba(244, 255, 0, 0.14)' },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 }
      };

  const [showSearchInput, setShowSearchInput] = useState(false);
  const languageOptions = [
    { value: 'ru' as const, code: 'RU' },
    { value: 'en' as const, code: 'ENG' },
    { value: 'fa' as const, code: 'PER' }
  ];

  const focusInput = useCallback(() => {
    if (!(showSearch && Boolean(onSearchChange))) {
      return;
    }
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    const input = isDesktop ? desktopSearchInputRef.current : mobileSearchInputRef.current;
    input?.focus();
  }, [showSearch, onSearchChange]);

  const openSearchInput = useCallback(() => {
    if (!(showSearch && Boolean(onSearchChange))) {
      return;
    }
    if (!showSearchInput) {
      setShowSearchInput(true);
    }
    window.requestAnimationFrame(() => {
      focusInput();
    });
  }, [focusInput, onSearchChange, showSearch, showSearchInput]);


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
          openSearchInput();
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
  }, [onCommandAdd, onCommandDecoy, onCommandExport, onLockNow, onPrev, onNext, openSearchInput]);

  useEffect(() => {
    if (search) {
      setShowSearchInput(true);
    }
  }, [search]);

  const allowProfileSwitch = profileSwitchAllowed && profiles.length > 0;
  const allowCreateProfile = showCreateProfile && allowProfileSwitch;
  const showSearchPill = showSearch && (showSearchInput || Boolean(search));
  const showSearchBar = showSearch && Boolean(onSearchChange);
  const showViewControls = Boolean(view && onViewChange);
  const showNavControls = Boolean(onPrev && onNext);
  const newEventClass =
    'flex h-10 items-center justify-center gap-2 rounded-full border border-accent/50 bg-[color-mix(in srgb,var(--accent) 26%, transparent)] px-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accentText)] shadow-[0_12px_26px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-accent hover:bg-[color-mix(in srgb,var(--accent) 34%, transparent)] active:translate-y-px active:shadow-[0_6px_18px_rgba(0,0,0,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60';
  const clockClass = 'flex min-w-[120px] items-center justify-center px-3 py-1 text-xs text-muted';
  const securityLabel = secureMode
    ? copy.securitySecureMode
    : eventObfuscation
      ? copy.securityObfuscated
      : encryptedNotes
        ? copy.securityEncryptedNotes
        : twoFactorEnabled
          ? copy.securityTwoFactorReady
          : copy.securityStandard;
  const syncLabel = syncStrategy === 'offline' ? copy.syncOffline : syncStrategy === 'ipfs' ? copy.syncIpfs : copy.syncP2p;
  const syncDetail =
    syncStrategy === 'offline' ? copy.syncLocalOnly : syncTrustedDevices ? copy.syncTrustedDevices : copy.syncManualPairing;
  const desktopOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (allowCreateProfile) {
      actions.push({ key: 'profile', label: copy.addProfile, onClick: onCreateProfile });
    }
    actions.push({ key: 'hotkeys', label: copy.hotkey, onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [allowCreateProfile, copy.addProfile, copy.hotkey, onCreateProfile, setHotkeysOpen]);
  const mobileOverflowActions = useMemo<OverflowAction[]>(() => {
    const actions: OverflowAction[] = [];
    if (allowCreateProfile) {
      actions.push({ key: 'profile', label: copy.addProfile, onClick: onCreateProfile });
    }
    actions.push({ key: 'hotkeys', label: copy.hotkey, onClick: () => setHotkeysOpen(true) });
    return actions;
  }, [allowCreateProfile, copy.addProfile, copy.hotkey, onCreateProfile, setHotkeysOpen]);
  const showDesktopOverflow = allowProfileSwitch || desktopOverflowActions.length > 0;

  const renderSearchInput = (inputRef: React.RefObject<HTMLInputElement>) => (
    <motion.div
      className={`${pillBase} w-full min-w-0 justify-start gap-2 px-3 text-muted hover:text-text`}
      onClick={() => {
        if (showSearchInput) {
          return;
        }
        openSearchInput();
      }}
      {...pillMotion}
    >
      <span className="flex-none text-muted">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        value={search ?? ''}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder={copy.searchEvents}
        readOnly={!showSearchInput}
        aria-disabled={!showSearchInput}
        onFocus={() => setShowSearchInput(true)}
        className="w-full min-w-0 overflow-hidden text-ellipsis bg-transparent text-[11px] leading-none text-text placeholder:text-muted focus:outline-none"
      />
    </motion.div>
  );

  if (variant === 'minimal') {
    return (
      <header className="topbar relative w-full text-sm">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              {onOpenNav && (
                <motion.button
                  type="button"
                  onClick={onOpenNav}
                  className={`${pillBase} flex-none px-3 text-muted hover:text-text md:hidden`}
                  aria-label={copy.openNavigation}
                  {...pillMotion}
                >
                  <HamburgerIcon />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={onHome}
                className="flex h-9 flex-none items-center gap-2 rounded-full border border-grid bg-panel px-3 text-text transition hover:border-accent/60"
                aria-label={copy.goToCalendar}
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
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
              {onToday && (
                <motion.button
                  onClick={onToday}
                  className={`${pillBase} px-3 text-muted hover:text-text`}
                  {...pillMotion}
                >
                  {copy.today}
                </motion.button>
              )}
              {showViewControls && (
                <Segmented
                  ariaLabel={copy.calendarView}
                  items={[
                    {
                      key: 'week',
                      label: copy.week,
                      onClick: () => onViewChange('timeGridWeek'),
                      active: view === 'timeGridWeek'
                    },
                    {
                      key: 'month',
                      label: copy.month,
                      onClick: () => onViewChange('dayGridMonth'),
                      active: view === 'dayGridMonth'
                    }
                  ]}
                />
              )}
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              {showSearchBar && (
                <div className="min-w-[180px] max-w-[320px] flex-1">{renderSearchInput(desktopSearchInputRef)}</div>
              )}
              {onCommandAdd && (
                <motion.button
                  type="button"
                  onClick={onCommandAdd}
                  className={newEventClass}
                  {...pillMotion}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in srgb,var(--accentText) 25%, transparent)] text-[12px]">
                    +
                  </span>
                  {copy.newEvent}
                </motion.button>
              )}
              <div className="hidden lg:flex items-center gap-2">
                <LanguageMenu
                  language={language}
                  onChange={onLanguageChange}
                  label={copy.languageLabel}
                  options={languageOptions}
                />
                {canInstall && !isIOS && (
                  <motion.button
                    type="button"
                    onClick={() => void promptInstall()}
                    className={`${pillBase} px-3 text-muted hover:text-text`}
                    {...pillMotion}
                  >
                    {copy.installApp}
                  </motion.button>
                )}
              </div>
              <div className="hidden sm:flex justify-end">
                <div className={clockClass}>
                  <Clock />
                </div>
              </div>
            </div>
            <div className="flex w-full items-center justify-end sm:hidden">
              <div className={clockClass}>
                <Clock />
              </div>
            </div>
          </div>
        </div>
        <HotkeysModal open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
      </header>
    );
  }

  return (
    <header className="topbar relative w-full text-sm">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6">
          <div className="py-3">
            <div className="hidden min-w-0 flex-col gap-2 lg:flex">
              <div className="grid min-w-0 items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
                <div className="flex min-w-0 items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={onHome}
                    className="flex h-9 flex-none items-center gap-2 rounded-full border border-grid bg-panel px-3 text-text transition hover:border-accent/60"
                    aria-label={copy.goToCalendar}
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
                  <motion.div className={`${pillBase} gap-2 px-3 text-muted`} {...pillMotion}>
                    <span className="text-[10px] tracking-[0.3em]">{copy.sync}</span>
                    <span className="text-text">{syncLabel}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{syncDetail}</span>
                  </motion.div>
                </div>
                <div className="flex min-w-0 items-center justify-center">
                  {showViewControls && (
                    <Segmented
                      ariaLabel={copy.calendarView}
                      items={[
                        {
                          key: 'week',
                          label: (
                            <>
                              <span className="hidden xl:inline">{copy.week}</span>
                              <span className="xl:hidden">{copy.weekShort}</span>
                            </>
                          ),
                          onClick: () => onViewChange('timeGridWeek'),
                          active: view === 'timeGridWeek'
                        },
                        {
                          key: 'month',
                          label: (
                            <>
                              <span className="hidden xl:inline">{copy.month}</span>
                              <span className="xl:hidden">{copy.monthShort}</span>
                            </>
                          ),
                          onClick: () => onViewChange('dayGridMonth'),
                          active: view === 'dayGridMonth'
                        }
                      ]}
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {showSearchPill && (
                    <div className="min-w-[200px] max-w-[360px] flex-1">{renderSearchInput(desktopSearchInputRef)}</div>
                  )}
                  {showSearch && (
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (showSearchInput) {
                          setShowSearchInput(false);
                          onSearchChange?.('');
                          return;
                        }
                        openSearchInput();
                      }}
                      className={iconButtonBase}
                      aria-label={showSearchInput ? copy.closeSearch : copy.openSearch}
                      {...pillMotion}
                    >
                      <SearchIcon />
                    </motion.button>
                  )}
                  {onCommandAdd && (
                    <motion.button
                      type="button"
                      onClick={onCommandAdd}
                      className={newEventClass}
                      {...pillMotion}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in srgb,var(--accentText) 25%, transparent)] text-[12px]">
                        +
                      </span>
                      {copy.newEvent}
                    </motion.button>
                  )}
                  <LanguageMenu
                    language={language}
                    onChange={onLanguageChange}
                    label={copy.languageLabel}
                    options={languageOptions}
                  />
                  {canInstall && !isIOS && (
                    <motion.button
                      type="button"
                      onClick={() => void promptInstall()}
                      className={`${pillBase} px-3 text-muted hover:text-text`}
                      {...pillMotion}
                    >
                      {copy.installApp}
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    className={iconButtonBase}
                    aria-label={copy.notifications}
                    {...pillMotion}
                  >
                    <span className="relative">
                      <BellIcon />
                      {notificationsCount > 0 && (
                        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                      )}
                    </span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setHotkeysOpen(true)}
                    className={iconButtonBase}
                    aria-label={copy.helpShortcuts}
                    {...pillMotion}
                  >
                    <InfoIcon />
                  </motion.button>
                  <motion.div className={`${pillBase} gap-2 px-3 text-muted`} {...pillMotion}>
                    <ShieldIcon />
                    <span className="text-text">{securityLabel}</span>
                  </motion.div>
                  <motion.button
                    type="button"
                    onClick={onLockNow}
                    className={iconButtonBase}
                    aria-label={copy.lockNow}
                    {...pillMotion}
                  >
                    <LockIcon />
                  </motion.button>
                  <ProfileMenu
                    options={profiles}
                    activeId={activeProfileId}
                    label={copy.agent}
                    activeLabel={copy.activeAgent}
                    addProfileLabel={copy.addProfile}
                    onChange={allowProfileSwitch ? onProfileChange : undefined}
                    disabled={!allowProfileSwitch}
                  />
                  {showDesktopOverflow && (
                    <OverflowMenu
                      actions={desktopOverflowActions}
                      showProfileList={false}
                      showCreateProfileItem={false}
                      openLabel={copy.openOverflowMenu}
                      addProfileLabel={copy.addProfile}
                      profiles={profiles}
                      activeProfileId={activeProfileId}
                      onProfileChange={onProfileChange}
                      onCreateProfile={onCreateProfile}
                    />
                  )}
                </div>
              </div>

              <div className="grid min-w-0 items-center gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
                <div className="flex min-w-0 items-center gap-2">
                  {onToday && (
                    <motion.button onClick={onToday} className={`${pillBase} px-3 text-muted`} {...pillMotion}>
                      {copy.today}
                    </motion.button>
                  )}
                </div>
                <div className="flex min-w-0 items-center justify-center">
                  {showNavControls && (
                    <Segmented
                      ariaLabel={copy.navigateCalendar}
                      items={[
                        {
                          key: 'prev',
                          label: copy.previous,
                          onClick: onPrev,
                          icon: <ChevronIcon direction="left" />
                        },
                        {
                          key: 'next',
                          label: copy.next,
                          onClick: onNext,
                          icon: <ChevronIcon direction="right" />
                        }
                      ]}
                    />
                  )}
                </div>
                <div className="flex min-w-0 items-center justify-end">
                  <div className={clockClass}>
                    <Clock />
                  </div>
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
                  aria-label={copy.openNavigation}
                  {...pillMotion}
                >
                  <HamburgerIcon />
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={onHome}
                className="flex h-9 flex-none items-center gap-2 rounded-full border border-grid bg-panel px-3 text-text transition hover:border-accent/60"
                aria-label={copy.goToCalendar}
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

            <div className="flex flex-wrap items-center justify-end gap-2">
              {showSearch && (
                <motion.button
                  type="button"
                  onClick={() => {
                    if (showSearchInput) {
                      setShowSearchInput(false);
                      onSearchChange?.('');
                      return;
                    }
                    openSearchInput();
                  }}
                  className={iconButtonBase}
                  aria-label={showSearchInput ? copy.closeSearch : copy.openSearch}
                  {...pillMotion}
                >
                  <SearchIcon />
                </motion.button>
              )}
              {onCommandAdd && (
                <motion.button
                  type="button"
                  onClick={onCommandAdd}
                  className={newEventClass}
                  {...pillMotion}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in srgb,var(--accentText) 25%, transparent)] text-[12px]">
                    +
                  </span>
                  {copy.newEvent}
                </motion.button>
              )}
              <ProfileMenu
                options={profiles}
                activeId={activeProfileId}
                label={copy.agent}
                activeLabel={copy.activeAgent}
                addProfileLabel={copy.addProfile}
                onChange={allowProfileSwitch ? onProfileChange : undefined}
                disabled={!allowProfileSwitch}
              />
              <OverflowMenu
                actions={mobileOverflowActions}
                showProfileList={false}
                showCreateProfileItem={false}
                openLabel={copy.openOverflowMenu}
                addProfileLabel={copy.addProfile}
                profiles={profiles}
                activeProfileId={activeProfileId}
                onProfileChange={onProfileChange}
                onCreateProfile={onCreateProfile}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 lg:hidden">
            {onToday && (
              <motion.button onClick={onToday} className={`${pillBase} px-3 text-muted`} {...pillMotion}>
                {copy.today}
              </motion.button>
            )}
            {showViewControls && (
              <Segmented
                ariaLabel={copy.calendarView}
                items={[
                  {
                    key: 'week',
                    label: copy.week,
                    onClick: () => onViewChange('timeGridWeek'),
                    active: view === 'timeGridWeek'
                  },
                  {
                    key: 'month',
                    label: copy.month,
                    onClick: () => onViewChange('dayGridMonth'),
                    active: view === 'dayGridMonth'
                  }
                ]}
              />
            )}
            {showNavControls && (
              <Segmented
                ariaLabel={copy.navigateCalendar}
                items={[
                  {
                    key: 'prev',
                    label: copy.previous,
                    onClick: onPrev,
                    icon: <ChevronIcon direction="left" />
                  },
                  {
                    key: 'next',
                    label: copy.next,
                    onClick: onNext,
                    icon: <ChevronIcon direction="right" />
                  }
                ]}
              />
            )}
            <motion.div className={`${pillBase} gap-2 px-3 text-muted`} {...pillMotion}>
              <ShieldIcon />
              <span className="text-text">{securityLabel}</span>
            </motion.div>
            <motion.button
              onClick={onLockNow}
              className={iconButtonBase}
              aria-label={copy.lockNow}
              {...pillMotion}
            >
              <LockIcon />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setHotkeysOpen(true)}
              className={iconButtonBase}
              aria-label={copy.helpShortcuts}
              {...pillMotion}
            >
              <InfoIcon />
            </motion.button>
            <LanguageMenu
              language={language}
              onChange={onLanguageChange}
              label={copy.languageLabel}
              options={languageOptions}
            />
            {showSearchPill && (
              <div className="w-full min-w-0">
                {renderSearchInput(mobileSearchInputRef)}
              </div>
            )}
          </div>
        </div>
      </div>
      <HotkeysModal open={hotkeysOpen} onClose={() => setHotkeysOpen(false)} />
    </header>
  );
};

export default TopBar;

// Layout notes: desktop uses a 3-zone grid (left/center/right) with stacked view + nav controls.
