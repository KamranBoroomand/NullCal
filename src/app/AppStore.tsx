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
import { createDecoyCalendars, createDecoyEvents, createSeedCalendars, createSeedProfile } from '../storage/seed';
import {
  createCalendar as buildCalendar,
  deleteCalendar as deleteCalendarFromState,
  loadAppState,
  recolorCalendar as recolorCalendarInState,
  renameCalendar as renameCalendarInState,
  saveAppState,
  wipeAllData
} from '../storage/storage';
import type { AppSettings, AppState, CalendarEvent, EventTemplate, SecurityPrefs } from '../storage/types';
import { applyNetworkLock } from '../security/networkLock';
import { hashPin, verifyPin } from '../security/pin';
import { decryptPayload, encryptPayload, type EncryptedPayload } from '../security/encryption';
import { verifyLocalSecret } from '../security/localAuth';
import { authenticatePasskey } from '../security/webauthn';
import { authenticateBiometricCredential } from '../security/biometric';
import {
  clearTwoFactorSession,
  isTwoFactorVerified,
  startTwoFactorChallenge,
  verifyTwoFactorCode
} from '../security/twoFactor';
import { verifyTotpCode } from '../security/totp';
import { createP2PSync } from '../sync/p2pSync';
import { scheduleReminders } from '../reminders/reminderScheduler';
import { logAuditEvent } from '../storage/auditLog';
import { readCachedState, writeCachedState } from '../storage/cache';
import { hashSnapshot } from '../security/fingerprint';

type AppStoreContextValue = {
  state: AppState | null;
  loading: boolean;
  locked: boolean;
  lockNow: () => void;
  unlock: (pin?: string) => Promise<boolean>;
  unlockWithWebAuthn: () => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  twoFactorPending: boolean;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  resendTwoFactor: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateSecurityPrefs: (updates: Partial<SecurityPrefs>) => void;
  setActiveProfile: (id: string) => void;
  createProfile: (name: string) => void;
  createDecoyProfile: (name: string) => void;
  resetProfile: (profileId: string) => void;
  updateProfileName: (profileId: string, name: string) => void;
  updateProfileDetails: (
    profileId: string,
    updates: Partial<{
      name: string;
      displayName: string;
      avatarEmoji: string;
      avatarColor: string;
      avatarUrl: string;
      bio: string;
      phone: string;
      location: string;
      preferredNotification: 'sms' | 'email';
    }>
  ) => void;
  createCalendar: (profileId: string, payload: { name: string; color: string }) => void;
  renameCalendar: (profileId: string, calendarId: string, name: string) => void;
  recolorCalendar: (profileId: string, calendarId: string, color: string) => void;
  deleteCalendar: (profileId: string, calendarId: string) => void;
  toggleCalendarVisibility: (calendarId: string) => void;
  upsertEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  createTemplate: (template: Omit<EventTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (templateId: string, updates: Partial<EventTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
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
  decoyPinEnabled: false,
  localAuthEnabled: false,
  webAuthnEnabled: false,
  biometricCredentialId: undefined,
  totpEnabled: false,
  totpSecret: undefined
};

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const stateRef = useRef<AppState | null>(null);
  const syncHandleRef = useRef<ReturnType<typeof createP2PSync> | null>(null);
  const syncSenderId = useRef(crypto.randomUUID());
  const syncHashRef = useRef<string | null>(null);
  const persistHashRef = useRef<string | null>(null);
  const reminderHandleRef = useRef<ReturnType<typeof scheduleReminders> | null>(null);
  const autoLockTimer = useRef<number | null>(null);
  const blurLockTimer = useRef<number | null>(null);
  const lockNow = useCallback(() => {
    setLocked(true);
    setTwoFactorPending(false);
    setTwoFactorVerified(false);
    clearTwoFactorSession();
    logAuditEvent({ action: 'auth.locked', category: 'auth' });
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
    const cached = readCachedState(30);
    if (cached) {
      setState({ ...cached, templates: cached.templates ?? [] });
    }
    loadAppState()
      .then((data) => {
        setState(data);
        setTwoFactorVerified(isTwoFactorVerified());
        setLocked(
          Boolean(
            data.securityPrefs.pinEnabled ||
              data.securityPrefs.decoyPinEnabled ||
              data.securityPrefs.localAuthEnabled ||
              data.securityPrefs.webAuthnEnabled ||
              data.settings.biometricEnabled ||
              data.settings.twoFactorEnabled
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const handleOnline = () => {
      const current = stateRef.current;
      if (!current) {
        return;
      }
      syncHashRef.current = null;
      if (syncHandleRef.current) {
        syncHandleRef.current.broadcast({
          profiles: current.profiles,
          calendars: current.calendars,
          events: current.events,
          templates: current.templates
        });
      }
      if (current.settings.cacheEnabled) {
        writeCachedState(current, current.settings.cacheTtlMinutes);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }
    let cancelled = false;
    const persist = async () => {
      try {
        const snapshot = JSON.stringify({
          profiles: state.profiles,
          calendars: state.calendars,
          events: state.events,
          templates: state.templates,
          settings: state.settings,
          securityPrefs: state.securityPrefs
        });
        const hash = await hashSnapshot(snapshot);
        if (cancelled || persistHashRef.current === hash) {
          return;
        }
        persistHashRef.current = hash;
        await saveAppState(state);
        if (state.settings.cacheEnabled) {
          writeCachedState(state, state.settings.cacheTtlMinutes);
        }
      } catch {
        // Ignore transient persistence failures; next state change retries.
      }
    };
    void persist();
    return () => {
      cancelled = true;
    };
  }, [state]);

  useEffect(() => {
    if (!state) {
      return;
    }
    applyNetworkLock(true);
  }, [state]);

  useEffect(() => {
    if (!state?.settings.syncTrustedDevices) {
      return;
    }
    if (state.settings.syncShareToken) {
      return;
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
    updateSettings({ syncShareToken: token, syncTrustedDevices: true });
  }, [state?.settings.syncShareToken, state?.settings.syncTrustedDevices, updateSettings]);

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
    const scale = state.settings.textScale ?? 1;
    document.documentElement.style.fontSize = `${Math.max(0.85, Math.min(scale, 1.4)) * 100}%`;
    if (state.settings.highContrast) {
      document.body.setAttribute('data-contrast', 'high');
    } else {
      document.body.removeAttribute('data-contrast');
    }
    if (state.settings.keyboardNavigation) {
      document.body.setAttribute('data-keyboard-nav', 'enabled');
    } else {
      document.body.removeAttribute('data-keyboard-nav');
    }
    document.documentElement.lang = state.settings.language ?? 'en';
    document.documentElement.dir = state.settings.language === 'fa' ? 'rtl' : 'ltr';
  }, [
    state?.settings.highContrast,
    state?.settings.keyboardNavigation,
    state?.settings.textScale,
    state?.settings.language
  ]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (
      !state.securityPrefs.pinEnabled &&
      !state.securityPrefs.decoyPinEnabled &&
      !state.securityPrefs.localAuthEnabled &&
      !state.securityPrefs.webAuthnEnabled &&
      !state.settings.biometricEnabled &&
      !state.settings.twoFactorEnabled
    ) {
      setLocked(false);
    }
  }, [
    state?.securityPrefs.pinEnabled,
    state?.securityPrefs.decoyPinEnabled,
    state?.securityPrefs.localAuthEnabled,
    state?.securityPrefs.webAuthnEnabled,
    state?.settings.biometricEnabled,
    state?.settings.twoFactorEnabled
  ]);

  useEffect(() => {
    if (!state?.settings.twoFactorEnabled) {
      setTwoFactorPending(false);
      setTwoFactorVerified(false);
      clearTwoFactorSession();
    }
  }, [state?.settings.twoFactorEnabled]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (state.settings.syncStrategy === 'offline') {
      syncHandleRef.current?.close();
      syncHandleRef.current = null;
      return;
    }
    const handle = createP2PSync(
      syncSenderId.current,
      (payload) => {
        setState((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            profiles: payload.profiles,
            calendars: payload.calendars,
            events: payload.events,
            templates: payload.templates ?? prev.templates
          };
        });
      },
      state.settings.syncTrustedDevices ? state.settings.syncShareToken : undefined
    );
    syncHandleRef.current = handle;
    return () => {
      handle.close();
      syncHandleRef.current = null;
    };
  }, [state?.settings.syncStrategy, state?.settings.syncTrustedDevices, state?.settings.syncShareToken]);

  useEffect(() => {
    if (!state || !syncHandleRef.current) {
      return;
    }
    let cancelled = false;
    const broadcast = async () => {
      const snapshot = JSON.stringify({
        profiles: state.profiles,
        calendars: state.calendars,
        events: state.events,
        templates: state.templates
      });
      const hash = await hashSnapshot(snapshot);
      if (cancelled || syncHashRef.current === hash) {
        return;
      }
      syncHashRef.current = hash;
      syncHandleRef.current?.broadcast({
        profiles: state.profiles,
        calendars: state.calendars,
        events: state.events,
        templates: state.templates
      });
    };
    void broadcast();
    return () => {
      cancelled = true;
    };
  }, [state?.profiles, state?.calendars, state?.events, state?.templates]);

  useEffect(() => {
    reminderHandleRef.current?.stop();
    if (!state) {
      return;
    }
    if (!state.settings.remindersEnabled) {
      return;
    }
    const activeEvents = state.events.filter(
      (event) => event.profileId === state.settings.activeProfileId
    );
    reminderHandleRef.current = scheduleReminders(activeEvents, state.settings);
  }, [
    state?.events,
    state?.settings.activeProfileId,
    state?.settings.remindersEnabled,
    state?.settings.reminderChannel,
    state?.settings.notificationEmail,
    state?.settings.notificationPhone,
    state?.settings.telegramBotToken,
    state?.settings.telegramChatId,
    state?.settings.signalWebhookUrl
  ]);

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
    const profile = createSeedProfile(name);
    setState((prev) => {
      if (!prev) {
        return prev;
      }
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
    logAuditEvent({ action: 'profile.created', category: 'profile', metadata: { profileId: profile.id } });
  }, []);

  const createDecoyProfile = useCallback((name: string) => {
    const profile = createSeedProfile(name);
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      if (prev.settings.decoyProfileId) {
        return prev;
      }
      const calendars = createDecoyCalendars(profile.id);
      const events = createDecoyEvents(profile.id, calendars);
      return {
        ...prev,
        profiles: [...prev.profiles, profile],
        calendars: [...prev.calendars, ...calendars],
        events: [...prev.events, ...events],
        settings: {
          ...prev.settings,
          decoyProfileId: profile.id,
          primaryProfileId: prev.settings.primaryProfileId ?? prev.settings.activeProfileId
        }
      };
    });
    logAuditEvent({ action: 'profile.decoy_created', category: 'profile', metadata: { profileId: profile.id } });
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
    logAuditEvent({ action: 'profile.reset', category: 'profile', metadata: { profileId } });
  }, []);

  const updateProfileName = useCallback((profileId: string, name: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === profileId ? { ...profile, name, displayName: name } : profile
        )
      };
    });
    logAuditEvent({ action: 'profile.updated', category: 'profile', metadata: { profileId } });
  }, []);

  const updateProfileDetails = useCallback(
    (
      profileId: string,
      updates: Partial<{
        name: string;
        displayName: string;
        avatarEmoji: string;
        avatarColor: string;
        bio: string;
      }>
    ) => {
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          profiles: prev.profiles.map((profile) =>
            profile.id === profileId ? { ...profile, ...updates } : profile
          )
        };
      });
      logAuditEvent({ action: 'profile.customized', category: 'profile', metadata: { profileId } });
    },
    []
  );

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
    logAuditEvent({
      action: 'calendar.created',
      category: 'calendar',
      metadata: { calendarId: calendar.id, profileId }
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
    logAuditEvent({ action: 'calendar.renamed', category: 'calendar', metadata: { calendarId, profileId } });
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
    logAuditEvent({ action: 'calendar.recolored', category: 'calendar', metadata: { calendarId, profileId } });
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
    logAuditEvent({ action: 'calendar.deleted', category: 'calendar', metadata: { calendarId, profileId } });
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
    logAuditEvent({
      action: 'event.upserted',
      category: 'event',
      metadata: { eventId: event.id, profileId: event.profileId }
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
    logAuditEvent({ action: 'event.deleted', category: 'event', metadata: { eventId } });
  }, []);

  const createTemplate = useCallback((template: Omit<EventTemplate, 'id' | 'createdAt'>) => {
    const nextTemplate: EventTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        templates: [...prev.templates, nextTemplate]
      };
    });
    logAuditEvent({
      action: 'template.created',
      category: 'template',
      metadata: { templateId: nextTemplate.id, profileId: nextTemplate.profileId }
    });
  }, []);

  const updateTemplate = useCallback((templateId: string, updates: Partial<EventTemplate>) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        templates: prev.templates.map((template) =>
          template.id === templateId ? { ...template, ...updates } : template
        )
      };
    });
    logAuditEvent({ action: 'template.updated', category: 'template', metadata: { templateId } });
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        templates: prev.templates.filter((template) => template.id !== templateId)
      };
    });
    logAuditEvent({ action: 'template.deleted', category: 'template', metadata: { templateId } });
  }, []);

  const ensureTwoFactor = useCallback(async (): Promise<'pending' | 'clear' | 'failed'> => {
    if (!state?.settings.twoFactorEnabled) {
      return 'clear';
    }
    if (twoFactorVerified) {
      return 'clear';
    }
    if (!twoFactorPending) {
      setTwoFactorPending(true);
      try {
        if (state.settings.twoFactorMode === 'totp') {
          if (!state.securityPrefs.totpSecret) {
            setTwoFactorPending(false);
            return 'failed';
          }
          return 'pending';
        }
        await startTwoFactorChallenge(state.settings.twoFactorChannel, state.settings.twoFactorDestination);
      } catch {
        setTwoFactorPending(false);
        return 'failed';
      }
    }
    return 'pending';
  }, [
    state?.settings.twoFactorChannel,
    state?.settings.twoFactorDestination,
    state?.settings.twoFactorEnabled,
    state?.settings.twoFactorMode,
    state?.securityPrefs.totpSecret,
    twoFactorPending,
    twoFactorVerified
  ]);

  const unlock = useCallback(
    async (secret?: string) => {
      if (!state) {
        return false;
      }
      if (
        !state.securityPrefs.pinEnabled &&
        !state.securityPrefs.decoyPinEnabled &&
        !state.securityPrefs.localAuthEnabled &&
        !state.securityPrefs.webAuthnEnabled &&
        !state.settings.biometricEnabled
      ) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
        return true;
      }
      if (!secret) {
        return false;
      }
      const matchesPrimary =
        state.securityPrefs.pinEnabled &&
        state.securityPrefs.pinHash &&
        state.securityPrefs.pinSalt
          ? await verifyPin(secret, {
              hash: state.securityPrefs.pinHash,
              salt: state.securityPrefs.pinSalt,
              iterations: state.securityPrefs.pinIterations ?? 90000
            })
          : false;
      const matchesDecoy =
        state.securityPrefs.decoyPinEnabled &&
        state.securityPrefs.decoyPinHash &&
        state.securityPrefs.decoyPinSalt
          ? await verifyPin(secret, {
              hash: state.securityPrefs.decoyPinHash,
              salt: state.securityPrefs.decoyPinSalt,
              iterations: state.securityPrefs.decoyPinIterations ?? 90000
            })
          : false;
      if (matchesPrimary) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
        updateSettings({
          activeProfileId: state.settings.primaryProfileId ?? state.settings.activeProfileId
        });
        return true;
      }
      if (matchesDecoy) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
        const decoyProfileId = state.settings.decoyProfileId ?? state.settings.activeProfileId;
        updateSettings({ activeProfileId: decoyProfileId });
        return true;
      }
      const matchesLocal =
        state.securityPrefs.localAuthEnabled &&
        state.securityPrefs.localAuthHash &&
        state.securityPrefs.localAuthSalt
          ? await verifyLocalSecret(secret, {
              hash: state.securityPrefs.localAuthHash,
              salt: state.securityPrefs.localAuthSalt,
              iterations: state.securityPrefs.localAuthIterations ?? 140000
            })
          : false;
      if (matchesLocal) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
        return true;
      }
      return false;
    },
    [ensureTwoFactor, state, updateSettings]
  );

  const unlockWithWebAuthn = useCallback(async () => {
    if (!state?.securityPrefs.webAuthnEnabled || !state.securityPrefs.webAuthnCredentialId) {
      return false;
    }
    try {
      const ok = await authenticatePasskey(state.securityPrefs.webAuthnCredentialId);
      if (ok) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
      }
      return ok;
    } catch {
      return false;
    }
  }, [ensureTwoFactor, state]);

  const unlockWithBiometric = useCallback(async () => {
    if (!state?.settings.biometricEnabled || !state.securityPrefs.biometricCredentialId) {
      return false;
    }
    try {
      const ok = await authenticateBiometricCredential(state.securityPrefs.biometricCredentialId);
      if (ok) {
        const twoFactorStatus = await ensureTwoFactor();
        if (twoFactorStatus === 'failed') {
          return false;
        }
        if (twoFactorStatus === 'clear') {
          setLocked(false);
          logAuditEvent({ action: 'auth.unlocked', category: 'auth' });
        }
      }
      return ok;
    } catch {
      return false;
    }
  }, [ensureTwoFactor, state]);

  const verifyTwoFactor = useCallback(
    async (code: string) => {
      const ok =
        state?.settings.twoFactorMode === 'totp' && state.securityPrefs.totpSecret
          ? await verifyTotpCode(code, state.securityPrefs.totpSecret)
          : await verifyTwoFactorCode(code);
      if (ok) {
        setTwoFactorPending(false);
        setTwoFactorVerified(true);
        setLocked(false);
        logAuditEvent({ action: 'auth.mfa_verified', category: 'auth' });
      }
      return ok;
    },
    [state?.securityPrefs.totpSecret, state?.settings.twoFactorMode]
  );

  const resendTwoFactor = useCallback(async () => {
    if (!state?.settings.twoFactorEnabled) {
      return;
    }
    if (state.settings.twoFactorMode === 'totp') {
      return;
    }
    await startTwoFactorChallenge(state.settings.twoFactorChannel, state.settings.twoFactorDestination);
  }, [
    state?.settings.twoFactorChannel,
    state?.settings.twoFactorDestination,
    state?.settings.twoFactorEnabled,
    state?.settings.twoFactorMode
  ]);


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
      setTwoFactorPending(false);
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
    const stillLocked = Boolean(
      state?.securityPrefs.decoyPinEnabled ||
        state?.securityPrefs.localAuthEnabled ||
        state?.securityPrefs.webAuthnEnabled ||
        state?.settings.biometricEnabled ||
        state?.settings.twoFactorEnabled
    );
    setLocked(stillLocked);
  }, [
    state?.securityPrefs.decoyPinEnabled,
    state?.securityPrefs.localAuthEnabled,
    state?.securityPrefs.webAuthnEnabled,
    state?.settings.biometricEnabled,
    state?.settings.twoFactorEnabled,
    updateSecurityPrefs
  ]);

  const clearDecoyPin = useCallback(() => {
    updateSecurityPrefs({
      decoyPinEnabled: false,
      decoyPinHash: undefined,
      decoyPinSalt: undefined,
      decoyPinIterations: undefined
    });
    const stillLocked = Boolean(
      state?.securityPrefs.pinEnabled ||
        state?.securityPrefs.localAuthEnabled ||
        state?.securityPrefs.webAuthnEnabled ||
        state?.settings.biometricEnabled ||
        state?.settings.twoFactorEnabled
    );
    setLocked(stillLocked);
  }, [
    state?.securityPrefs.pinEnabled,
    state?.securityPrefs.localAuthEnabled,
    state?.securityPrefs.webAuthnEnabled,
    state?.settings.biometricEnabled,
    state?.settings.twoFactorEnabled,
    updateSecurityPrefs
  ]);

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
      decrypted.templates = decrypted.templates ?? [];
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
        templates: decrypted.templates,
        settings,
        securityPrefs: {
          ...baseSecurityPrefs,
          ...decrypted.securityPrefs
        }
      });
      setLocked(
        Boolean(
          decrypted.securityPrefs.pinEnabled ||
            decrypted.securityPrefs.decoyPinEnabled ||
            decrypted.securityPrefs.localAuthEnabled ||
            decrypted.securityPrefs.webAuthnEnabled ||
            decrypted.settings.biometricEnabled ||
            decrypted.settings.twoFactorEnabled
        )
      );
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
      unlockWithWebAuthn,
      unlockWithBiometric,
      twoFactorPending,
      verifyTwoFactor,
      resendTwoFactor,
      updateSettings,
      updateSecurityPrefs,
      setActiveProfile,
      createProfile,
      createDecoyProfile,
      resetProfile,
      updateProfileName,
      updateProfileDetails,
      createCalendar,
      renameCalendar,
      recolorCalendar,
      deleteCalendar,
      toggleCalendarVisibility,
      upsertEvent,
      deleteEvent,
      createTemplate,
      updateTemplate,
      deleteTemplate,
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
      unlockWithWebAuthn,
      unlockWithBiometric,
      twoFactorPending,
      verifyTwoFactor,
      resendTwoFactor,
      updateSettings,
      updateSecurityPrefs,
      setActiveProfile,
      createProfile,
      createDecoyProfile,
      resetProfile,
      updateProfileName,
      updateProfileDetails,
      createCalendar,
      renameCalendar,
      recolorCalendar,
      deleteCalendar,
      toggleCalendarVisibility,
      upsertEvent,
      deleteEvent,
      createTemplate,
      updateTemplate,
      deleteTemplate,
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
