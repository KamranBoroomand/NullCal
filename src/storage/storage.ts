import { nanoid } from 'nanoid';
import { DB_NAME, openNullCalDB } from './db';
import { createSeedCalendars, createSeedProfile } from './seed';
import type {
  AppSettings,
  AppState,
  Calendar,
  CalendarEvent,
  Profile,
  SecurityPrefs
} from './types';
import { safeLocalStorage } from './safeStorage';
import { DEFAULT_THEME_BY_MODE, resolveThemeModeFromPalette } from '../theme/themePacks';

const LEGACY_KEY = 'nullcal:v1';
const PALETTE_KEY = 'nullcal:palette';
const avatarPalette = ['#f4ff00', '#9bff00', '#6b7cff', '#38f5c8', '#ff6b3d', '#ff4d8d', '#ffd166'];
const avatarEmojis = ['🛰️', '🌒', '🗂️', '🧭', '🧠', '⚡️', '🧪'];

const readPalette = () => {
  const value = safeLocalStorage.getItem(PALETTE_KEY);
  if (!value) {
    return DEFAULT_THEME_BY_MODE.dark;
  }
  return value;
};

const buildDefaultSettings = (activeProfileId: string): AppSettings => {
  const palette = readPalette();
  const savedTheme = safeLocalStorage.getItem('nullcal:theme') as 'dark' | 'light' | null;
  const theme = resolveThemeModeFromPalette(palette, savedTheme === 'light' ? 'light' : 'dark');
  return {
    id: 'app',
    theme,
    palette,
    language: 'en',
    activeProfileId,
    primaryProfileId: activeProfileId,
    decoyProfileId: undefined,
    networkLock: true,
    secureMode: false,
    blurSensitive: false,
    scanlines: true,
    autoLockMinutes: 10,
    autoLockOnBlur: false,
    autoLockGraceSeconds: 0,
    switchToDecoyOnBlur: false,
    privacyScreenHotkeyEnabled: true,
    syncStrategy: 'offline',
    syncTrustedDevices: false,
    syncShareToken: undefined,
    tamperProofLog: false,
    twoFactorEnabled: false,
    twoFactorMode: 'otp',
    twoFactorChannel: 'email',
    twoFactorDestination: undefined,
    biometricEnabled: false,
    encryptedNotes: false,
    encryptedAttachments: false,
    encryptedSharingEnabled: false,
    eventObfuscation: false,
    reminderChannel: 'local',
    remindersEnabled: false,
    notificationEmail: undefined,
    notificationPhone: undefined,
    telegramBotToken: undefined,
    telegramChatId: undefined,
    signalWebhookUrl: undefined,
    collaborationMode: 'private',
    collaborationEnabled: false,
    notesShareToken: undefined,
    highContrast: false,
    textScale: 1,
    keyboardNavigation: true,
    cacheEnabled: false,
    cacheTtlMinutes: 30,
    additionalTimeZones: []
  };
};

const defaultSecurityPrefs: SecurityPrefs = {
  id: 'security',
  pinEnabled: false,
  decoyPinEnabled: false,
  localAuthEnabled: false,
  webAuthnEnabled: false,
  biometricCredentialId: undefined,
  totpEnabled: false,
  totpSecret: undefined
};

const normalizeCalendars = (calendars: Calendar[]): Calendar[] =>
  calendars.map((calendar) => {
    const legacyVisible = (calendar as Calendar & { visible?: boolean }).visible;
    return {
      ...calendar,
      isVisible: calendar.isVisible ?? legacyVisible ?? true,
      createdAt: calendar.createdAt ?? new Date().toISOString()
    };
  });

const pickAvatar = (name: string) => {
  const seed = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    avatarColor: avatarPalette[seed % avatarPalette.length],
    avatarEmoji: avatarEmojis[seed % avatarEmojis.length]
  };
};

const normalizeProfiles = (profiles: Profile[]) =>
  profiles.map((profile) => ({
    ...profile,
    displayName: profile.displayName ?? profile.name,
    ...(!profile.avatarEmoji || !profile.avatarColor ? pickAvatar(profile.name) : {})
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
  const raw = safeLocalStorage.getItem(LEGACY_KEY);
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
    const profiles: Profile[] = normalizeProfiles(
      parsed.profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        createdAt: new Date().toISOString()
      }))
    );
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
      templates: [],
      settings,
      securityPrefs: defaultSecurityPrefs
    };
  } catch {
    return null;
  }
};

export const loadAppState = async (): Promise<AppState> => {
  const db = await openNullCalDB();
  const profiles = normalizeProfiles(await db.getAll('profiles'));
  const calendars = normalizeCalendars(await db.getAll('calendars'));
  const events = await db.getAll('events');
  const templates = await db.getAll('templates');
  const settings = await db.get('settings', 'app');
  const securityPrefs = await db.get('securityPrefs', 'security');

  if (profiles.length) {
    const resolvedSettings = settings ?? buildDefaultSettings(profiles[0].id);
    const normalizedSettings = {
      ...resolvedSettings,
      networkLock: resolvedSettings.networkLock ?? true,
      palette: resolvedSettings.palette ?? readPalette(),
      primaryProfileId: resolvedSettings.primaryProfileId ?? resolvedSettings.activeProfileId,
      autoLockOnBlur: resolvedSettings.autoLockOnBlur ?? false,
      autoLockGraceSeconds: resolvedSettings.autoLockGraceSeconds ?? 0,
      switchToDecoyOnBlur: resolvedSettings.switchToDecoyOnBlur ?? false,
      privacyScreenHotkeyEnabled: resolvedSettings.privacyScreenHotkeyEnabled ?? true,
      syncStrategy: resolvedSettings.syncStrategy ?? 'offline',
      syncTrustedDevices: resolvedSettings.syncTrustedDevices ?? false,
      syncShareToken: resolvedSettings.syncShareToken ?? undefined,
      tamperProofLog: resolvedSettings.tamperProofLog ?? false,
      twoFactorEnabled: resolvedSettings.twoFactorEnabled ?? false,
      twoFactorMode: resolvedSettings.twoFactorMode ?? 'otp',
      twoFactorChannel: resolvedSettings.twoFactorChannel ?? 'email',
      twoFactorDestination: resolvedSettings.twoFactorDestination ?? undefined,
      biometricEnabled: resolvedSettings.biometricEnabled ?? false,
      encryptedNotes: resolvedSettings.encryptedNotes ?? false,
      encryptedAttachments: resolvedSettings.encryptedAttachments ?? false,
      encryptedSharingEnabled: resolvedSettings.encryptedSharingEnabled ?? false,
      eventObfuscation: resolvedSettings.eventObfuscation ?? false,
      reminderChannel: resolvedSettings.reminderChannel ?? 'local',
      remindersEnabled: resolvedSettings.remindersEnabled ?? false,
      notificationEmail: resolvedSettings.notificationEmail ?? resolvedSettings.twoFactorDestination ?? undefined,
      notificationPhone: resolvedSettings.notificationPhone ?? resolvedSettings.twoFactorDestination ?? undefined,
      telegramBotToken: resolvedSettings.telegramBotToken ?? undefined,
      telegramChatId: resolvedSettings.telegramChatId ?? undefined,
      signalWebhookUrl: resolvedSettings.signalWebhookUrl ?? undefined,
      collaborationMode: resolvedSettings.collaborationMode ?? 'private',
      collaborationEnabled: resolvedSettings.collaborationEnabled ?? false,
      notesShareToken: resolvedSettings.notesShareToken ?? undefined,
      highContrast: resolvedSettings.highContrast ?? false,
      textScale: resolvedSettings.textScale ?? 1,
      keyboardNavigation: resolvedSettings.keyboardNavigation ?? true,
      cacheEnabled: resolvedSettings.cacheEnabled ?? false,
      cacheTtlMinutes: resolvedSettings.cacheTtlMinutes ?? 30,
      language: resolvedSettings.language ?? 'en',
      additionalTimeZones: resolvedSettings.additionalTimeZones ?? []
    };
    const activeProfileExists = profiles.some((profile) => profile.id === resolvedSettings.activeProfileId);
    const decoyProfileExists = profiles.some((profile) => profile.id === resolvedSettings.decoyProfileId);
    return {
      profiles,
      calendars,
      events,
      templates,
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
    templates: [],
    settings: buildDefaultSettings(profile.id),
    securityPrefs: defaultSecurityPrefs
  };
  await saveAppState(state);
  return state;
};

export const saveAppState = async (state: AppState) => {
  const db = await openNullCalDB();
  const tx = db.transaction(
    ['profiles', 'calendars', 'events', 'templates', 'settings', 'securityPrefs'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('profiles').clear(),
    tx.objectStore('calendars').clear(),
    tx.objectStore('events').clear(),
    tx.objectStore('templates').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('securityPrefs').clear()
  ]);
  await Promise.all([
    ...state.profiles.map((profile) => tx.objectStore('profiles').put(profile)),
    ...state.calendars.map((calendar) => tx.objectStore('calendars').put(calendar)),
    ...state.events.map((event) => tx.objectStore('events').put(event)),
    ...state.templates.map((template) => tx.objectStore('templates').put(template)),
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
  safeLocalStorage.clear();
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
};
