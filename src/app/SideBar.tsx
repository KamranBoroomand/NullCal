import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import MiniMonth from '../components/MiniMonth';
import ColorDot from '../components/ColorDot';
import type { Calendar } from '../storage/types';
import { motion, useReducedMotion } from 'framer-motion';

type SideBarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  calendars: Calendar[];
  onToggleCalendar: (id: string) => void;
  onNewEvent: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onResetProfile: () => void;
};

const SideBar = ({
  selectedDate,
  onSelectDate,
  calendars,
  onToggleCalendar,
  onNewEvent,
  onExport,
  onImport,
  onResetProfile
}: SideBarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-grid bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Navigation</p>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 uppercase tracking-[0.2em] transition ${
                isActive ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted hover:text-text'
              }`
            }
          >
            Calendar
          </NavLink>
          <NavLink
            to="/safety"
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 uppercase tracking-[0.2em] transition ${
                isActive ? 'glow-pulse bg-accent text-[#0b0f14]' : 'text-muted hover:text-text'
              }`
            }
          >
            Safety Center
          </NavLink>
        </div>
      </div>
      <MiniMonth selectedDate={selectedDate} onSelect={onSelectDate} />
      <div className="rounded-2xl border border-grid bg-panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Calendars</p>
          <span className="text-[10px] text-muted">{calendars.length}</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {calendars.map((calendar) => (
            <label key={calendar.id} className="flex items-center justify-between text-xs text-muted">
              <div className="flex items-center gap-2">
                <ColorDot color={calendar.color} active={calendar.visible} />
                <span>{calendar.name}</span>
              </div>
              <input
                type="checkbox"
                checked={calendar.visible}
                onChange={() => onToggleCalendar(calendar.id)}
                className="h-4 w-4 rounded border-grid bg-transparent text-accent focus:ring-accent"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-grid bg-panel p-4">
        <motion.button
          onClick={onNewEvent}
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14] shadow-glow transition"
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
              onImport(file);
              event.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};

export default SideBar;
