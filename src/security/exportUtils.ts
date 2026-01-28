import type { AppSettings, AppState, CalendarEvent, SecurityPrefs } from '../storage/types';

export type ExportMode = 'full' | 'clean' | 'minimal';

type ExportOptions = {
  mode: ExportMode;
  keepTitles?: boolean;
};

const buildCleanEvent = (event: CalendarEvent, keepTitles: boolean) => ({
  ...event,
  title: keepTitles ? event.title : 'Busy',
  location: undefined,
  notes: undefined
});

const buildMinimalEvent = (event: CalendarEvent) => ({
  id: event.id,
  profileId: event.profileId,
  calendarId: event.calendarId,
  title: '',
  start: event.start,
  end: event.end
});

const normalizeSettingsForExport = (settings: AppSettings, activeProfileId: string): AppSettings => ({
  ...settings,
  activeProfileId,
  primaryProfileId: activeProfileId,
  decoyProfileId: undefined
});

const normalizeSecurityForExport = (security: SecurityPrefs): SecurityPrefs => ({
  ...security,
  pinEnabled: security.pinEnabled ?? false,
  decoyPinEnabled: security.decoyPinEnabled ?? false
});

export const buildExportPayload = (
  state: AppState,
  activeProfileId: string,
  options: ExportOptions
): AppState => {
  const profile = state.profiles.find((item) => item.id === activeProfileId) ?? state.profiles[0];
  const profileId = profile?.id ?? activeProfileId;
  const calendars = state.calendars.filter((calendar) => calendar.profileId === profileId);
  const events = state.events.filter((event) => event.profileId === profileId);
  const keepTitles = options.keepTitles ?? false;

  const sanitizedEvents =
    options.mode === 'full'
      ? events
      : options.mode === 'clean'
      ? events.map((event) => buildCleanEvent(event, keepTitles))
      : events.map(buildMinimalEvent);

  return {
    profiles: profile ? [profile] : [],
    calendars,
    events: sanitizedEvents,
    settings: normalizeSettingsForExport(state.settings, profileId),
    securityPrefs: normalizeSecurityForExport(state.securityPrefs)
  };
};

export const validateExportPayload = (payload: AppState) => {
  if (!payload.profiles.length || !payload.settings || !payload.securityPrefs) {
    throw new Error('Invalid export payload');
  }
  if (!payload.settings.activeProfileId) {
    throw new Error('Missing active profile');
  }
};
