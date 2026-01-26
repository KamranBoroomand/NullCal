import { createSeedProfile, createSeedCalendars, createSeedEvents } from './seed';
import type { Profile, StorageState } from './types';

const STORAGE_KEY = 'nullcal:v1';

const isStorageState = (value: unknown): value is StorageState => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const state = value as StorageState;
  return state.version === 1 && Array.isArray(state.profiles) && typeof state.activeProfileId === 'string';
};

export const createDefaultState = (): StorageState => {
  const profile = createSeedProfile('Guest');
  return {
    version: 1,
    profiles: [profile],
    activeProfileId: profile.id
  };
};

export const loadState = (): StorageState => {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as StorageState;
    if (!isStorageState(parsed)) {
      throw new Error('Invalid storage');
    }
    return parsed;
  } catch {
    const initial = createDefaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
};

export const saveState = (state: StorageState) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetProfileData = (profile: Profile): Profile => {
  const calendars = createSeedCalendars();
  return {
    ...profile,
    calendars,
    events: createSeedEvents(calendars)
  };
};
