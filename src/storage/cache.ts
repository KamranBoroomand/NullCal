import type { AppState } from './types';
import { safeLocalStorage } from './safeStorage';

type CachedState = {
  cachedAt: string;
  payload: AppState;
};

const CACHE_KEY = 'nullcal:cache';

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
    payload: state
  };
  safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  if (!ttlMinutes || ttlMinutes <= 0) {
    return;
  }
  // allow consumers to invalidate based on ttl
};
