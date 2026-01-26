import { useRef } from 'react';
import MiniMonth from '../components/MiniMonth';
import ColorDot from '../components/ColorDot';
import type { Calendar } from '../data/types';

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

  return (
    <div className="flex flex-col gap-6">
      <MiniMonth selectedDate={selectedDate} onSelect={onSelectDate} />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Calendars</p>
          <span className="text-[10px] text-white/40">{calendars.length}</span>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {calendars.map((calendar) => (
            <label key={calendar.id} className="flex items-center justify-between text-xs text-white/70">
              <div className="flex items-center gap-2">
                <ColorDot color={calendar.color} active={calendar.visible} />
                <span>{calendar.name}</span>
              </div>
              <input
                type="checkbox"
                checked={calendar.visible}
                onChange={() => onToggleCalendar(calendar.id)}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <button
          onClick={onNewEvent}
          className="w-full rounded-xl bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-glow transition hover:bg-accentSoft"
        >
          New event
        </button>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:text-white"
          >
            Import
          </button>
          <button
            onClick={onExport}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:text-white"
          >
            Export
          </button>
        </div>
        <button
          onClick={onResetProfile}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:text-white"
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
