import { format } from 'date-fns';
import ColorDot from './ColorDot';
import Modal from './Modal';
import { isEncryptedNote } from '../security/encryption';
import type { CalendarEvent, Calendar } from '../storage/types';

type PanelProps = {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  calendars: Calendar[];
  onSelectEvent: (eventId: string) => void;
};

const formatEventDate = (value: string) => format(new Date(value), 'PPp');

export const RemindersModal = ({ open, onClose, events, calendars, onSelectEvent }: PanelProps) => {
  return (
    <Modal title="Reminders" open={open} onClose={onClose}>
      <div className="space-y-3 text-sm text-muted">
        {events.length === 0 ? (
          <p className="text-xs text-muted">No active reminders yet. Add a reminder rule to an event.</p>
        ) : (
          <div className="grid gap-2">
            {events.map((event) => {
              const calendar = calendars.find((item) => item.id === event.calendarId);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-grid bg-panel2 px-3 py-2 text-left text-xs transition hover:border-accent/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ColorDot color={calendar?.color ?? 'var(--accent)'} active />
                      <p className="truncate uppercase tracking-[0.2em] text-text">{event.title || 'Untitled'}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{formatEventDate(event.start)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                      Rule: {event.reminderRule}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent">Open</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export const NotesModal = ({ open, onClose, events, calendars, onSelectEvent }: PanelProps) => {
  return (
    <Modal title="Notes" open={open} onClose={onClose}>
      <div className="space-y-3 text-sm text-muted">
        {events.length === 0 ? (
          <p className="text-xs text-muted">No notes yet. Add notes to an event to see them here.</p>
        ) : (
          <div className="grid gap-2">
            {events.map((event) => {
              const calendar = calendars.find((item) => item.id === event.calendarId);
              const encrypted = Boolean(event.notes && isEncryptedNote(event.notes));
              const preview = encrypted ? 'Encrypted note' : event.notes?.slice(0, 120) ?? '';
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onSelectEvent(event.id)}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-grid bg-panel2 px-3 py-2 text-left text-xs transition hover:border-accent/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ColorDot color={calendar?.color ?? 'var(--accent)'} active />
                      <p className="truncate uppercase tracking-[0.2em] text-text">{event.title || 'Untitled'}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{formatEventDate(event.start)}</p>
                    <p className="mt-1 text-[11px] text-muted">{preview}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-accent">Open</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
