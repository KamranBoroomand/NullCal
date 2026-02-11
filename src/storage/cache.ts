import type { AppSettings, AppState, Profile, SecurityPrefs } from './types';
import { safeLocalStorage } from './safeStorage';

type CachedState = {
  cachedAt: string;
  payload: AppState;
};

const CACHE_KEY = 'nullcal:cache';

const sanitizedSecurityPrefs: SecurityPrefs = {
  id: 'security',
  pinEnabled: false,
  decoyPinEnabled: false,
  localAuthEnabled: false,
  webAuthnEnabled: false,
  biometricCredentialId: undefined,
  totpEnabled: false,
  totpSecret: undefined
};

const sanitizeProfile = (profile: Profile): Profile => ({
  id: profile.id,
  name: profile.name,
  displayName: profile.displayName,
  avatarEmoji: profile.avatarEmoji,
  avatarColor: profile.avatarColor,
  createdAt: profile.createdAt
});

const sanitizeSettings = (settings: AppSettings): AppSettings => ({
  ...settings,
  syncShareToken: undefined,
  twoFactorDestination: undefined,
  notificationEmail: undefined,
  notificationPhone: undefined,
  telegramBotToken: undefined,
  telegramChatId: undefined,
  signalWebhookUrl: undefined,
  notesShareToken: undefined
});

const sanitizeForCache = (state: AppState): AppState => ({
  ...state,
  profiles: state.profiles.map(sanitizeProfile),
  events: [],
  templates: [],
  settings: sanitizeSettings(state.settings),
  securityPrefs: sanitizedSecurityPrefs
});

export const readCachedState = (ttlMinutes: number | undefined): AppState | null => {
  const raw = safeLocalStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as CachedState;
    if (!parsed?.payload) {
      return null;
    }
    if (ttlMinutes && ttlMinutes > 0) {
      const ageMs = Date.now() - new Date(parsed.cachedAt).getTime();
      if (ageMs > ttlMinutes * 60 * 1000) {
        safeLocalStorage.removeItem(CACHE_KEY);
        return null;
      }
    }
    return parsed.payload;
  } catch {
    return null;
  }
};

export const writeCachedState = (state: AppState, ttlMinutes: number | undefined) => {
  const payload: CachedState = {
    cachedAt: new Date().toISOString(),
    payload: sanitizeForCache(state)
  };
  safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  if (!ttlMinutes || ttlMinutes <= 0) {
    return;
  }
  // allow consumers to invalidate based on ttl
};

export const clearCachedState = () => {
  safeLocalStorage.removeItem(CACHE_KEY);
};
