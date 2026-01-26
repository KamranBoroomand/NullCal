import { DB_NAME, openNullCalDB } from './db';
import { createSeedCalendars, createSeedEvents, createSeedProfile } from './seed';
import type { AppSettings, AppState, Calendar, CalendarEvent, Profile, SecurityPrefs } from './types';

const LEGACY_KEY = 'nullcal:v1';

const buildDefaultSettings = (activeProfileId: string): AppSettings => {
  const savedTheme = window.localStorage.getItem('nullcal:theme');
  const theme = savedTheme === 'light' ? 'light' : 'dark';
  return {
    id: 'app',
    theme,
    activeProfileId,
    networkLock: true,
    secureMode: false,
    blurSensitive: false,
    scanlines: true,
    autoLockMinutes: 10
  };
};

const defaultSecurityPrefs: SecurityPrefs = {
  id: 'security',
  pinEnabled: false
};

const normalizeCalendars = (calendars: Calendar[]): Calendar[] =>
  calendars.map((calendar) => ({
    ...calendar,
    visible: calendar.visible ?? true
  }));

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
    return {
      profiles,
      calendars,
      events,
      settings: buildDefaultSettings(parsed.activeProfileId),
      securityPrefs: defaultSecurityPrefs
    };
  } catch {
    return null;
  }
};

export const loadAppState = async (): Promise<AppState> => {
  const db = await openNullCalDB();
  const profiles = await db.getAll('profiles');
  const calendars = await db.getAll('calendars');
  const events = await db.getAll('events');
  const settings = await db.get('settings', 'app');
  const securityPrefs = await db.get('securityPrefs', 'security');

  if (profiles.length) {
    const resolvedSettings = settings ?? buildDefaultSettings(profiles[0].id);
    const activeProfileExists = profiles.some((profile) => profile.id === resolvedSettings.activeProfileId);
    return {
      profiles,
      calendars,
      events,
      settings: activeProfileExists
        ? resolvedSettings
        : { ...resolvedSettings, activeProfileId: profiles[0].id },
      securityPrefs: securityPrefs ?? defaultSecurityPrefs
    };
  }

  const migrated = migrateLegacy();
  if (migrated) {
    await saveAppState(migrated);
    return migrated;
  }

  const profile = createSeedProfile('Agent');
  const seedCalendars = createSeedCalendars(profile.id);
  const seedEvents = createSeedEvents(profile.id, seedCalendars);
  const state: AppState = {
    profiles: [profile],
    calendars: seedCalendars,
    events: seedEvents,
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
};
