import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import MiniMonth from '../components/MiniMonth';
import ColorDot from '../components/ColorDot';
import Modal from '../components/Modal';
import type { Calendar } from '../storage/types';
import { motion, useReducedMotion } from 'framer-motion';

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

const palette = [
  '#f4ff00',
  '#9bff00',
  '#6b7cff',
  '#38f5c8',
  '#ff6b3d',
  '#ff4d8d',
  '#ffd166',
  '#7b5cff'
];

type SideBarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendars: Calendar[];
  activeProfileId: string;
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
  showClipboardWarning?: boolean;
};

const SideBar = ({
  selectedDate,
  onSelectDate,
  calendars,
  activeProfileId,
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
  showClipboardWarning = false
}: SideBarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Calendar | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicColor, setTopicColor] = useState(palette[0]);
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
    setTopicColor(palette[0]);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-grid bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Navigation</p>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          <NavLink
            to="/"
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 uppercase tracking-[0.2em] transition ${
                isActive ? 'bg-accent text-[var(--accentText)]' : 'text-muted hover:text-text'
              }`
            }
          >
            Calendar
          </NavLink>
          <NavLink
            to="/safety"
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 uppercase tracking-[0.2em] transition ${
                isActive ? 'bg-accent text-[var(--accentText)]' : 'text-muted hover:text-text'
              }`
            }
          >
            Safety Center
          </NavLink>
        </div>
      </div>
      {variant === 'full' && <MiniMonth selectedDate={selectedDate} onSelect={onSelectDate} />}
      <div className="rounded-2xl border border-grid bg-panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Calendars</p>
          <span className="text-[10px] text-muted">{calendars.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="mt-3 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted transition hover:text-text"
        >
          + New topic
        </button>
        <div className="mt-4 flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-1">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2">
                <ColorDot color={calendar.color} active={calendar.isVisible} />
                <span>{calendar.name}</span>
              </div>
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
      {variant === 'full' && onNewEvent && onExport && onImport && onResetProfile && (
        <>
          <div className="rounded-2xl border border-grid bg-panel p-4">
            <motion.button
              onClick={onNewEvent}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] shadow-glow transition"
            >
              New event
            </motion.button>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-xl border border-grid bg-panel2 px-3 py-2 text-xs text-muted transition hover:text-text"
              >
                Import
              </button>
              <button
                onClick={onExport}
                className="flex-1 rounded-xl border border-grid bg-panel2 px-3 py-2 text-xs text-muted transition hover:text-text"
              >
                Export
              </button>
            </div>
            <button
              onClick={onResetProfile}
              className="mt-4 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-xs text-muted transition hover:text-text"
            >
              Reset profile data
            </button>
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
          {showClipboardWarning && !clipboardDismissed && (
            <div className="rounded-2xl border border-danger bg-[color-mix(in srgb,var(--danger) 12%, transparent)] px-3 py-3 text-xs text-muted">
              <p className="text-xs uppercase tracking-[0.2em] text-danger">Clipboard warning</p>
              <p className="mt-1 text-xs text-muted">Clipboard contains sensitive data. Clear now?</p>
              <div className="mt-3 flex flex-wrap gap-2">
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
        </>
      )}
      <Modal
        title={editTarget ? 'Edit topic' : 'New topic'}
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
              {palette.map((swatch) => (
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
            {editTarget ? 'Save changes' : 'Create topic'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SideBar;
