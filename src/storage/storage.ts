import { nanoid } from 'nanoid';
import { DB_NAME, openNullCalDB } from './db';
import { createSeedCalendars, createSeedProfile } from './seed';
import type { AppSettings, AppState, Calendar, CalendarEvent, Profile, SecurityPrefs } from './types';

const LEGACY_KEY = 'nullcal:v1';
const COMMAND_STRIP_KEY = 'nullcal:commandStripMode';

const readCommandStripMode = () => {
  const value = window.localStorage.getItem(COMMAND_STRIP_KEY);
  if (value === null) {
    return true;
  }
  return value === '1';
};

const buildDefaultSettings = (activeProfileId: string): AppSettings => {
  const savedTheme = window.localStorage.getItem('nullcal:theme');
  const theme = savedTheme === 'light' ? 'light' : 'dark';
  return {
    id: 'app',
    theme,
    activeProfileId,
    primaryProfileId: activeProfileId,
    decoyProfileId: undefined,
    networkLock: true,
    secureMode: false,
    blurSensitive: false,
    scanlines: true,
    commandStripMode: readCommandStripMode(),
    autoLockMinutes: 10,
    autoLockOnBlur: false,
    autoLockGraceSeconds: 0,
    switchToDecoyOnBlur: false,
    privacyScreenHotkeyEnabled: true
  };
};

const defaultSecurityPrefs: SecurityPrefs = {
  id: 'security',
  pinEnabled: false,
  decoyPinEnabled: false
};

const normalizeCalendars = (calendars: Calendar[]): Calendar[] =>
  calendars.map((calendar) => ({
    ...calendar,
    isVisible: calendar.isVisible ?? calendar.visible ?? true,
    createdAt: calendar.createdAt ?? new Date().toISOString()
  }));

export const createCalendar = (
  profileId: string,
  { name, color }: { name: string; color: string }
): Calendar => ({
  id: nanoid(),
  profileId,
  name,
  color,
  isVisible: true,
  createdAt: new Date().toISOString()
});

export const renameCalendar = (
  profileId: string,
  calendarId: string,
  name: string,
  calendars: Calendar[]
): Calendar[] =>
  calendars.map((calendar) =>
    calendar.id === calendarId && calendar.profileId === profileId ? { ...calendar, name } : calendar
  );

export const recolorCalendar = (
  profileId: string,
  calendarId: string,
  color: string,
  calendars: Calendar[]
): Calendar[] =>
  calendars.map((calendar) =>
    calendar.id === calendarId && calendar.profileId === profileId ? { ...calendar, color } : calendar
  );

export const deleteCalendar = (
  profileId: string,
  calendarId: string,
  calendars: Calendar[],
  events: CalendarEvent[]
): { calendars: Calendar[]; events: CalendarEvent[] } => ({
  calendars: calendars.filter(
    (calendar) => !(calendar.id === calendarId && calendar.profileId === profileId)
  ),
  events: events.filter((event) => event.calendarId !== calendarId)
});

const migrateLegacy = (): AppState | null => {
  const raw = window.localStorage.getItem(LEGACY_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as {
      profiles: Array<{
        id: string;
        name: string;
        calendars: Calendar[];
        events: CalendarEvent[];
      }>;
      activeProfileId: string;
    };
    if (!parsed.profiles?.length) {
      return null;
    }
    const profiles: Profile[] = parsed.profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      createdAt: new Date().toISOString()
    }));
    const calendars = parsed.profiles.flatMap((profile) =>
      normalizeCalendars(profile.calendars).map((calendar) => ({
        ...calendar,
        profileId: profile.id
      }))
    );
    const events = parsed.profiles.flatMap((profile) =>
      profile.events.map((event) => ({
        ...event,
        profileId: profile.id
      }))
    );
    const settings = buildDefaultSettings(parsed.activeProfileId);
    return {
      profiles,
      calendars,
      events,
      settings,
      securityPrefs: defaultSecurityPrefs
    };
  } catch {
    return null;
  }
};

export const loadAppState = async (): Promise<AppState> => {
  const db = await openNullCalDB();
  const profiles = await db.getAll('profiles');
  const calendars = normalizeCalendars(await db.getAll('calendars'));
  const events = await db.getAll('events');
  const settings = await db.get('settings', 'app');
  const securityPrefs = await db.get('securityPrefs', 'security');

  if (profiles.length) {
    const resolvedSettings = settings ?? buildDefaultSettings(profiles[0].id);
    const normalizedSettings = {
      ...resolvedSettings,
      networkLock: true,
      primaryProfileId: resolvedSettings.primaryProfileId ?? resolvedSettings.activeProfileId,
      autoLockOnBlur: resolvedSettings.autoLockOnBlur ?? false,
      autoLockGraceSeconds: resolvedSettings.autoLockGraceSeconds ?? 0,
      switchToDecoyOnBlur: resolvedSettings.switchToDecoyOnBlur ?? false,
      privacyScreenHotkeyEnabled: resolvedSettings.privacyScreenHotkeyEnabled ?? true,
      commandStripMode: resolvedSettings.commandStripMode ?? readCommandStripMode()
    };
    const activeProfileExists = profiles.some((profile) => profile.id === resolvedSettings.activeProfileId);
    const decoyProfileExists = profiles.some((profile) => profile.id === resolvedSettings.decoyProfileId);
    return {
      profiles,
      calendars,
      events,
      settings: activeProfileExists
        ? { ...normalizedSettings, decoyProfileId: decoyProfileExists ? resolvedSettings.decoyProfileId : undefined }
        : {
            ...normalizedSettings,
            activeProfileId: profiles[0].id,
            decoyProfileId: decoyProfileExists ? resolvedSettings.decoyProfileId : undefined
          },
      securityPrefs: {
        ...defaultSecurityPrefs,
        ...securityPrefs
      }
    };
  }

  const migrated = migrateLegacy();
  if (migrated) {
    await saveAppState(migrated);
    return migrated;
  }

  const profile = createSeedProfile('Agent');
  const seedCalendars = createSeedCalendars(profile.id);
  const state: AppState = {
    profiles: [profile],
    calendars: seedCalendars,
    events: [],
    settings: buildDefaultSettings(profile.id),
    securityPrefs: defaultSecurityPrefs
  };
  await saveAppState(state);
  return state;
};

export const saveAppState = async (state: AppState) => {
  const db = await openNullCalDB();
  const tx = db.transaction(['profiles', 'calendars', 'events', 'settings', 'securityPrefs'], 'readwrite');
  await Promise.all([
    tx.objectStore('profiles').clear(),
    tx.objectStore('calendars').clear(),
    tx.objectStore('events').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('securityPrefs').clear()
  ]);
  await Promise.all([
    ...state.profiles.map((profile) => tx.objectStore('profiles').put(profile)),
    ...state.calendars.map((calendar) => tx.objectStore('calendars').put(calendar)),
    ...state.events.map((event) => tx.objectStore('events').put(event)),
    tx.objectStore('settings').put(state.settings),
    tx.objectStore('securityPrefs').put(state.securityPrefs)
  ]);
  await tx.done;
};

export const wipeAllData = async () => {
  const db = await openNullCalDB();
  db.close();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
  window.localStorage.clear();
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
};
