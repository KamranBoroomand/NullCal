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
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import RouteErrorBoundary from '../components/RouteErrorBoundary';
import { encryptPayload } from '../security/encryption';
import { buildExportPayload, validateExportPayload } from '../security/exportUtils';
import { resolveThemeModeFromPalette } from '../theme/themePacks';

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
    createCalendar,
    renameCalendar,
    recolorCalendar,
    deleteCalendar,
    toggleCalendarVisibility,
    upsertEvent,
    deleteEvent,
    importEncrypted
  } =
    useAppStore();
  const { notify } = useToast();
  const [view, setView] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { canInstall, promptInstall } = useInstallPrompt();

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
    const confirmed = window.confirm('Reset this profile back to default calendars (events removed)?');
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
      const payload = buildExportPayload(state, activeProfile.id, { mode: 'clean', keepTitles: false });
      const sanityCheck = JSON.parse(JSON.stringify(payload)) as typeof payload;
      validateExportPayload(sanityCheck);
      const encryptedPayload = await encryptPayload(sanityCheck, passphrase);
      updateSettings({ lastExportAt: new Date().toISOString() });
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: 'application/json' });
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

  const handleCommandExport = async (mode: 'clean' | 'full') => {
    if (!activeProfile || !state) {
      notify('No profile data available to export.', 'error');
      return;
    }
    const passphrase = window.prompt(`Create a passphrase for the ${mode} export.`);
    if (!passphrase) {
      return;
    }
    try {
      const payload = buildExportPayload(state, activeProfile.id, { mode, keepTitles: false });
      const sanityCheck = JSON.parse(JSON.stringify(payload)) as typeof payload;
      validateExportPayload(sanityCheck);
      const encryptedPayload = await encryptPayload(sanityCheck, passphrase);
      updateSettings({ lastExportAt: new Date().toISOString() });
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nullcal-backup-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify(`${mode === 'full' ? 'Full' : 'Clean'} export saved.`, 'success');
    } catch {
      notify('Export failed. Try again.', 'error');
    }
  };

  const handleCommandAdd = () => {
    const start = new Date();
    handleCreateDraft(start, addHours(start, 1));
  };

  const handleCommandDecoy = () => {
    if (!state) {
      notify('No profile data available.', 'error');
      return;
    }
    const decoyId = state.settings.decoyProfileId;
    if (!decoyId) {
      notify('Set a decoy profile in Safety Center.', 'error');
      return;
    }
    if (state.securityPrefs.pinEnabled || state.securityPrefs.decoyPinEnabled) {
      notify('Unlock to switch profiles.', 'error');
      return;
    }
    setActiveProfile(decoyId);
    notify('Switched to decoy profile.', 'success');
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
    return calendars.filter((calendar) => calendar.isVisible).map((calendar) => calendar.id);
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
            profileSwitchAllowed={true}
            showCreateProfile={true}
            onOpenSettings={() => setSettingsOpen(true)}
            onLockNow={lockNow}
            palette={state.settings.palette}
            onPaletteChange={(paletteId, themeMode) =>
              updateSettings({
                palette: paletteId,
                theme: resolveThemeModeFromPalette(paletteId, themeMode)
              })
            }
            onOpenNav={() => setNavOpen(true)}
            onCommandAdd={handleCommandAdd}
            onCommandDecoy={handleCommandDecoy}
            onCommandExport={handleCommandExport}
          />
        }
        sidebar={
          <SideBar
            selectedDate={currentDate}
            onSelectDate={setCurrentDate}
            calendars={calendars}
            activeProfileId={activeProfile.id}
            onToggleCalendar={handleToggleCalendar}
            onCreateCalendar={createCalendar}
            onRenameCalendar={renameCalendar}
            onRecolorCalendar={recolorCalendar}
            onDeleteCalendar={deleteCalendar}
            onNewEvent={() => handleCreateDraft(startOfHour(new Date()), addHours(startOfHour(new Date()), 1))}
            onExport={handleExport}
            onImport={handleImport}
            onResetProfile={handleResetProfile}
          />
        }
        mobileNav={
          <SideBar
            selectedDate={currentDate}
            onSelectDate={setCurrentDate}
            calendars={calendars}
            activeProfileId={activeProfile.id}
            variant="drawer"
            onToggleCalendar={handleToggleCalendar}
            onCreateCalendar={createCalendar}
            onRenameCalendar={renameCalendar}
            onRecolorCalendar={recolorCalendar}
            onDeleteCalendar={deleteCalendar}
            onNavigate={() => setNavOpen(false)}
          />
        }
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}
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
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <RouteErrorBoundary>
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
              </RouteErrorBoundary>
            </div>
          </div>
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
                className="rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] shadow-glow transition"
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
          {canInstall && (
            <button
              onClick={promptInstall}
              className="rounded-full border border-grid px-4 py-2 text-xs text-accent transition hover:text-text"
            >
              Install app
            </button>
          )}
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
