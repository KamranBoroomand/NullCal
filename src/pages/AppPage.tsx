import { useEffect, useMemo, useState } from 'react';
import { addHours, addMonths, addWeeks, format, startOfHour, subMonths, subWeeks } from 'date-fns';
import { nanoid } from 'nanoid';
import type { EventInput } from '@fullcalendar/core';
import AppShell from '../app/AppShell';
import TopBar from '../app/TopBar';
import SideBar from '../app/SideBar';
import CalendarView from '../app/CalendarView';
import Modal from '../components/Modal';
import { createSeedProfile } from '../data/seed';
import { loadState, resetProfileData, saveState } from '../data/storage';
import type { Calendar, CalendarEvent, EventDraft, Profile, StorageState } from '../data/types';

const toInputValue = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
const fromInputValue = (value: string) => new Date(value).toISOString();

const normalizeCalendars = (calendars: Calendar[]): Calendar[] =>
  calendars.map((calendar) => ({
    ...calendar,
    visible: calendar.visible ?? true
  }));

const ensureCalendar = (event: CalendarEvent, calendars: Calendar[]): CalendarEvent => {
  const exists = calendars.some((calendar) => calendar.id === event.calendarId);
  if (exists) {
    return event;
  }
  return {
    ...event,
    calendarId: calendars[0]?.id ?? event.calendarId
  };
};

const AppPage = () => {
  const [store, setStore] = useState<StorageState>(() => loadState());
  const [view, setView] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveState(store);
  }, [store]);

  useEffect(() => {
    if (!store.profiles.find((profile) => profile.id === store.activeProfileId)) {
      setStore((prev) => ({
        ...prev,
        activeProfileId: prev.profiles[0]?.id ?? prev.activeProfileId
      }));
    }
  }, [store]);

  const activeProfile = useMemo(() => {
    return store.profiles.find((profile) => profile.id === store.activeProfileId) ?? store.profiles[0];
  }, [store]);

  const updateActiveProfile = (updater: (profile: Profile) => Profile) => {
    setStore((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) =>
        profile.id === prev.activeProfileId ? updater(profile) : profile
      )
    }));
  };

  const handleProfileChange = (id: string) => {
    setStore((prev) => ({ ...prev, activeProfileId: id }));
  };

  const handleCreateProfile = () => {
    const name = window.prompt('Profile name');
    if (!name) {
      return;
    }
    const profile = createSeedProfile(name.trim());
    setStore((prev) => ({
      ...prev,
      profiles: [...prev.profiles, profile],
      activeProfileId: profile.id
    }));
  };

  const handleResetProfile = () => {
    if (!activeProfile) {
      return;
    }
    const confirmed = window.confirm('Reset this profile back to default calendars and events?');
    if (!confirmed) {
      return;
    }
    updateActiveProfile(resetProfileData);
  };

  const handleToggleCalendar = (id: string) => {
    updateActiveProfile((profile) => ({
      ...profile,
      calendars: profile.calendars.map((calendar) =>
        calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar
      )
    }));
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
      title
    };

    updateActiveProfile((profile) => {
      const existingIndex = profile.events.findIndex((event) => event.id === eventId);
      if (existingIndex >= 0) {
        const events = [...profile.events];
        events[existingIndex] = nextEvent;
        return { ...profile, events };
      }
      return { ...profile, events: [...profile.events, nextEvent] };
    });
    setDraft(null);
  };

  const handleDeleteEvent = () => {
    if (!draft?.id) {
      setDraft(null);
      return;
    }
    updateActiveProfile((profile) => ({
      ...profile,
      events: profile.events.filter((event) => event.id !== draft.id)
    }));
    setDraft(null);
  };

  const handleCreateDraft = (start: Date, end: Date, calendarId?: string) => {
    if (!activeProfile) {
      return;
    }
    const calendar = calendarId ?? activeProfile.calendars[0]?.id;
    setDraft({
      title: '',
      start: start.toISOString(),
      end: end.toISOString(),
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
    const event = activeProfile?.events.find((item) => item.id === id);
    if (event) {
      setDraft({ ...event });
    }
  };

  const handleEventChange = (id: string, start: Date, end: Date) => {
    updateActiveProfile((profile) => ({
      ...profile,
      events: profile.events.map((event) =>
        event.id === id
          ? {
              ...event,
              start: start.toISOString(),
              end: end.toISOString()
            }
          : event
      )
    }));
  };

  const handleExport = () => {
    if (!activeProfile) {
      return;
    }
    const blob = new Blob([JSON.stringify(activeProfile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProfile.name.toLowerCase().replace(/\s+/g, '-')}-nullcal.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    if (!activeProfile) {
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Partial<Profile>;
      if (!data.calendars || !data.events) {
        throw new Error('Invalid profile data');
      }
      const calendars = normalizeCalendars(data.calendars as Calendar[]);
      const events = (data.events as CalendarEvent[]).map((event) => ensureCalendar(event, calendars));
      updateActiveProfile((profile) => ({
        ...profile,
        name: data.name ?? profile.name,
        calendars,
        events
      }));
    } catch {
      window.alert('Import failed. Please select a valid profile JSON export.');
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

  const visibleCalendarIds = useMemo(() => {
    return activeProfile?.calendars.filter((calendar) => calendar.visible).map((calendar) => calendar.id) ?? [];
  }, [activeProfile]);

  const filteredEvents = useMemo(() => {
    if (!activeProfile) {
      return [];
    }
    const term = search.trim().toLowerCase();
    return activeProfile.events.filter((event) => {
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
      const calendar = activeProfile.calendars.find((item) => item.id === event.calendarId);
      return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        backgroundColor: '#f6f7fb',
        borderColor: calendar?.color ?? '#f6f7fb',
        textColor: '#121620',
        extendedProps: {
          accentColor: calendar?.color ?? '#f6f7fb'
        }
      };
    });
  }, [activeProfile, filteredEvents]);

  if (!activeProfile) {
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
            onPrev={handlePrev}
            onNext={handleNext}
            search={search}
            onSearchChange={setSearch}
            profiles={store.profiles.map((profile) => ({ id: profile.id, name: profile.name }))}
            activeProfileId={activeProfile.id}
            onProfileChange={handleProfileChange}
            onCreateProfile={handleCreateProfile}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        sidebar={
          <SideBar
            selectedDate={currentDate}
            onSelectDate={setCurrentDate}
            calendars={activeProfile.calendars}
            onToggleCalendar={handleToggleCalendar}
            onNewEvent={() => handleCreateDraft(startOfHour(new Date()), addHours(startOfHour(new Date()), 1))}
            onExport={handleExport}
            onImport={handleImport}
            onResetProfile={handleResetProfile}
          />
        }
      >
        <div className="mb-4 flex items-center justify-between text-xs text-white/60">
          <div className="uppercase tracking-[0.3em]">{format(currentDate, 'MMMM yyyy')}</div>
          <div className="text-[11px]">{filteredEvents.length} events</div>
        </div>
        <CalendarView
          events={calendarEvents}
          view={view}
          date={currentDate}
          onDateChange={setCurrentDate}
          onSelectRange={handleSelectRange}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onEventChange={handleEventChange}
        />
      </AppShell>
      <Modal title={draft?.id ? 'Edit event' : 'New event'} open={Boolean(draft)} onClose={() => setDraft(null)}>
        {draft && (
          <div className="grid gap-4">
            <label className="text-xs text-white/60">
              Title
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-white/60">
                Start
                <input
                  type="datetime-local"
                  value={toInputValue(draft.start)}
                  onChange={(event) => setDraft({ ...draft, start: fromInputValue(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs text-white/60">
                End
                <input
                  type="datetime-local"
                  value={toInputValue(draft.end)}
                  onChange={(event) => setDraft({ ...draft, end: fromInputValue(event.target.value) })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
              </label>
            </div>
            <label className="text-xs text-white/60">
              Calendar
              <select
                value={draft.calendarId}
                onChange={(event) => setDraft({ ...draft, calendarId: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {activeProfile.calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id} className="bg-[#0f141b]">
                    {calendar.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-white/60">
              Location
              <input
                value={draft.location ?? ''}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-white/60">
              Notes
              <textarea
                value={draft.notes ?? ''}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                className="mt-1 min-h-[90px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="flex items-center justify-between">
              <button
                onClick={handleDeleteEvent}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:text-white"
              >
                {draft.id ? 'Delete' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEvent}
                className="rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-glow transition hover:bg-accentSoft"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal title="Settings" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="grid gap-3 text-sm text-white/70">
          <p>Profile: <span className="text-white">{activeProfile.name}</span></p>
          <p>Profiles stored locally under <span className="text-white">nullcal:v1</span>.</p>
          <button
            onClick={() => {
              setSettingsOpen(false);
              handleResetProfile();
            }}
            className="mt-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:text-white"
          >
            Reset profile data
          </button>
        </div>
      </Modal>
    </>
  );
};

export default AppPage;
