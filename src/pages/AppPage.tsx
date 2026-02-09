import { useEffect, useMemo, useState } from 'react';
import { addHours, addMinutes, addMonths, addWeeks, format, startOfHour, subMonths, subWeeks } from 'date-fns';
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
import RouteErrorBoundary from '../components/RouteErrorBoundary';
import { decryptNote, encryptNote, encryptPayload, isEncryptedNote } from '../security/encryption';
import { buildExportPayload, validateExportPayload } from '../security/exportUtils';
import type { AppSettings } from '../storage/types';
import { formatReminderRule, parseReminderRule } from '../reminders/reminderRules';
import { useTranslations } from '../i18n/useTranslations';

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
    createTemplate,
    deleteTemplate,
    importEncrypted
  } =
    useAppStore();
  const { notify } = useToast();
  const [view, setView] = useState<'timeGridWeek' | 'dayGridMonth'>('timeGridWeek');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteEncryptionArmed, setNoteEncryptionArmed] = useState(false);
  const [notePassphrase, setNotePassphrase] = useState('');
  const [noteConfirm, setNoteConfirm] = useState('');
  const [noteDecryptPassphrase, setNoteDecryptPassphrase] = useState('');
  const [noteError, setNoteError] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateApplyId, setTemplateApplyId] = useState('');
  const [wizardStep, setWizardStep] = useState(0);
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();
  const noteEncrypted = isEncryptedNote(draft?.notes);

  useEffect(() => {
    document.title = 'NullCal — Calendar';
  }, []);

  useEffect(() => {
    if (!draft) {
      setNoteEncryptionArmed(false);
      setNotePassphrase('');
      setNoteConfirm('');
      setNoteDecryptPassphrase('');
      setNoteError('');
      setTemplateName('');
      setTemplateApplyId('');
      setWizardStep(0);
      return;
    }
    setNoteEncryptionArmed(noteEncrypted || Boolean(state?.settings.encryptedNotes));
    setNotePassphrase('');
    setNoteConfirm('');
    setNoteDecryptPassphrase('');
    setNoteError('');
    setTemplateName('');
    setTemplateApplyId('');
    setWizardStep(0);
  }, [draft?.id, noteEncrypted, state?.settings.encryptedNotes]);

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

  const handleSaveEvent = async () => {
    if (!draft || !activeProfile) {
      return;
    }

    const title = draft.title.trim() || 'Untitled event';
    const eventId = draft.id ?? nanoid();
    const notesEncrypted = isEncryptedNote(draft.notes);
    let nextNotes = draft.notes ?? '';
    if (noteEncryptionArmed && nextNotes && !notesEncrypted) {
      if (!notePassphrase || notePassphrase !== noteConfirm) {
        setNoteError('Passphrases do not match.');
        return;
      }
      try {
        nextNotes = await encryptNote(nextNotes, notePassphrase);
      } catch {
        setNoteError('Failed to encrypt note.');
        return;
      }
    }
    const nextEvent: CalendarEvent = {
      ...draft,
      id: eventId,
      profileId: activeProfile.id,
      title,
      notes: nextNotes
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

  const handleRemindersToggle = async (enabled: boolean) => {
    updateSettings({ remindersEnabled: enabled });
    if (!enabled) {
      return;
    }
    if (
      state?.settings.reminderChannel === 'local' ||
      state?.settings.reminderChannel === 'push'
    ) {
      if (typeof Notification === 'undefined') {
        return;
      }
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // Ignore permission errors.
        }
      }
    }
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
      notes: '',
      label: '',
      icon: '',
      reminderRule: '',
      recurrenceRule: '',
      attendees: []
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

  const handleApplyTemplate = (templateId: string) => {
    if (!draft) {
      return;
    }
    setTemplateApplyId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    const start = new Date(draft.start);
    const end = addMinutes(start, template.durationMinutes || 60);
    setDraft({
      ...draft,
      title: template.title,
      location: template.location ?? '',
      notes: template.notes ?? '',
      label: template.label ?? '',
      icon: template.icon ?? '',
      reminderRule: template.reminderRule ?? '',
      recurrenceRule: template.recurrenceRule ?? '',
      attendees: template.attendees ?? [],
      calendarId: template.defaultCalendarId ?? draft.calendarId,
      end: end.toISOString()
    });
  };

  const handleSaveTemplate = () => {
    if (!draft || !activeProfile) {
      return;
    }
    const name = templateName.trim();
    if (!name) {
      notify('Template name is required.', 'error');
      return;
    }
    const durationMinutes = Math.max(
      15,
      Math.round((new Date(draft.end).getTime() - new Date(draft.start).getTime()) / 60000)
    );
    createTemplate({
      profileId: activeProfile.id,
      name,
      title: draft.title || 'Untitled event',
      durationMinutes,
      location: draft.location ?? '',
      notes: draft.notes ?? '',
      label: draft.label ?? '',
      icon: draft.icon ?? '',
      reminderRule: draft.reminderRule ?? '',
      recurrenceRule: draft.recurrenceRule ?? '',
      attendees: draft.attendees ?? [],
      defaultCalendarId: draft.calendarId
    });
    setTemplateName('');
    notify('Template saved.', 'success');
  };

  const handleDecryptNote = async () => {
    if (!draft?.notes || !isEncryptedNote(draft.notes)) {
      return;
    }
    try {
      const decrypted = await decryptNote(draft.notes, noteDecryptPassphrase);
      setDraft({ ...draft, notes: decrypted });
      setNoteDecryptPassphrase('');
      setNoteError('');
    } catch {
      setNoteError('Failed to decrypt note.');
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

  const templates = useMemo(() => {
    if (!activeProfile || !state) {
      return [];
    }
    return state.templates.filter((template) => template.profileId === activeProfile.id);
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
  }, [activeProfile, events, search, visibleCalendarIds]);

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
          accentColor: calendar?.color ?? 'var(--accent)',
          label: event.label,
          icon: event.icon
        }
      };
    });
  }, [calendars, filteredEvents]);

  const reminderOptions = [
    { label: 'At time of event', value: '' },
    { label: '5 minutes before', value: formatReminderRule(5) },
    { label: '15 minutes before', value: formatReminderRule(15) },
    { label: '30 minutes before', value: formatReminderRule(30) },
    { label: '1 hour before', value: formatReminderRule(60) },
    { label: '1 day before', value: formatReminderRule(60 * 24) }
  ];

  const reminderSelection = draft
    ? reminderOptions.some((option) => option.value === (draft.reminderRule ?? ''))
      ? (draft.reminderRule ?? '')
      : 'custom'
    : '';

  const recurrenceOptions = [
    { label: t('wizard.recurrence.none'), value: '' },
    { label: t('wizard.recurrence.daily'), value: 'FREQ=DAILY' },
    { label: t('wizard.recurrence.weekly'), value: 'FREQ=WEEKLY' },
    { label: t('wizard.recurrence.monthly'), value: 'FREQ=MONTHLY' }
  ];
  const recurrenceSelection = draft
    ? recurrenceOptions.some((option) => option.value === (draft.recurrenceRule ?? ''))
      ? (draft.recurrenceRule ?? '')
      : 'custom'
    : '';

  const wizardSteps = [
    t('wizard.basics'),
    t('wizard.schedule'),
    t('wizard.location'),
    t('wizard.attendees'),
    t('wizard.review')
  ];
  const totalSteps = wizardSteps.length;
  const isFirstStep = wizardStep === 0;
  const isLastStep = wizardStep === totalSteps - 1;
  const attendeesValue = draft?.attendees?.join(', ') ?? '';
  const customReminderMinutes = draft ? parseReminderRule(draft.reminderRule) : null;

  if (loading || !activeProfile || !state) {
    return null;
  }

  return (
    <>
      <AppShell
        topBar={
          <TopBar
            variant="minimal"
            view={view}
            onViewChange={setView}
            onToday={handleToday}
            onHome={handleToday}
            onPrev={handlePrev}
            onNext={handleNext}
            search={search}
            onSearchChange={setSearch}
            profiles={state.profiles.map((profile) => ({
              id: profile.id,
              name: profile.displayName ?? profile.name,
              avatarEmoji: profile.avatarEmoji,
              avatarColor: profile.avatarColor,
              avatarUrl: profile.avatarUrl
            }))}
            activeProfileId={activeProfile.id}
            onProfileChange={setActiveProfile}
            onCreateProfile={handleCreateProfile}
            profileSwitchAllowed={true}
            showCreateProfile={true}
            onLockNow={lockNow}
            onOpenNav={() => setNavOpen(true)}
            onCommandAdd={handleCommandAdd}
            onCommandDecoy={handleCommandDecoy}
            onCommandExport={handleCommandExport}
            language={state.settings.language}
            onLanguageChange={(language) => updateSettings({ language })}
            additionalTimeZones={state.settings.additionalTimeZones ?? []}
            onUpdateTimeZones={(zones) => updateSettings({ additionalTimeZones: zones })}
            secureMode={state.settings.secureMode}
            eventObfuscation={state.settings.eventObfuscation}
            encryptedNotes={state.settings.encryptedNotes}
            twoFactorEnabled={state.settings.twoFactorEnabled}
            syncStrategy={state.settings.syncStrategy}
            syncTrustedDevices={state.settings.syncTrustedDevices}
            notificationsCount={0}
          />
        }
        sidebar={
          <SideBar
            calendars={calendars}
            activeProfileId={activeProfile.id}
            activeProfileName={activeProfile.displayName ?? activeProfile.name}
            onToggleCalendar={handleToggleCalendar}
            onCreateCalendar={createCalendar}
            onRenameCalendar={renameCalendar}
            onRecolorCalendar={recolorCalendar}
            onDeleteCalendar={deleteCalendar}
            onNewEvent={() => handleCreateDraft(startOfHour(new Date()), addHours(startOfHour(new Date()), 1))}
            onExport={handleExport}
            onImport={handleImport}
            onResetProfile={handleResetProfile}
            onOpenReminders={() => setRemindersOpen(true)}
            onOpenNotes={() => setNotesOpen(true)}
            onLockNow={lockNow}
          />
        }
        mobileNav={
          <SideBar
            calendars={calendars}
            activeProfileId={activeProfile.id}
            activeProfileName={activeProfile.displayName ?? activeProfile.name}
            variant="drawer"
            onToggleCalendar={handleToggleCalendar}
            onCreateCalendar={createCalendar}
            onRenameCalendar={renameCalendar}
            onRecolorCalendar={recolorCalendar}
            onDeleteCalendar={deleteCalendar}
            onNavigate={() => setNavOpen(false)}
            onOpenReminders={() => setRemindersOpen(true)}
            onOpenNotes={() => setNotesOpen(true)}
            onLockNow={lockNow}
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
                  obfuscateDetails={state.settings.eventObfuscation}
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
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <div className="uppercase tracking-[0.3em]">
                {t('wizard.step')} {wizardStep + 1} / {totalSteps}
              </div>
              <div className="rounded-full border border-grid bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text">
                {wizardSteps[wizardStep]}
              </div>
            </div>

            {wizardStep === 0 && (
              <div className="grid gap-4">
                <label className="text-xs text-muted">
                  {t('wizard.titleLabel')}
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                </label>
                <label className="text-xs text-muted">
                  Template
                  <select
                    value={templateApplyId}
                    onChange={(event) => handleApplyTemplate(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id} className="bg-panel2">
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-muted">
                  {t('wizard.calendarLabel')}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs text-muted">
                    Label
                    <input
                      value={draft.label ?? ''}
                      onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                      placeholder="Focus, Travel, Deep work"
                      className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Icon
                    <input
                      value={draft.icon ?? ''}
                      onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
                      placeholder="🗂️"
                      className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                  </label>
                </div>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs text-muted">
                    {t('wizard.start')}
                    <input
                      type="datetime-local"
                      value={toInputValue(draft.start)}
                      onChange={(event) => setDraft({ ...draft, start: fromInputValue(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <label className="text-xs text-muted">
                    {t('wizard.end')}
                    <input
                      type="datetime-local"
                      value={toInputValue(draft.end)}
                      onChange={(event) => setDraft({ ...draft, end: fromInputValue(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                  </label>
                </div>
                <label className="text-xs text-muted">
                  {t('wizard.recurrence')}
                  <select
                    value={recurrenceSelection}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft({ ...draft, recurrenceRule: value === 'custom' ? '' : value });
                    }}
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  >
                    {recurrenceOptions.map((option) => (
                      <option key={option.value || option.label} value={option.value} className="bg-panel2">
                        {option.label}
                      </option>
                    ))}
                    <option value="custom" className="bg-panel2">
                      {t('wizard.recurrence.custom')}
                    </option>
                  </select>
                  {recurrenceSelection === 'custom' && (
                    <input
                      value={draft.recurrenceRule ?? ''}
                      onChange={(event) => setDraft({ ...draft, recurrenceRule: event.target.value })}
                      placeholder="FREQ=MONTHLY;INTERVAL=1"
                      className="mt-2 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                  )}
                </label>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="grid gap-4">
                <label className="text-xs text-muted">
                  {t('wizard.locationLabel')}
                  <input
                    value={draft.location ?? ''}
                    onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                </label>
                <label className="text-xs text-muted">
                  {t('wizard.reminder')}
                  <select
                    value={reminderSelection}
                    onChange={(event) => {
                      const value = event.target.value;
                      setDraft({ ...draft, reminderRule: value === 'custom' ? '' : value });
                    }}
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  >
                    {reminderOptions.map((option) => (
                      <option key={option.value || option.label} value={option.value} className="bg-panel2">
                        {option.label}
                      </option>
                    ))}
                    <option value="custom" className="bg-panel2">
                      Custom reminder
                    </option>
                  </select>
                  {reminderSelection === 'custom' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={customReminderMinutes ?? ''}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setDraft({
                            ...draft,
                            reminderRule: Number.isFinite(value) ? formatReminderRule(value) : ''
                          });
                        }}
                        placeholder="Minutes before"
                        className="w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                      />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-muted">min</span>
                    </div>
                  )}
                </label>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="grid gap-4">
                <label className="text-xs text-muted">
                  {t('wizard.attendeesLabel')}
                  <input
                    value={attendeesValue}
                    onChange={(event) => {
                      const attendees = event.target.value
                        .split(',')
                        .map((value) => value.trim())
                        .filter(Boolean);
                      setDraft({ ...draft, attendees });
                    }}
                    placeholder="alex@example.com, +1 555 0110"
                    className="mt-1 w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                </label>
                <label className="text-xs text-muted">
                  {t('wizard.notes')}
                  <textarea
                    value={noteEncrypted ? '' : draft.notes ?? ''}
                    onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    placeholder={noteEncrypted ? 'Encrypted note (unlock to view)' : 'Add notes'}
                    readOnly={noteEncrypted}
                    className="mt-1 min-h-[90px] w-full rounded-lg border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                </label>
                <div className="grid gap-3 rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-muted">
                  <label className="flex items-center justify-between gap-3">
                    <span className="uppercase tracking-[0.3em]">Encrypt notes</span>
                    <input
                      type="checkbox"
                      checked={noteEncryptionArmed}
                      onChange={(event) => {
                        setNoteEncryptionArmed(event.target.checked);
                        setNoteError('');
                      }}
                      disabled={noteEncrypted}
                      className="h-4 w-4 rounded border border-grid bg-panel2"
                    />
                  </label>
                  {noteEncrypted ? (
                    <div className="grid gap-2">
                      <input
                        type="password"
                        placeholder="Passphrase to decrypt"
                        value={noteDecryptPassphrase}
                        onChange={(event) => {
                          setNoteDecryptPassphrase(event.target.value);
                          setNoteError('');
                        }}
                        className="w-full rounded-lg border border-grid bg-panel px-3 py-2 text-sm text-text"
                      />
                      <button
                        type="button"
                        onClick={handleDecryptNote}
                        className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
                      >
                        Unlock note
                      </button>
                    </div>
                  ) : noteEncryptionArmed ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="password"
                        placeholder="Passphrase"
                        value={notePassphrase}
                        onChange={(event) => {
                          setNotePassphrase(event.target.value);
                          setNoteError('');
                        }}
                        className="w-full rounded-lg border border-grid bg-panel px-3 py-2 text-sm text-text"
                      />
                      <input
                        type="password"
                        placeholder="Confirm passphrase"
                        value={noteConfirm}
                        onChange={(event) => {
                          setNoteConfirm(event.target.value);
                          setNoteError('');
                        }}
                        className="w-full rounded-lg border border-grid bg-panel px-3 py-2 text-sm text-text"
                      />
                    </div>
                  ) : null}
                  {noteError && <p className="text-xs text-accent">{noteError}</p>}
                  <p className="text-[11px] text-muted">
                    Notes are encrypted locally with AES-GCM before being stored when this toggle is on.
                  </p>
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div className="grid gap-4">
                <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-muted">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted">{t('wizard.review')}</p>
                  <div className="mt-3 grid gap-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">{t('wizard.titleLabel')}</span>
                      <span className="text-text">{draft.title || 'Untitled event'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">{t('wizard.start')}</span>
                      <span className="text-text">{format(new Date(draft.start), 'PPpp')}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">{t('wizard.end')}</span>
                      <span className="text-text">{format(new Date(draft.end), 'PPpp')}</span>
                    </div>
                    {draft.location && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted">{t('wizard.locationLabel')}</span>
                        <span className="text-text">{draft.location}</span>
                      </div>
                    )}
                    {draft.attendees && draft.attendees.length > 0 && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted">{t('wizard.attendees')}</span>
                        <span className="text-text">{draft.attendees.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-muted">{t('wizard.reviewHint')}</p>
                </div>
                <div className="grid gap-3 rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-muted">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-muted">Event templates</p>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <input
                      value={templateName}
                      onChange={(event) => setTemplateName(event.target.value)}
                      placeholder="Template name"
                      className="w-full rounded-lg border border-grid bg-panel px-3 py-2 text-sm text-text"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
                    >
                      Save template
                    </button>
                  </div>
                  {templates.length > 0 && (
                    <div className="grid gap-2">
                      {templates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between text-xs text-muted">
                          <span>{template.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const confirmed = window.confirm(`Delete "${template.name}"?`);
                              if (confirmed) {
                                deleteTemplate(template.id);
                              }
                            }}
                            className="rounded-full border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-text"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted">
                    Templates capture durations, labels, and reminders for quick reuse.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleDeleteEvent}
                className="rounded-full border border-grid px-4 py-2 text-xs text-muted transition hover:text-text"
              >
                {draft.id ? 'Delete' : 'Cancel'}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {!isFirstStep && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                    className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
                  >
                    {t('wizard.back')}
                  </button>
                )}
                {!isLastStep && (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.min(totalSteps - 1, prev + 1))}
                    className="rounded-full bg-panel px-4 py-2 text-xs uppercase tracking-[0.2em] text-text transition hover:border-accent/60"
                  >
                    {t('wizard.next')}
                  </button>
                )}
                {isLastStep && (
                  <button
                    onClick={handleSaveEvent}
                    className="rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] shadow-glow transition"
                  >
                    {t('wizard.finish')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal title="Reminders" open={remindersOpen} onClose={() => setRemindersOpen(false)}>
        <div className="grid gap-3 text-sm text-muted">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Reminders</p>
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-grid bg-panel px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Enable reminders</p>
              <p className="mt-1 text-xs text-muted">Show device notifications for upcoming events.</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.remindersEnabled}
              onChange={(event) => void handleRemindersToggle(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-xs uppercase tracking-[0.3em] text-muted">
            Reminder channel
            <select
              value={state.settings.reminderChannel}
              onChange={(event) =>
                updateSettings({ reminderChannel: event.target.value as AppSettings['reminderChannel'] })
              }
              className="rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
              disabled={!state.settings.remindersEnabled}
            >
              <option value="local" className="bg-panel2">
                Local notifications
              </option>
              <option value="push" className="bg-panel2">
                Push notifications
              </option>
              <option value="email" className="bg-panel2">
                Email notifications
              </option>
              <option value="sms" className="bg-panel2">
                SMS notifications
              </option>
              <option value="signal" className="bg-panel2">
                Signal secure ping
              </option>
              <option value="telegram" className="bg-panel2">
                Telegram secure ping
              </option>
            </select>
          </label>
          {(state.settings.reminderChannel === 'email' || state.settings.reminderChannel === 'sms') && (
            <div className="grid gap-2">
              {state.settings.reminderChannel === 'email' && (
                <input
                  type="email"
                  placeholder="Notification email"
                  value={state.settings.notificationEmail ?? ''}
                  onChange={(event) => updateSettings({ notificationEmail: event.target.value })}
                  className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                  disabled={!state.settings.remindersEnabled}
                />
              )}
              {state.settings.reminderChannel === 'sms' && (
                <input
                  type="tel"
                  placeholder="Notification phone"
                  value={state.settings.notificationPhone ?? ''}
                  onChange={(event) => updateSettings({ notificationPhone: event.target.value })}
                  className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                  disabled={!state.settings.remindersEnabled}
                />
              )}
              <p className="text-[11px] text-muted">
                Uses the configured notification service for real SMS/email delivery.
              </p>
            </div>
          )}
          {state.settings.reminderChannel === 'telegram' && (
            <div className="grid gap-2">
              <input
                type="password"
                placeholder="Telegram bot token"
                value={state.settings.telegramBotToken ?? ''}
                onChange={(event) => updateSettings({ telegramBotToken: event.target.value })}
                className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                disabled={!state.settings.remindersEnabled}
              />
              <input
                type="text"
                placeholder="Telegram chat ID"
                value={state.settings.telegramChatId ?? ''}
                onChange={(event) => updateSettings({ telegramChatId: event.target.value })}
                className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                disabled={!state.settings.remindersEnabled}
              />
            </div>
          )}
          {state.settings.reminderChannel === 'signal' && (
            <input
              type="url"
              placeholder="Signal webhook URL"
              value={state.settings.signalWebhookUrl ?? ''}
              onChange={(event) => updateSettings({ signalWebhookUrl: event.target.value })}
              className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
              disabled={!state.settings.remindersEnabled}
            />
          )}
        </div>
      </Modal>
      <Modal title="Notes" open={notesOpen} onClose={() => setNotesOpen(false)}>
        <div className="grid gap-3 text-sm text-muted">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Private notes</p>
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-grid bg-panel px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted notes by default</p>
              <p className="mt-1 text-xs text-muted">Encrypt notes locally with AES-GCM.</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.encryptedNotes}
              onChange={(event) => updateSettings({ encryptedNotes: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
            />
          </label>
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-grid bg-panel px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted attachments</p>
              <p className="mt-1 text-xs text-muted">Protect files attached to events.</p>
            </div>
            <input
              type="checkbox"
              checked={state.settings.encryptedAttachments}
              onChange={(event) => updateSettings({ encryptedAttachments: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
            />
          </label>
        </div>
      </Modal>
    </>
  );
};

export default AppPage;
