import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createSeedCalendars, createSeedProfile } from '../storage/seed';
import {
  createCalendar as buildCalendar,
  deleteCalendar as deleteCalendarFromState,
  loadAppState,
  recolorCalendar as recolorCalendarInState,
  renameCalendar as renameCalendarInState,
  saveAppState,
  wipeAllData
} from '../storage/storage';
import type { AppSettings, AppState, CalendarEvent, SecurityPrefs } from '../storage/types';
import { applyNetworkLock } from '../security/networkLock';
import { hashPin, verifyPin } from '../security/pin';
import { decryptPayload, encryptPayload, type EncryptedPayload } from '../security/encryption';

type AppStoreContextValue = {
  state: AppState | null;
  loading: boolean;
  locked: boolean;
  lockNow: () => void;
  unlock: (pin?: string) => Promise<boolean>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateSecurityPrefs: (updates: Partial<SecurityPrefs>) => void;
  setActiveProfile: (id: string) => void;
  createProfile: (name: string) => void;
  resetProfile: (profileId: string) => void;
  updateProfileName: (profileId: string, name: string) => void;
  createCalendar: (profileId: string, payload: { name: string; color: string }) => void;
  renameCalendar: (profileId: string, calendarId: string, name: string) => void;
  recolorCalendar: (profileId: string, calendarId: string, color: string) => void;
  deleteCalendar: (profileId: string, calendarId: string) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  upsertEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  replaceState: (next: AppState) => void;
  panicWipe: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  exportEncrypted: (passphrase: string) => Promise<EncryptedPayload>;
  importEncrypted: (payload: EncryptedPayload, passphrase: string) => Promise<void>;
};

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const autoLockTimer = useRef<number | null>(null);

  useEffect(() => {
    loadAppState()
      .then((data) => {
        setState(data);
        setLocked(Boolean(data.securityPrefs.pinEnabled));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (!state) {
      return;
    }
    applyNetworkLock(true);
  }, [state]);

  useEffect(() => {
    if (!state) {
      return;
    }
    const scanlinesEnabled = state.settings.scanlines && state.settings.theme === 'dark';
    document.body.classList.toggle('scanlines-on', scanlinesEnabled);
  }, [state?.settings.scanlines, state?.settings.theme]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (!state.securityPrefs.pinEnabled) {
      setLocked(false);
    }
  }, [state?.securityPrefs.pinEnabled]);

  useEffect(() => {
    if (!state) {
      return;
    }
    const minutes = state.settings.autoLockMinutes;
    if (minutes <= 0) {
      return;
    }
    const resetTimer = () => {
      if (autoLockTimer.current) {
        window.clearTimeout(autoLockTimer.current);
      }
      autoLockTimer.current = window.setTimeout(() => {
        setLocked(true);
      }, minutes * 60 * 1000);
    };
    const handleActivity = () => {
      if (!locked) {
        resetTimer();
      }
    };
    resetTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      if (autoLockTimer.current) {
        window.clearTimeout(autoLockTimer.current);
      }
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [state?.settings.autoLockMinutes, locked]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
          networkLock: true
        }
      };
    });
  }, []);

  const updateSecurityPrefs = useCallback((updates: Partial<SecurityPrefs>) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        securityPrefs: {
          ...prev.securityPrefs,
          ...updates
        }
      };
    });
  }, []);

  const setActiveProfile = useCallback(
    (id: string) => updateSettings({ activeProfileId: id }),
    [updateSettings]
  );

  const createProfile = useCallback((name: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const profile = createSeedProfile(name);
      const calendars = createSeedCalendars(profile.id);
      return {
        ...prev,
        profiles: [...prev.profiles, profile],
        calendars: [...prev.calendars, ...calendars],
        events: prev.events,
        settings: {
          ...prev.settings,
          activeProfileId: profile.id
        }
      };
    });
  }, []);

  const resetProfile = useCallback((profileId: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const calendars = createSeedCalendars(profileId);
      return {
        ...prev,
        calendars: [...prev.calendars.filter((item) => item.profileId !== profileId), ...calendars],
        events: prev.events.filter((item) => item.profileId !== profileId)
      };
    });
  }, []);

  const updateProfileName = useCallback((profileId: string, name: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === profileId ? { ...profile, name } : profile
        )
      };
    });
  }, []);

  const createCalendar = useCallback((profileId: string, payload: { name: string; color: string }) => {
    const calendar = buildCalendar(profileId, payload);
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        calendars: [...prev.calendars, calendar]
      };
    });
  }, []);

  const renameCalendar = useCallback((profileId: string, calendarId: string, name: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        calendars: renameCalendarInState(profileId, calendarId, name, prev.calendars)
      };
    });
  }, []);

  const recolorCalendar = useCallback((profileId: string, calendarId: string, color: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        calendars: recolorCalendarInState(profileId, calendarId, color, prev.calendars)
      };
    });
  }, []);

  const deleteCalendar = useCallback((profileId: string, calendarId: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const next = deleteCalendarFromState(profileId, calendarId, prev.calendars, prev.events);
      return {
        ...prev,
        calendars: next.calendars,
        events: next.events
      };
    });
  }, []);

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        calendars: prev.calendars.map((calendar) =>
          calendar.id === calendarId ? { ...calendar, isVisible: !calendar.isVisible } : calendar
        )
      };
    });
  }, []);

  const upsertEvent = useCallback((event: CalendarEvent) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const existing = prev.events.find((item) => item.id === event.id);
      if (!existing) {
        return {
          ...prev,
          events: [...prev.events, event]
        };
      }
      return {
        ...prev,
        events: prev.events.map((item) => (item.id === event.id ? event : item))
      };
    });
  }, []);

  const deleteEvent = useCallback((eventId: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        events: prev.events.filter((event) => event.id !== eventId)
      };
    });
  }, []);

  const lockNow = useCallback(() => {
    setLocked(true);
  }, []);

  const unlock = useCallback(
    async (pin?: string) => {
      if (!state) {
        return false;
      }
      if (!state.securityPrefs.pinEnabled) {
        setLocked(false);
        return true;
      }
      if (!pin || !state.securityPrefs.pinHash || !state.securityPrefs.pinSalt) {
        return false;
      }
      const ok = await verifyPin(pin, {
        hash: state.securityPrefs.pinHash,
        salt: state.securityPrefs.pinSalt,
        iterations: state.securityPrefs.pinIterations ?? 90000
      });
      if (ok) {
        setLocked(false);
      }
      return ok;
    },
    [state]
  );

  const setPin = useCallback(
    async (pin: string) => {
      const hashed = await hashPin(pin);
      updateSecurityPrefs({
        pinEnabled: true,
        pinHash: hashed.hash,
        pinSalt: hashed.salt,
        pinIterations: hashed.iterations
      });
      setLocked(true);
    },
    [updateSecurityPrefs]
  );

  const clearPin = useCallback(() => {
    updateSecurityPrefs({
      pinEnabled: false,
      pinHash: undefined,
      pinSalt: undefined,
      pinIterations: undefined
    });
    setLocked(false);
  }, [updateSecurityPrefs]);

  const replaceState = useCallback((next: AppState) => {
    setState(next);
  }, []);

  const exportEncrypted = useCallback(
    async (passphrase: string) => {
      if (!state) {
        throw new Error('No data available');
      }
      const exportedAt = new Date().toISOString();
      const payload = await encryptPayload(
        {
          ...state,
          exportedAt
        },
        passphrase
      );
      updateSettings({ lastExportAt: exportedAt });
      return payload;
    },
    [state, updateSettings]
  );

  const importEncrypted = useCallback(
    async (payload: EncryptedPayload, passphrase: string) => {
      const decrypted = (await decryptPayload(payload, passphrase)) as AppState & {
        exportedAt?: string;
      };
      if (!decrypted.profiles || !decrypted.settings || !decrypted.securityPrefs) {
        throw new Error('Invalid backup');
      }
      const activeProfileExists = decrypted.profiles.some(
        (profile) => profile.id === decrypted.settings.activeProfileId
      );
      const settings = {
        ...decrypted.settings,
        activeProfileId: activeProfileExists
          ? decrypted.settings.activeProfileId
          : decrypted.profiles[0]?.id ?? decrypted.settings.activeProfileId
      };
      setState({
        profiles: decrypted.profiles,
        calendars: decrypted.calendars ?? [],
        events: decrypted.events ?? [],
        settings,
        securityPrefs: decrypted.securityPrefs
      });
      setLocked(Boolean(decrypted.securityPrefs.pinEnabled));
    },
    []
  );

  const panicWipe = useCallback(async () => {
    setState(null);
    setLocked(false);
    window.sessionStorage.setItem('nullcal:wiped', '1');
    await wipeAllData();
    const base = import.meta.env.BASE_URL ?? '/';
    window.location.assign(`${base}safety?wiped=1`);
  }, []);

  const contextValue = useMemo<AppStoreContextValue>(
    () => ({
      state,
      loading,
      locked,
      lockNow,
      unlock,
      updateSettings,
      updateSecurityPrefs,
      setActiveProfile,
      createProfile,
      resetProfile,
      updateProfileName,
      createCalendar,
      renameCalendar,
      recolorCalendar,
      deleteCalendar,
      toggleCalendarVisibility,
      upsertEvent,
      deleteEvent,
      replaceState,
      panicWipe,
      setPin,
      clearPin,
      exportEncrypted,
      importEncrypted
    }),
    [
      state,
      loading,
      locked,
      lockNow,
      unlock,
      updateSettings,
      updateSecurityPrefs,
      setActiveProfile,
      createProfile,
      resetProfile,
      updateProfileName,
      createCalendar,
      renameCalendar,
      recolorCalendar,
      deleteCalendar,
      toggleCalendarVisibility,
      upsertEvent,
      deleteEvent,
      replaceState,
      panicWipe,
      setPin,
      clearPin,
      exportEncrypted,
      importEncrypted
    ]
  );

  return <AppStoreContext.Provider value={contextValue}>{children}</AppStoreContext.Provider>;
};

export const useAppStore = () => {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return ctx;
};
