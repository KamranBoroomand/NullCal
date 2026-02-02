import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import ThemePicker from '../components/ThemePicker';
import ColorDot from '../components/ColorDot';
import Modal from '../components/Modal';
import type { Calendar } from '../storage/types';
import { THEME_PACKS } from '../theme/themePacks';
import type { ThemeMode } from '../theme/ThemeProvider';

const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;

const EyeIcon = ({ hidden }: { hidden?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M1.5 8s2.2-4.5 6.5-4.5S14.5 8 14.5 8s-2.2 4.5-6.5 4.5S1.5 8 1.5 8Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    {hidden && <line x1="3" y1="13" x2="13" y2="3" stroke="currentColor" strokeWidth="1.2" />}
  </svg>
);

const MoreIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="3" r="1.2" fill="currentColor" />
    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    <circle cx="8" cy="13" r="1.2" fill="currentColor" />
  </svg>
);

const NavIcon = ({ path }: { path: string }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d={path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const colorPalette = [
  '#f4ff00',
  '#9bff00',
  '#6b7cff',
  '#38f5c8',
  '#ff6b3d',
  '#ff4d8d',
  '#ffd166',
  '#7b5cff'
];

const themeOptions = THEME_PACKS;

type SideBarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendars: Calendar[];
  activeProfileId: string;
  activeProfileName?: string;
  variant?: 'full' | 'drawer';
  onToggleCalendar: (id: string) => void;
  onCreateCalendar: (profileId: string, payload: { name: string; color: string }) => void;
  onRenameCalendar: (profileId: string, calendarId: string, name: string) => void;
  onRecolorCalendar: (profileId: string, calendarId: string, color: string) => void;
  onDeleteCalendar: (profileId: string, calendarId: string) => void;
  onNewEvent?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  onResetProfile?: () => void;
  onNavigate?: () => void;
  onOpenSettings?: () => void;
  onLockNow?: () => void;
  palette?: string;
  onPaletteChange?: (paletteId: string, themeMode: ThemeMode) => void;
  showClipboardWarning?: boolean;
};

const SideBar = ({
  selectedDate,
  onSelectDate,
  calendars,
  activeProfileId,
  activeProfileName,
  variant = 'full',
  onToggleCalendar,
  onCreateCalendar,
  onRenameCalendar,
  onRecolorCalendar,
  onDeleteCalendar,
  onNewEvent,
  onExport,
  onImport,
  onResetProfile,
  onNavigate,
  onOpenSettings,
  onLockNow,
  palette,
  onPaletteChange,
  showClipboardWarning = false
}: SideBarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Calendar | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicColor, setTopicColor] = useState(colorPalette[0]);
  const [customColor, setCustomColor] = useState('');
  const [clipboardDismissed, setClipboardDismissed] = useState(false);

  useEffect(() => {
    if (!menuOpenId) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-calendar-menu]')) {
        return;
      }
      setMenuOpenId(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [menuOpenId]);

  useEffect(() => {
    if (!createOpen) {
      return;
    }
    setTopicName('');
    setTopicColor(colorPalette[0]);
    setCustomColor('');
  }, [createOpen]);

  useEffect(() => {
    if (!editTarget) {
      return;
    }
    setTopicName(editTarget.name);
    setTopicColor(editTarget.color);
    setCustomColor('');
  }, [editTarget]);

  const previewColor = useMemo(() => {
    if (customColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)) {
      return customColor;
    }
    return topicColor;
  }, [customColor, topicColor]);

  const handleSaveCalendar = () => {
    const trimmed = topicName.trim();
    if (!activeProfileId || trimmed.length < 2 || trimmed.length > 30) {
      return;
    }
    const color = previewColor;
    if (editTarget) {
      onRenameCalendar(activeProfileId, editTarget.id, trimmed);
      onRecolorCalendar(activeProfileId, editTarget.id, color);
      setEditTarget(null);
      return;
    }
    onCreateCalendar(activeProfileId, { name: trimmed, color });
    setCreateOpen(false);
  };

  const handleDeleteCalendar = (calendar: Calendar) => {
    if (!activeProfileId) {
      return;
    }
    const confirmed = window.confirm(`Delete ${calendar.name} and its events?`);
    if (!confirmed) {
      return;
    }
    onDeleteCalendar(activeProfileId, calendar.id);
  };

  const primaryNav = [
    {
      key: 'today',
      label: 'Today',
      icon: 'M10 3.5v2.5M5.5 10H3M17 10h-2.5M6.6 6.6 4.9 4.9M13.4 13.4l1.7 1.7M6.6 13.4l-1.7 1.7M13.4 6.6l1.7-1.7M10 6.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z',
      onClick: () => onSelectDate(new Date())
    }
  ];

  return (
    <div className="flex h-full flex-col gap-6 text-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-xl border border-grid bg-panel2">
          <img
            src={mark2x}
            srcSet={`${mark1x} 1x, ${mark2x} 2x`}
            alt="NullCal logo"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">NullCal</p>
          <p className="text-sm font-semibold text-text">Operations Suite</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Navigation</p>
        <div className="grid gap-2 text-xs">
          {primaryNav.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="flex items-center gap-3 rounded-xl border border-grid bg-panel px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:border-accent/60 hover:text-text"
            >
              <NavIcon path={item.icon} />
              {item.label}
            </button>
          ))}
          <NavLink
            to="/"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border px-3 py-2 uppercase tracking-[0.2em] transition ${
                isActive
                  ? 'border-accent bg-[color-mix(in srgb,var(--accent) 18%, transparent)] text-text'
                  : 'border-grid bg-panel text-muted hover:border-accent/60 hover:text-text'
              }`
            }
          >
            <NavIcon path="M4 8.5 10 3l6 5.5V16H4V8.5Z" />
            Calendar
          </NavLink>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-grid bg-panel px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:border-accent/60 hover:text-text"
            title="Reminders syncs with mobile soon"
          >
            <NavIcon path="M10 3.5a4.5 4.5 0 0 1 4.5 4.5v2.5l1.5 2.5H4l1.5-2.5V8A4.5 4.5 0 0 1 10 3.5Z" />
            Reminders
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-grid bg-panel px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:border-accent/60 hover:text-text"
            title="Notes dashboard coming soon"
          >
            <NavIcon path="M5 4h10v12H5zM7.5 8h5M7.5 11h5" />
            Notes
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-grid bg-panel px-3 py-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Calendars</p>
          <span className="text-[10px] text-muted">{calendars.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-text"
        >
          + New calendar
        </button>
        <div className="flex flex-col gap-2">
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${
                calendar.isVisible
                  ? 'border-accent/50 bg-[color-mix(in srgb,var(--accent) 12%, transparent)] text-text'
                  : 'border-grid bg-panel2 text-muted'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleCalendar(calendar.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ColorDot color={calendar.color} active={calendar.isVisible} />
                <span className="truncate uppercase tracking-[0.2em]">{calendar.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleCalendar(calendar.id)}
                  className="rounded-full border border-grid px-2 py-1 text-[10px] text-muted transition hover:text-text"
                  aria-label={calendar.isVisible ? 'Hide calendar' : 'Show calendar'}
                >
                  <EyeIcon hidden={!calendar.isVisible} />
                </button>
                <div className="relative" data-calendar-menu>
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpenId((current) => (current === calendar.id ? null : calendar.id))
                    }
                    className="rounded-full border border-grid px-2 py-1 text-[10px] text-muted transition hover:text-text"
                    aria-label="Calendar options"
                  >
                    <MoreIcon />
                  </button>
                  {menuOpenId === calendar.id && (
                    <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border border-grid bg-panel2 p-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setEditTarget(calendar);
                          setMenuOpenId(null);
                        }}
                        className="w-full rounded-lg px-2 py-1 text-left text-muted transition hover:text-text"
                      >
                        Rename / color
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteCalendar(calendar);
                          setMenuOpenId(null);
                        }}
                        className="mt-1 w-full rounded-lg px-2 py-1 text-left text-danger transition hover:text-text"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onPaletteChange && palette && (
        <div className="space-y-3 rounded-2xl border border-grid bg-panel px-3 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Theme</p>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{palette}</span>
          </div>
          <ThemePicker
            themes={themeOptions}
            activeId={palette}
            onSelect={(nextId) => {
              const next = themeOptions.find((pack) => pack.id === nextId);
              if (!next) {
                return;
              }
              onPaletteChange(next.id, next.mode);
            }}
          />
        </div>
      )}

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-grid bg-panel px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Profile</p>
              <p className="text-sm font-semibold text-text">{activeProfileName ?? 'KamranBroomand'}</p>
            </div>
            {onLockNow && (
              <motion.button
                type="button"
                onClick={onLockNow}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="rounded-full border border-accent bg-[color-mix(in srgb,var(--accent) 18%, transparent)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent"
              >
                Lock now
              </motion.button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-grid bg-panel px-3 py-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted">System</p>
          <div className="mt-3 grid gap-2 text-xs">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex items-center justify-between rounded-xl border border-grid bg-panel2 px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:text-text"
              >
                Settings
                <NavIcon path="M10 4.5v2M10 13.5v2M4.5 10h2M13.5 10h2M6.3 6.3l1.4 1.4M12.3 12.3l1.4 1.4M6.3 13.7l1.4-1.4M12.3 7.7l1.4-1.4" />
              </button>
            )}
            <NavLink
              to="/safety"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl border px-3 py-2 uppercase tracking-[0.2em] transition ${
                  isActive
                    ? 'border-accent bg-[color-mix(in srgb,var(--accent) 18%, transparent)] text-text'
                    : 'border-grid bg-panel2 text-muted hover:text-text'
                }`
              }
            >
              Safety Center
              <NavIcon path="M10 3.5 15 5.5V9c0 3.2-2.2 5.7-5 6.6-2.8-.9-5-3.4-5-6.6V5.5L10 3.5Z" />
            </NavLink>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between rounded-xl border border-grid bg-panel2 px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:text-text"
            >
              Import
              <NavIcon path="M10 4v8M6.5 7.5 10 4l3.5 3.5M5 16h10" />
            </button>
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="flex items-center justify-between rounded-xl border border-grid bg-panel2 px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:text-text"
              >
                Export
                <NavIcon path="M10 16V8M6.5 11.5 10 16l3.5-4.5M5 4h10" />
              </button>
            )}
            {onResetProfile && (
              <button
                type="button"
                onClick={onResetProfile}
                className="flex items-center justify-between rounded-xl border border-grid bg-panel2 px-3 py-2 uppercase tracking-[0.2em] text-muted transition hover:text-text"
              >
                Reset profile
                <NavIcon path="M6 6h8M6 10h8M6 14h5" />
              </button>
            )}
            {onLockNow && (
              <button
                type="button"
                onClick={onLockNow}
                className="flex items-center justify-between rounded-xl border border-danger bg-[color-mix(in srgb,var(--danger) 12%, transparent)] px-3 py-2 uppercase tracking-[0.2em] text-danger transition hover:text-text"
              >
                Logout
                <NavIcon path="M7 5h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7M9 7l-3 3 3 3" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImport?.(file);
                  event.target.value = '';
                }
              }}
            />
          </div>
        </div>
        {variant === 'full' && onNewEvent && (
          <motion.button
            onClick={onNewEvent}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] shadow-glow transition"
          >
            New event
          </motion.button>
        )}
        {showClipboardWarning && !clipboardDismissed && (
          <div className="rounded-2xl border border-danger bg-[color-mix(in srgb,var(--danger) 8%, transparent)] px-3 py-2 text-[11px] text-muted">
            <p className="text-[10px] uppercase tracking-[0.2em] text-danger">Clipboard warning</p>
            <p className="mt-1 text-[11px] text-muted">Clipboard contains sensitive data. Clear now?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText('');
                  } catch {
                    // Ignore clipboard permission errors.
                  } finally {
                    setClipboardDismissed(true);
                  }
                }}
                className="rounded-xl border border-danger px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-danger"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText('[REDACTED]');
                  } catch {
                    // Ignore clipboard permission errors.
                  } finally {
                    setClipboardDismissed(true);
                  }
                }}
                className="rounded-xl border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                Copy sanitized
              </button>
              <button
                type="button"
                onClick={() => setClipboardDismissed(true)}
                className="rounded-xl border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                Ignore
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={editTarget ? 'Edit calendar' : 'New calendar'}
        open={createOpen || Boolean(editTarget)}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
      >
        <div className="grid gap-3">
          <label className="text-xs text-muted">
            Name
            <input
              value={topicName}
              onChange={(event) => setTopicName(event.target.value)}
              placeholder="2–30 characters"
              className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs text-muted">Color</p>
            <div className="flex flex-wrap gap-2">
              {colorPalette.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    setTopicColor(swatch);
                    setCustomColor('');
                  }}
                  className={`h-6 w-6 rounded-full border ${
                    previewColor === swatch ? 'border-accent' : 'border-grid'
                  }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Select ${swatch}`}
                />
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value.trim())}
                placeholder="Custom hex (#12ABCD)"
                className="rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              />
              <input
                type="color"
                value={previewColor}
                onChange={(event) => {
                  setCustomColor(event.target.value);
                }}
                className="h-10 w-full rounded-lg border border-grid bg-panel2"
                aria-label="Pick custom color"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveCalendar}
            disabled={topicName.trim().length < 2 || topicName.trim().length > 30}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {editTarget ? 'Save changes' : 'Create calendar'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SideBar;
