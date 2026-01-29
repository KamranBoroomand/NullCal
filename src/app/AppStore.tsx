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
import { createDecoyCalendars, createSeedCalendars, createSeedProfile } from '../storage/seed';
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
  createDecoyProfile: (name: string) => void;
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
  setDecoyPin: (pin: string) => Promise<void>;
  clearPin: () => void;
  clearDecoyPin: () => void;
  exportEncrypted: (passphrase: string) => Promise<EncryptedPayload>;
  importEncrypted: (payload: EncryptedPayload, passphrase: string) => Promise<void>;
};

const AppStoreContext = createContext<AppStoreContextValue | null>(null);
const baseSecurityPrefs: SecurityPrefs = {
  id: 'security',
  pinEnabled: false,
  decoyPinEnabled: false
};

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const autoLockTimer = useRef<number | null>(null);
  const blurLockTimer = useRef<number | null>(null);
  const lockNow = useCallback(() => {
    setLocked(true);
  }, []);
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

  useEffect(() => {
    loadAppState()
      .then((data) => {
        setState(data);
        setLocked(Boolean(data.securityPrefs.pinEnabled || data.securityPrefs.decoyPinEnabled));
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
    const enabled = state.settings.commandStripMode;
    document.documentElement.classList.toggle('cmdstrip', enabled);
    window.localStorage.setItem('nullcal:commandStripMode', enabled ? '1' : '0');
  }, [state?.settings.commandStripMode]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (!state.securityPrefs.pinEnabled && !state.securityPrefs.decoyPinEnabled) {
      setLocked(false);
    }
  }, [state?.securityPrefs.pinEnabled, state?.securityPrefs.decoyPinEnabled]);

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
        lockNow();
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
  }, [lockNow, state?.settings.autoLockMinutes, locked]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (!state.settings.autoLockOnBlur) {
      return;
    }
    const graceMs = Math.max(0, state.settings.autoLockGraceSeconds) * 1000;
    const scheduleLock = () => {
      if (locked) {
        return;
      }
      if (blurLockTimer.current) {
        window.clearTimeout(blurLockTimer.current);
      }
      blurLockTimer.current = window.setTimeout(() => {
        lockNow();
      }, graceMs);
    };
    const clearLock = () => {
      if (blurLockTimer.current) {
        window.clearTimeout(blurLockTimer.current);
        blurLockTimer.current = null;
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        scheduleLock();
      } else {
        clearLock();
      }
    };
    const handleBlur = () => scheduleLock();
    const handleFocus = () => clearLock();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearLock();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lockNow, state?.settings.autoLockOnBlur, state?.settings.autoLockGraceSeconds, locked]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (!state.settings.switchToDecoyOnBlur || !state.settings.decoyProfileId) {
      return;
    }
    const decoyId = state.settings.decoyProfileId;
    const switchToDecoy = () => {
      if (locked || state.settings.activeProfileId === decoyId) {
        return;
      }
      updateSettings({ activeProfileId: decoyId });
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        switchToDecoy();
      }
    };
    const handleBlur = () => switchToDecoy();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [
    locked,
    state?.settings.activeProfileId,
    state?.settings.decoyProfileId,
    state?.settings.switchToDecoyOnBlur,
    updateSettings
  ]);

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
          activeProfileId: profile.id,
          primaryProfileId: prev.settings.primaryProfileId ?? prev.settings.activeProfileId
        }
      };
    });
  }, []);

  const createDecoyProfile = useCallback((name: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      if (prev.settings.decoyProfileId) {
        return prev;
      }
      const profile = createSeedProfile(name);
      const calendars = createDecoyCalendars(profile.id);
      return {
        ...prev,
        profiles: [...prev.profiles, profile],
        calendars: [...prev.calendars, ...calendars],
        settings: {
          ...prev.settings,
          decoyProfileId: profile.id,
          primaryProfileId: prev.settings.primaryProfileId ?? prev.settings.activeProfileId
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

  const unlock = useCallback(
    async (pin?: string) => {
      if (!state) {
        return false;
      }
      if (!state.securityPrefs.pinEnabled && !state.securityPrefs.decoyPinEnabled) {
        setLocked(false);
        return true;
      }
      if (!pin) {
        return false;
      }
      const matchesPrimary =
        state.securityPrefs.pinEnabled &&
        state.securityPrefs.pinHash &&
        state.securityPrefs.pinSalt
          ? await verifyPin(pin, {
              hash: state.securityPrefs.pinHash,
              salt: state.securityPrefs.pinSalt,
              iterations: state.securityPrefs.pinIterations ?? 90000
            })
          : false;
      const matchesDecoy =
        state.securityPrefs.decoyPinEnabled &&
        state.securityPrefs.decoyPinHash &&
        state.securityPrefs.decoyPinSalt
          ? await verifyPin(pin, {
              hash: state.securityPrefs.decoyPinHash,
              salt: state.securityPrefs.decoyPinSalt,
              iterations: state.securityPrefs.decoyPinIterations ?? 90000
            })
          : false;
      if (matchesPrimary) {
        setLocked(false);
        updateSettings({
          activeProfileId: state.settings.primaryProfileId ?? state.settings.activeProfileId
        });
        return true;
      }
      if (matchesDecoy) {
        setLocked(false);
        const decoyProfileId = state.settings.decoyProfileId ?? state.settings.activeProfileId;
        updateSettings({ activeProfileId: decoyProfileId });
        return true;
      }
      return false;
    },
    [state, updateSettings]
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

  const setDecoyPin = useCallback(
    async (pin: string) => {
      const hashed = await hashPin(pin);
      updateSecurityPrefs({
        decoyPinEnabled: true,
        decoyPinHash: hashed.hash,
        decoyPinSalt: hashed.salt,
        decoyPinIterations: hashed.iterations
      });
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

  const clearDecoyPin = useCallback(() => {
    updateSecurityPrefs({
      decoyPinEnabled: false,
      decoyPinHash: undefined,
      decoyPinSalt: undefined,
      decoyPinIterations: undefined
    });
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
      const resolvedPrimary =
        decrypted.settings.primaryProfileId ??
        decrypted.settings.activeProfileId ??
        decrypted.profiles[0]?.id ??
        decrypted.settings.activeProfileId;
      const settings = {
        ...decrypted.settings,
        primaryProfileId: resolvedPrimary,
        autoLockOnBlur: decrypted.settings.autoLockOnBlur ?? false,
        autoLockGraceSeconds: decrypted.settings.autoLockGraceSeconds ?? 0,
        privacyScreenHotkeyEnabled: decrypted.settings.privacyScreenHotkeyEnabled ?? true,
        activeProfileId: activeProfileExists
          ? decrypted.settings.activeProfileId
          : decrypted.profiles[0]?.id ?? decrypted.settings.activeProfileId
      };
      setState({
        profiles: decrypted.profiles,
        calendars: decrypted.calendars ?? [],
        events: decrypted.events ?? [],
        settings,
        securityPrefs: {
          ...baseSecurityPrefs,
          ...decrypted.securityPrefs
        }
      });
      setLocked(Boolean(decrypted.securityPrefs.pinEnabled || decrypted.securityPrefs.decoyPinEnabled));
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
      createDecoyProfile,
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
      setDecoyPin,
      clearPin,
      clearDecoyPin,
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
      createDecoyProfile,
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
      setDecoyPin,
      clearPin,
      clearDecoyPin,
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
