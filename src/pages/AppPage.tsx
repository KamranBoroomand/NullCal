import { useEffect, useMemo, useState } from 'react';
import { addHours, addMonths, addWeeks, format, startOfHour, subMonths, subWeeks } from 'date-fns';
import { nanoid } from 'nanoid';
import type { EventInput } from '@fullcalendar/core';
import { motion, useReducedMotion } from 'framer-motion';
import AppShell from '../app/AppShell';
import TopBar from '../app/TopBar';
import SideBar from '../app/SideBar';
import CalendarView from '../app/CalendarView';
import Modal from '../components/Modal';
import { useAppStore } from '../app/AppStore';
import type { CalendarEvent } from '../storage/types';
import { useToast } from '../components/ToastProvider';

const toInputValue = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
const fromInputValue = (value: string) => new Date(value).toISOString();

type EventDraft = Omit<CalendarEvent, 'id'> & { id?: string };

const AppPage = () => {
  const {
    state,
    loading,
    lockNow,
    updateSettings,
    setActiveProfile,
    createProfile,
    resetProfile,
    toggleCalendarVisibility,
    upsertEvent,
    deleteEvent,
    exportEncrypted,
    importEncrypted
  } =
    useAppStore();
  const { notify } = useToast();
  const [view, setView] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.title = 'NullCal — Calendar';
  }, []);

  const handleCalendarDateChange = (next: Date) => {
    setCurrentDate((prev) => (prev.getTime() === next.getTime() ? prev : next));
  };

  const activeProfile = useMemo(() => {
    if (!state) {
      return null;
    }
    return state.profiles.find((profile) => profile.id === state.settings.activeProfileId) ?? state.profiles[0];
  }, [state]);

  const handleCreateProfile = () => {
    const name = window.prompt('Profile name');
    if (!name) {
      return;
    }
    createProfile(name.trim());
  };

  const handleResetProfile = () => {
    const confirmed = window.confirm('Reset this profile back to default calendars and events?');
    if (!confirmed) {
      return;
    }
    if (activeProfile) {
      resetProfile(activeProfile.id);
    }
  };

  const handleToggleCalendar = (id: string) => {
    toggleCalendarVisibility(id);
  };

  const handleSaveEvent = () => {
    if (!draft || !activeProfile) {
      return;
    }

    const title = draft.title.trim() || 'Untitled event';
    const eventId = draft.id ?? nanoid();
    const nextEvent: CalendarEvent = {
      ...draft,
      id: eventId,
      profileId: activeProfile.id,
      title
    };

    upsertEvent(nextEvent);
    setDraft(null);
  };

  const handleDeleteEvent = () => {
    if (!draft?.id) {
      setDraft(null);
      return;
    }
    deleteEvent(draft.id);
    setDraft(null);
  };

  const handleCreateDraft = (start: Date, end: Date, calendarId?: string) => {
    if (!activeProfile) {
      return;
    }
    const calendar =
      calendarId ??
      state?.calendars.find((item) => item.profileId === activeProfile.id)?.id;
    if (!calendar) {
      return;
    }
    setDraft({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
      profileId: activeProfile.id,
      calendarId: calendar,
      location: '',
      notes: ''
    });
  };

  const handleSelectRange = (start: Date, end: Date, allDay: boolean) => {
    const adjustedEnd = allDay ? addHours(start, 1) : end;
    handleCreateDraft(start, adjustedEnd);
  };

  const handleDateClick = (date: Date) => {
    handleCreateDraft(date, addHours(date, 1));
  };

  const handleEventClick = (id: string) => {
    const event = events.find((item) => item.id === id);
    if (event) {
      setDraft({ ...event });
    }
  };

  const handleEventChange = (id: string, start: Date, end: Date) => {
    const event = events.find((item) => item.id === id);
    if (!event) {
      return;
    }
    upsertEvent({
      ...event,
      start: start.toISOString(),
      end: end.toISOString()
    });
  };

  const handleExport = async () => {
    if (!activeProfile || !state) {
      return;
    }
    const passphrase = window.prompt('Create a passphrase to encrypt this backup.');
    if (!passphrase) {
      return;
    }
    try {
      const payload = await exportEncrypted(passphrase);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nullcal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify('Encrypted backup exported.', 'success');
    } catch {
      notify('Export failed. Try again.', 'error');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const passphrase = window.prompt('Enter your backup passphrase.');
      if (!passphrase) {
        return;
      }
      await importEncrypted(payload, passphrase);
      notify('Backup imported successfully.', 'success');
    } catch {
      notify('Import failed. Check your passphrase.', 'error');
    }
  };

  const handlePrev = () => {
    setCurrentDate((prev) => (view === 'timeGridWeek' ? subWeeks(prev, 1) : subMonths(prev, 1)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (view === 'timeGridWeek' ? addWeeks(prev, 1) : addMonths(prev, 1)));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const calendars = useMemo(() => {
    if (!activeProfile || !state) {
      return [];
    }
    return state.calendars.filter((calendar) => calendar.profileId === activeProfile.id);
  }, [activeProfile, state]);

  const events = useMemo(() => {
    if (!activeProfile || !state) {
      return [];
    }
    return state.events.filter((event) => event.profileId === activeProfile.id);
  }, [activeProfile, state]);

  const visibleCalendarIds = useMemo(() => {
    return calendars.filter((calendar) => calendar.visible).map((calendar) => calendar.id);
  }, [calendars]);

  const filteredEvents = useMemo(() => {
    if (!activeProfile) {
      return [];
    }
    const term = search.trim().toLowerCase();
    return events.filter((event) => {
      if (!visibleCalendarIds.includes(event.calendarId)) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${event.title} ${event.location ?? ''} ${event.notes ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [activeProfile, search, visibleCalendarIds]);

  const calendarEvents: EventInput[] = useMemo(() => {
    if (!activeProfile) {
      return [];
    }
    return filteredEvents.map((event) => {
      const calendar = calendars.find((item) => item.id === event.calendarId);
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: 'var(--panel2)',
        borderColor: calendar?.color ?? 'var(--accent)',
        textColor: 'var(--text)',
        extendedProps: {
          accentColor: calendar?.color ?? 'var(--accent)'
        }
      };
    });
  }, [calendars, filteredEvents]);

  if (loading || !activeProfile || !state) {
    return null;
  }

  return (
    <>
      <AppShell
        topBar={
        <TopBar
          view={view}
          onViewChange={setView}
          onToday={handleToday}
          onHome={handleToday}
          onPrev={handlePrev}
          onNext={handleNext}
          search={search}
            onSearchChange={setSearch}
            profiles={state.profiles.map((profile) => ({ id: profile.id, name: profile.name }))}
            activeProfileId={activeProfile.id}
            onProfileChange={setActiveProfile}
            onCreateProfile={handleCreateProfile}
            onOpenSettings={() => setSettingsOpen(true)}
            onLockNow={lockNow}
            theme={state.settings.theme}
            onThemeChange={(theme) => updateSettings({ theme })}
            networkLocked={state.settings.networkLock}
          />
        }
        sidebar={
          <SideBar
            selectedDate={currentDate}
            onSelectDate={setCurrentDate}
            calendars={calendars}
            onToggleCalendar={handleToggleCalendar}
            onNewEvent={() => handleCreateDraft(startOfHour(new Date()), addHours(startOfHour(new Date()), 1))}
            onExport={handleExport}
            onImport={handleImport}
            onResetProfile={handleResetProfile}
          />
        }
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mb-4 flex items-center justify-between text-xs text-muted">
            <div className="uppercase tracking-[0.3em]">{format(currentDate, 'MMMM yyyy')}</div>
            <div className="text-[11px]">{filteredEvents.length} events</div>
          </div>
          <CalendarView
            events={calendarEvents}
            view={view}
            date={currentDate}
            secureMode={state.settings.secureMode}
            blurSensitive={state.settings.blurSensitive}
            onDateChange={handleCalendarDateChange}
            onSelectRange={handleSelectRange}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onEventChange={handleEventChange}
          />
        </motion.div>
      </AppShell>
      <Modal title={draft?.id ? 'Edit event' : 'New event'} open={Boolean(draft)} onClose={() => setDraft(null)}>
        {draft && (
          <div className="grid gap-4">
            <label className="text-xs text-muted">
              Title
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-muted">
                Start
                <input
                  type="datetime-local"
                  value={toInputValue(draft.start)}
                  onChange={(event) => setDraft({ ...draft, start: fromInputValue(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                />
              </label>
              <label className="text-xs text-muted">
                End
                <input
                  type="datetime-local"
                  value={toInputValue(draft.end)}
                  onChange={(event) => setDraft({ ...draft, end: fromInputValue(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                />
              </label>
            </div>
            <label className="text-xs text-muted">
              Calendar
              <select
                value={draft.calendarId}
                onChange={(event) => setDraft({ ...draft, calendarId: event.target.value })}
                className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id} className="bg-panel2">
                    {calendar.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Location
              <input
                value={draft.location ?? ''}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              />
            </label>
            <label className="text-xs text-muted">
              Notes
              <textarea
                value={draft.notes ?? ''}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="mt-1 min-h-[90px] w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              />
            </label>
            <div className="flex items-center justify-between">
              <button
                onClick={handleDeleteEvent}
                className="rounded-full border border-grid px-4 py-2 text-xs text-muted transition hover:text-text"
              >
                {draft.id ? 'Delete' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEvent}
                className="rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14] shadow-glow transition"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal title="Settings" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="grid gap-3 text-sm text-muted">
          <p>
            Profile: <span className="text-text">{activeProfile.name}</span>
          </p>
          <p>
            Storage: <span className="text-text">Local IndexedDB</span>
          </p>
          <button
            onClick={() => {
              setSettingsOpen(false);
              handleResetProfile();
            }}
            className="mt-2 rounded-full border border-grid px-4 py-2 text-xs text-muted transition hover:text-text"
          >
            Reset profile data
          </button>
        </div>
      </Modal>
    </>
  );
};

export default AppPage;
