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
import type {
  AppSettings,
  AppState,
  CalendarPermissionPreset,
  CalendarEvent,
  CollaborationMember,
  CollaborationRole,
  EventTemplate,
  SecurityPrefs
} from '../storage/types';
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
import { verifyRecoveryCode } from '../security/recovery';
import { createP2PSync } from '../sync/p2pSync';
import { createRelaySync } from '../sync/relaySync';
import { scheduleReminders } from '../reminders/reminderScheduler';
import { logAuditEvent } from '../storage/auditLog';
import { clearCachedState, readCachedState, writeCachedState } from '../storage/cache';
import { hashSnapshot } from '../security/fingerprint';
import type { SyncMessage } from '../sync/types';
import {
  hasCalendarWriteAccess,
  hasCollaborationAdminAccess,
  hasCollaborationWriteAccess
} from '../collaboration/access';

type UnlockSecretMethod = 'auto' | 'pin' | 'passphrase' | 'recovery';
type TwoFactorMethod = 'otp' | 'totp';
type TwoFactorStatus = 'pending' | 'clear' | 'failed';
type ConflictPolicy = AppSettings['syncConflictPolicy'];

const ONLINE_WINDOW_MS = 2 * 60 * 1000;
const AWAY_WINDOW_MS = 30 * 60 * 1000;

const nowIso = () => new Date().toISOString();

const normalizeContact = (value: string) => value.trim().toLowerCase();

const createInviteCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(5)))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8)
    .toUpperCase();

const toMillis = (...values: Array<string | number | undefined>) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const resolvePresence = (status: CollaborationMember['status'], lastSeenAt?: string) => {
  if (status !== 'active') {
    return 'offline' as const;
  }
  const seenMs = toMillis(lastSeenAt);
  if (!seenMs) {
    return 'away' as const;
  }
  const age = Date.now() - seenMs;
  if (age <= ONLINE_WINDOW_MS) {
    return 'online' as const;
  }
  if (age <= AWAY_WINDOW_MS) {
    return 'away' as const;
  }
  return 'offline' as const;
};

const normalizeCalendarPermissions = (
  value: AppSettings['collaborationCalendarPermissions']
): Record<string, CalendarPermissionPreset> => {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const next: Record<string, CalendarPermissionPreset> = {};
  for (const [calendarId, preset] of Object.entries(value)) {
    if (!calendarId || (preset !== 'owner-only' && preset !== 'owner-editor')) {
      continue;
    }
    next[calendarId] = preset;
  }
  return next;
};

const reconcileCollaborationMembers = (members: CollaborationMember[]): CollaborationMember[] =>
  members.map((member) => {
    const joinedAt = member.joinedAt ?? member.inviteAcceptedAt ?? member.invitedAt;
    const status = member.status === 'active' || member.inviteAcceptedAt ? 'active' : 'invited';
    const lastSeenAt = member.lastSeenAt ?? (status === 'active' ? joinedAt : undefined);
    return {
      ...member,
      status,
      joinedAt: status === 'active' ? joinedAt : member.joinedAt,
      lastSeenAt,
      presence: resolvePresence(status, lastSeenAt)
    };
  });

const getDefaultTwoFactorMethod = (settings: AppSettings, securityPrefs: SecurityPrefs): TwoFactorMethod | null => {
  const otpEnabled = settings.twoFactorOtpEnabled;
  const totpEnabled = settings.twoFactorTotpEnabled && Boolean(securityPrefs.totpSecret);
  if (totpEnabled && settings.twoFactorMode === 'totp') {
    return 'totp';
  }
  if (otpEnabled && settings.twoFactorMode === 'otp') {
    return 'otp';
  }
  if (totpEnabled) {
    return 'totp';
  }
  if (otpEnabled) {
    return 'otp';
  }
  return null;
};

const getRecordUpdatedAt = <T extends { updatedAt?: string; createdAt?: string; end?: string; start?: string }>(
  record: T
) => toMillis(record.updatedAt, record.createdAt, record.end, record.start);

const mergeEntitiesById = <
  T extends {
    id: string;
    updatedAt?: string;
    createdAt?: string;
    end?: string;
    start?: string;
  }
>(
  localItems: T[],
  remoteItems: T[],
  policy: ConflictPolicy
) => {
  const merged = new Map(localItems.map((item) => [item.id, item]));
  for (const remoteItem of remoteItems) {
    const localItem = merged.get(remoteItem.id);
    if (!localItem) {
      merged.set(remoteItem.id, remoteItem);
      continue;
    }
    if (policy === 'prefer-local') {
      continue;
    }
    if (policy === 'prefer-remote') {
      merged.set(remoteItem.id, remoteItem);
      continue;
    }
    const localUpdatedAt = getRecordUpdatedAt(localItem);
    const remoteUpdatedAt = getRecordUpdatedAt(remoteItem);
    merged.set(remoteItem.id, remoteUpdatedAt >= localUpdatedAt ? remoteItem : localItem);
  }
  return Array.from(merged.values());
};

const mergeCollaborationMembers = (
  localMembers: CollaborationMember[],
  remoteMembers: CollaborationMember[],
  policy: ConflictPolicy
) => {
  const localMap = new Map(localMembers.map((member) => [member.id, member]));
  const merged = new Map<string, CollaborationMember>();

  for (const remoteMember of remoteMembers) {
    const localMember = localMap.get(remoteMember.id);
    if (!localMember) {
      merged.set(remoteMember.id, remoteMember);
      continue;
    }
    if (policy === 'prefer-local') {
      merged.set(remoteMember.id, localMember);
      continue;
    }
    if (policy === 'prefer-remote') {
      merged.set(remoteMember.id, remoteMember);
      continue;
    }
    const localTs = toMillis(localMember.lastSeenAt, localMember.joinedAt, localMember.invitedAt);
    const remoteTs = toMillis(remoteMember.lastSeenAt, remoteMember.joinedAt, remoteMember.invitedAt);
    const next: CollaborationMember =
      remoteTs > localTs
        ? remoteMember
        : {
            ...localMember,
            status: localMember.status === 'active' || remoteMember.status === 'active' ? 'active' : 'invited',
            role: remoteTs > localTs ? remoteMember.role : localMember.role
          };
    merged.set(remoteMember.id, next);
  }

  for (const localMember of localMembers) {
    if (!merged.has(localMember.id)) {
      merged.set(localMember.id, localMember);
    }
  }

  return reconcileCollaborationMembers(Array.from(merged.values()));
};

const collaborationMembersEqual = (left: CollaborationMember[], right: CollaborationMember[]) =>
  left.length === right.length &&
  left.every((member, index) => {
    const candidate = right[index];
    return (
      candidate?.id === member.id &&
      candidate.name === member.name &&
      candidate.contact === member.contact &&
      candidate.role === member.role &&
      candidate.status === member.status &&
      candidate.presence === member.presence &&
      candidate.inviteCode === member.inviteCode &&
      candidate.inviteLink === member.inviteLink &&
      candidate.invitedAt === member.invitedAt &&
      candidate.inviteAcceptedAt === member.inviteAcceptedAt &&
      candidate.inviteExpiresAt === member.inviteExpiresAt &&
      candidate.joinedAt === member.joinedAt &&
      candidate.lastSeenAt === member.lastSeenAt
    );
  });

type AppStoreContextValue = {
  state: AppState | null;
  loading: boolean;
  locked: boolean;
  lockNow: () => void;
  unlock: (secret?: string, method?: UnlockSecretMethod) => Promise<boolean>;
  unlockWithWebAuthn: () => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  twoFactorPending: boolean;
  twoFactorMode: TwoFactorMethod;
  availableTwoFactorModes: TwoFactorMethod[];
  setTwoFactorMode: (mode: TwoFactorMethod) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  resendTwoFactor: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateSecurityPrefs: (updates: Partial<SecurityPrefs>) => void;
  canEditWorkspace: boolean;
  canManageCollaboration: boolean;
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
  inviteCollaborator: (
    name: string,
    contact: string,
    role: CollaborationRole,
    options?: { expiresInHours?: number }
  ) => void;
  acceptCollaboratorInvite: (inviteCode: string) => boolean;
  updateCollaborator: (memberId: string, updates: Partial<CollaborationMember>) => void;
  removeCollaborator: (memberId: string) => void;
  setCollaborationRole: (role: CollaborationRole) => void;
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
  totpSecret: undefined,
  recoveryCodeHash: undefined,
  recoveryCodeSalt: undefined,
  recoveryCodeIterations: undefined,
  recoveryCodeGeneratedAt: undefined,
  recoveryCodeUsedAt: undefined
};
const configuredSyncApi = import.meta.env.VITE_SYNC_API?.trim();
const configuredNotificationApi = import.meta.env.VITE_NOTIFICATION_API?.trim();
const configuredSyncToken = import.meta.env.VITE_SYNC_TOKEN?.trim() ?? import.meta.env.VITE_NOTIFICATION_TOKEN?.trim();
const SYNC_API_BASE = (
  configuredSyncApi && configuredSyncApi.length > 0
    ? configuredSyncApi
    : configuredNotificationApi && configuredNotificationApi.length > 0
      ? configuredNotificationApi
      : '/api'
).replace(/\/+$/, '');

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [selectedTwoFactorMode, setSelectedTwoFactorMode] = useState<TwoFactorMethod>('otp');
  const stateRef = useRef<AppState | null>(null);
  const syncHandleRef = useRef<ReturnType<typeof createP2PSync> | null>(null);
  const syncSenderId = useRef(crypto.randomUUID());
  const syncHashRef = useRef<string | null>(null);
  const persistHashRef = useRef<string | null>(null);
  const reminderHandleRef = useRef<ReturnType<typeof scheduleReminders> | null>(null);
  const autoLockTimer = useRef<number | null>(null);
  const blurLockTimer = useRef<number | null>(null);
  const canEditWorkspace = useMemo(
    () => (state ? hasCollaborationWriteAccess(state.settings) : true),
    [state?.settings.collaborationEnabled, state?.settings.collaborationMode, state?.settings.collaborationRole]
  );
  const canManageCollaboration = useMemo(
    () => (state ? hasCollaborationAdminAccess(state.settings) : true),
    [state?.settings.collaborationEnabled, state?.settings.collaborationMode, state?.settings.collaborationRole]
  );
  const availableTwoFactorModes = useMemo<TwoFactorMethod[]>(() => {
    if (!state?.settings.twoFactorEnabled) {
      return [];
    }
    const modes: TwoFactorMethod[] = [];
    if (state.settings.twoFactorOtpEnabled) {
      modes.push('otp');
    }
    if (state.settings.twoFactorTotpEnabled && Boolean(state.securityPrefs.totpSecret)) {
      modes.push('totp');
    }
    return modes;
  }, [
    state?.settings.twoFactorEnabled,
    state?.settings.twoFactorOtpEnabled,
    state?.settings.twoFactorTotpEnabled,
    state?.securityPrefs.totpSecret
  ]);
  const activeTwoFactorMode = useMemo<TwoFactorMethod>(() => {
    if (availableTwoFactorModes.includes(selectedTwoFactorMode)) {
      return selectedTwoFactorMode;
    }
    if (availableTwoFactorModes.includes(state?.settings.twoFactorMode ?? 'otp')) {
      return (state?.settings.twoFactorMode ?? 'otp') as TwoFactorMethod;
    }
    return availableTwoFactorModes[0] ?? 'otp';
  }, [availableTwoFactorModes, selectedTwoFactorMode, state?.settings.twoFactorMode]);
  const lockNow = useCallback(() => {
    setLocked(true);
    setTwoFactorPending(false);
    setTwoFactorVerified(false);
    clearTwoFactorSession();
    logAuditEvent({ action: 'auth.locked', category: 'auth' });
  }, []);
  const guardWorkspaceWrite = useCallback((action: string) => {
    const current = stateRef.current;
    if (current && !hasCollaborationWriteAccess(current.settings)) {
      logAuditEvent({ action: 'collaboration.write_blocked', category: 'collaboration', metadata: { action } });
      return false;
    }
    return true;
  }, []);
  const guardCollaborationAdmin = useCallback((action: string) => {
    const current = stateRef.current;
    if (current && !hasCollaborationAdminAccess(current.settings)) {
      logAuditEvent({ action: 'collaboration.admin_blocked', category: 'collaboration', metadata: { action } });
      return false;
    }
    return true;
  }, []);
  const guardCalendarWrite = useCallback((action: string, calendarId: string) => {
    const current = stateRef.current;
    if (!current) {
      return true;
    }
    if (hasCalendarWriteAccess(current.settings, calendarId)) {
      return true;
    }
    logAuditEvent({
      action: 'collaboration.calendar_write_blocked',
      category: 'collaboration',
      metadata: { action, calendarId }
    });
    return false;
  }, []);
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const current = stateRef.current;
    if (current && !hasCollaborationAdminAccess(current.settings)) {
      const adminOnlyKeys: Array<keyof AppSettings> = [
        'collaborationEnabled',
        'collaborationMode',
        'collaborationRole',
        'collaborationMembers',
        'collaborationCalendarPermissions'
      ];
      const triedRestrictedUpdate = adminOnlyKeys.some((key) => key in updates);
      if (triedRestrictedUpdate) {
        logAuditEvent({ action: 'collaboration.settings_blocked', category: 'collaboration' });
        return;
      }
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const nextSettings: AppSettings = {
        ...prev.settings,
        ...updates,
        networkLock: updates.networkLock ?? prev.settings.networkLock
      };
      if ('collaborationMembers' in updates && updates.collaborationMembers) {
        nextSettings.collaborationMembers = reconcileCollaborationMembers(updates.collaborationMembers);
      }
      if ('collaborationCalendarPermissions' in updates) {
        nextSettings.collaborationCalendarPermissions = normalizeCalendarPermissions(
          updates.collaborationCalendarPermissions
        );
      }
      if ('twoFactorOtpEnabled' in updates || 'twoFactorTotpEnabled' in updates) {
        nextSettings.twoFactorEnabled = Boolean(
          nextSettings.twoFactorOtpEnabled || nextSettings.twoFactorTotpEnabled
        );
      } else if ('twoFactorEnabled' in updates) {
        nextSettings.twoFactorEnabled = Boolean(nextSettings.twoFactorEnabled);
      }
      nextSettings.backupKeyVersion = Math.max(1, Number(nextSettings.backupKeyVersion ?? 1));
      return {
        ...prev,
        settings: nextSettings
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

  const reconcilePresence = useCallback((touchLocalHeartbeat: boolean) => {
    setState((prev) => {
      if (!prev || !prev.settings.collaborationEnabled) {
        return prev;
      }
      const baseMembers = reconcileCollaborationMembers(prev.settings.collaborationMembers);
      if (!touchLocalHeartbeat) {
        if (collaborationMembersEqual(prev.settings.collaborationMembers, baseMembers)) {
          return prev;
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationMembers: baseMembers
          }
        };
      }

      const activeProfile = prev.profiles.find((profile) => profile.id === prev.settings.activeProfileId);
      const localContacts = new Set(
        [activeProfile?.phone, prev.settings.notificationEmail, prev.settings.notificationPhone]
          .map((value) => (typeof value === 'string' ? normalizeContact(value) : ''))
          .filter(Boolean)
      );
      if (localContacts.size === 0) {
        if (collaborationMembersEqual(prev.settings.collaborationMembers, baseMembers)) {
          return prev;
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationMembers: baseMembers
          }
        };
      }

      const heartbeatAt = nowIso();
      const nextMembers: CollaborationMember[] = baseMembers.map((member) => {
        if (member.status !== 'active') {
          return member;
        }
        if (!localContacts.has(normalizeContact(member.contact))) {
          return member;
        }
        return {
          ...member,
          lastSeenAt: heartbeatAt,
          presence: 'online' as const
        };
      });

      if (collaborationMembersEqual(prev.settings.collaborationMembers, nextMembers)) {
        return prev;
      }

      return {
        ...prev,
        settings: {
          ...prev.settings,
          collaborationMembers: nextMembers
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
        const defaultMode = getDefaultTwoFactorMethod(data.settings, data.securityPrefs);
        if (defaultMode) {
          setSelectedTwoFactorMode(defaultMode);
        }
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
    if (!state?.settings.collaborationEnabled) {
      return;
    }
    reconcilePresence(true);
    const interval = window.setInterval(() => {
      reconcilePresence(document.visibilityState === 'visible');
    }, 60 * 1000);
    const handleVisibility = () => {
      reconcilePresence(document.visibilityState === 'visible');
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    reconcilePresence,
    state?.settings.activeProfileId,
    state?.settings.collaborationEnabled,
    state?.settings.collaborationMembers,
    state?.settings.notificationEmail,
    state?.settings.notificationPhone
  ]);

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
          templates: current.templates,
          collaboration: {
            enabled: current.settings.collaborationEnabled,
            mode: current.settings.collaborationMode,
            members: reconcileCollaborationMembers(current.settings.collaborationMembers),
            calendarPermissions: normalizeCalendarPermissions(current.settings.collaborationCalendarPermissions)
          }
        });
      }
      if (current.settings.cacheEnabled) {
        writeCachedState(current, current.settings.cacheTtlMinutes);
      } else {
        clearCachedState();
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
        } else {
          clearCachedState();
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
    applyNetworkLock(Boolean(state.settings.networkLock));
  }, [state?.settings.networkLock]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (state.settings.syncShareToken) {
      return;
    }
    if (state.settings.syncStrategy === 'offline' && !state.settings.syncTrustedDevices) {
      return;
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
    updateSettings({ syncShareToken: token });
  }, [state?.settings.syncShareToken, state?.settings.syncStrategy, state?.settings.syncTrustedDevices, updateSettings]);

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
    if (!state?.settings.twoFactorEnabled || availableTwoFactorModes.length === 0) {
      setTwoFactorPending(false);
      setTwoFactorVerified(false);
      clearTwoFactorSession();
      return;
    }
    if (!availableTwoFactorModes.includes(selectedTwoFactorMode)) {
      setSelectedTwoFactorMode(availableTwoFactorModes[0]);
    }
  }, [availableTwoFactorModes, selectedTwoFactorMode, state?.settings.twoFactorEnabled]);

  useEffect(() => {
    if (!state) {
      return;
    }
    if (state.settings.syncStrategy === 'offline') {
      syncHandleRef.current?.close();
      syncHandleRef.current = null;
      return;
    }
    const onReceive = (message: SyncMessage) => {
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        if (!message.payload) {
          return prev;
        }
        const policy = prev.settings.syncConflictPolicy ?? 'last-write-wins';
        const nextProfiles = mergeEntitiesById(prev.profiles, message.payload.profiles ?? [], policy);
        const nextCalendars = mergeEntitiesById(prev.calendars, message.payload.calendars ?? [], policy);
        const nextEvents = mergeEntitiesById(prev.events, message.payload.events ?? [], policy);
        const nextTemplates = mergeEntitiesById(prev.templates, message.payload.templates ?? [], policy);
        const nextCollaborationMembers = message.payload.collaboration
          ? mergeCollaborationMembers(
              prev.settings.collaborationMembers,
              message.payload.collaboration.members ?? [],
              policy
            )
          : reconcileCollaborationMembers(prev.settings.collaborationMembers);
        const nextCalendarPermissions = message.payload.collaboration
          ? normalizeCalendarPermissions(message.payload.collaboration.calendarPermissions)
          : normalizeCalendarPermissions(prev.settings.collaborationCalendarPermissions);
        return {
          ...prev,
          profiles: nextProfiles,
          calendars: nextCalendars,
          events: nextEvents,
          templates: nextTemplates,
          settings: {
            ...prev.settings,
            collaborationEnabled: message.payload.collaboration?.enabled ?? prev.settings.collaborationEnabled,
            collaborationMode: message.payload.collaboration?.mode ?? prev.settings.collaborationMode,
            collaborationMembers: nextCollaborationMembers,
            collaborationCalendarPermissions: nextCalendarPermissions
          }
        };
      });
    };
    const shareToken = state.settings.syncShareToken;
    const handle =
      state.settings.syncStrategy === 'ipfs'
        ? createRelaySync(syncSenderId.current, onReceive, {
            apiBase: SYNC_API_BASE,
            requestToken: configuredSyncToken,
            shareToken
          })
        : createP2PSync(syncSenderId.current, onReceive, shareToken);
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
      const collaboration = {
        enabled: state.settings.collaborationEnabled,
        mode: state.settings.collaborationMode,
        members: reconcileCollaborationMembers(state.settings.collaborationMembers),
        calendarPermissions: normalizeCalendarPermissions(state.settings.collaborationCalendarPermissions)
      };
      const snapshot = JSON.stringify({
        profiles: state.profiles,
        calendars: state.calendars,
        events: state.events,
        templates: state.templates,
        collaboration
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
        templates: state.templates,
        collaboration
      });
    };
    void broadcast();
    return () => {
      cancelled = true;
    };
  }, [
    state?.profiles,
    state?.calendars,
    state?.events,
    state?.templates,
    state?.settings.collaborationEnabled,
    state?.settings.collaborationMode,
    state?.settings.collaborationMembers,
    state?.settings.collaborationCalendarPermissions
  ]);

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
    if (!guardWorkspaceWrite('createProfile')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const createDecoyProfile = useCallback((name: string) => {
    if (!guardWorkspaceWrite('createDecoyProfile')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const resetProfile = useCallback((profileId: string) => {
    if (!guardWorkspaceWrite('resetProfile')) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const calendars = createSeedCalendars(profileId);
      const removedCalendarIds = prev.calendars
        .filter((item) => item.profileId === profileId)
        .map((item) => item.id);
      const nextPermissions = {
        ...(prev.settings.collaborationCalendarPermissions ?? {})
      };
      removedCalendarIds.forEach((calendarId) => {
        delete nextPermissions[calendarId];
      });
      return {
        ...prev,
        calendars: [...prev.calendars.filter((item) => item.profileId !== profileId), ...calendars],
        events: prev.events.filter((item) => item.profileId !== profileId),
        settings: {
          ...prev.settings,
          collaborationCalendarPermissions: normalizeCalendarPermissions(nextPermissions)
        }
      };
    });
    logAuditEvent({ action: 'profile.reset', category: 'profile', metadata: { profileId } });
  }, [guardWorkspaceWrite]);

  const updateProfileName = useCallback((profileId: string, name: string) => {
    if (!guardWorkspaceWrite('updateProfileName')) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        profiles: prev.profiles.map((profile) =>
          profile.id === profileId ? { ...profile, name, displayName: name, updatedAt: nowIso() } : profile
        )
      };
    });
    logAuditEvent({ action: 'profile.updated', category: 'profile', metadata: { profileId } });
  }, [guardWorkspaceWrite]);

  const updateProfileDetails = useCallback(
    (
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
    ) => {
      if (!guardWorkspaceWrite('updateProfileDetails')) {
        return;
      }
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          profiles: prev.profiles.map((profile) =>
            profile.id === profileId ? { ...profile, ...updates, updatedAt: nowIso() } : profile
          )
        };
      });
      logAuditEvent({ action: 'profile.customized', category: 'profile', metadata: { profileId } });
    },
    [guardWorkspaceWrite]
  );

  const createCalendar = useCallback((profileId: string, payload: { name: string; color: string }) => {
    if (!guardWorkspaceWrite('createCalendar')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const renameCalendar = useCallback((profileId: string, calendarId: string, name: string) => {
    if (!guardWorkspaceWrite('renameCalendar')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const recolorCalendar = useCallback((profileId: string, calendarId: string, color: string) => {
    if (!guardWorkspaceWrite('recolorCalendar')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const deleteCalendar = useCallback((profileId: string, calendarId: string) => {
    if (!guardWorkspaceWrite('deleteCalendar')) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const next = deleteCalendarFromState(profileId, calendarId, prev.calendars, prev.events);
      const nextPermissions = {
        ...(prev.settings.collaborationCalendarPermissions ?? {})
      };
      delete nextPermissions[calendarId];
      return {
        ...prev,
        calendars: next.calendars,
        events: next.events,
        settings: {
          ...prev.settings,
          collaborationCalendarPermissions: normalizeCalendarPermissions(nextPermissions)
        }
      };
    });
    logAuditEvent({ action: 'calendar.deleted', category: 'calendar', metadata: { calendarId, profileId } });
  }, [guardWorkspaceWrite]);

  const toggleCalendarVisibility = useCallback((calendarId: string) => {
    if (!guardWorkspaceWrite('toggleCalendarVisibility')) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        calendars: prev.calendars.map((calendar) =>
          calendar.id === calendarId
            ? { ...calendar, isVisible: !calendar.isVisible, updatedAt: nowIso() }
            : calendar
        )
      };
    });
  }, [guardWorkspaceWrite]);

  const upsertEvent = useCallback((event: CalendarEvent) => {
    if (!guardWorkspaceWrite('upsertEvent')) {
      return;
    }
    if (!guardCalendarWrite('upsertEvent', event.calendarId)) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const existing = prev.events.find((item) => item.id === event.id);
      if (!existing) {
        return {
          ...prev,
          events: [...prev.events, { ...event, updatedAt: nowIso() }]
        };
      }
      return {
        ...prev,
        events: prev.events.map((item) => (item.id === event.id ? { ...event, updatedAt: nowIso() } : item))
      };
    });
    logAuditEvent({
      action: 'event.upserted',
      category: 'event',
      metadata: { eventId: event.id, profileId: event.profileId }
    });
  }, [guardCalendarWrite, guardWorkspaceWrite]);

  const deleteEvent = useCallback((eventId: string) => {
    if (!guardWorkspaceWrite('deleteEvent')) {
      return;
    }
    const current = stateRef.current;
    const target = current?.events.find((event) => event.id === eventId);
    if (target && !guardCalendarWrite('deleteEvent', target.calendarId)) {
      return;
    }
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
  }, [guardCalendarWrite, guardWorkspaceWrite]);

  const createTemplate = useCallback((template: Omit<EventTemplate, 'id' | 'createdAt'>) => {
    if (!guardWorkspaceWrite('createTemplate')) {
      return;
    }
    const nextTemplate: EventTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso()
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
  }, [guardWorkspaceWrite]);

  const updateTemplate = useCallback((templateId: string, updates: Partial<EventTemplate>) => {
    if (!guardWorkspaceWrite('updateTemplate')) {
      return;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        templates: prev.templates.map((template) =>
          template.id === templateId ? { ...template, ...updates, updatedAt: nowIso() } : template
        )
      };
    });
    logAuditEvent({ action: 'template.updated', category: 'template', metadata: { templateId } });
  }, [guardWorkspaceWrite]);

  const deleteTemplate = useCallback((templateId: string) => {
    if (!guardWorkspaceWrite('deleteTemplate')) {
      return;
    }
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
  }, [guardWorkspaceWrite]);

  const inviteCollaborator = useCallback(
    (name: string, contact: string, role: CollaborationRole, options?: { expiresInHours?: number }) => {
      if (!guardCollaborationAdmin('inviteCollaborator')) {
        return;
      }
      const trimmedName = name.trim();
      const trimmedContact = contact.trim();
      if (!trimmedName || !trimmedContact) {
        return;
      }
      const now = nowIso();
      const expiresInHours = Math.max(1, Math.min(30 * 24, Math.floor(options?.expiresInHours ?? 7 * 24)));
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
      const normalizedContact = normalizeContact(trimmedContact);
      const inviteCode = createInviteCode();
      const inviteLink =
        typeof window !== 'undefined'
          ? `${window.location.origin}${(import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')}` +
            `safety?invite=${encodeURIComponent(inviteCode)}&expires=${encodeURIComponent(expiresAt)}`
          : undefined;
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        const existingIndex = prev.settings.collaborationMembers.findIndex(
          (member) => normalizeContact(member.contact) === normalizedContact
        );
        const nextMember: CollaborationMember = {
          id: crypto.randomUUID(),
          name: trimmedName,
          contact: trimmedContact,
          role,
          status: 'invited',
          presence: 'offline',
          inviteCode,
          inviteLink,
          invitedAt: now,
          inviteExpiresAt: expiresAt
        };
        const nextMembers: CollaborationMember[] =
          existingIndex >= 0
            ? prev.settings.collaborationMembers.map((member, index) =>
                index === existingIndex
                  ? {
                      ...member,
                      name: trimmedName,
                      role,
                      status: 'invited' as const,
                      presence: 'offline',
                      inviteCode,
                      inviteLink,
                      invitedAt: now,
                      inviteExpiresAt: expiresAt,
                      inviteAcceptedAt: undefined,
                      joinedAt: undefined,
                      lastSeenAt: undefined
                    }
                  : member
              )
            : [...prev.settings.collaborationMembers, nextMember];
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationMembers: reconcileCollaborationMembers(nextMembers)
          }
        };
      });
      logAuditEvent({
        action: 'collaboration.member_invited',
        category: 'collaboration',
        metadata: { contact: trimmedContact, role, inviteCode, expiresAt }
      });
    },
    [guardCollaborationAdmin]
  );

  const acceptCollaboratorInvite = useCallback((inviteCode: string) => {
    const trimmedCode = inviteCode.trim().toUpperCase();
    if (!trimmedCode) {
      return false;
    }
    const current = stateRef.current;
    if (!current) {
      return false;
    }
    const matchingMember = current.settings.collaborationMembers.find(
      (member) => (member.inviteCode ?? '').toUpperCase() === trimmedCode
    );
    if (!matchingMember) {
      return false;
    }
    if (matchingMember.inviteExpiresAt && toMillis(matchingMember.inviteExpiresAt) < Date.now()) {
      return false;
    }
    setState((prev) => {
      if (!prev) {
        return prev;
      }
      const now = nowIso();
      const nextMembers = prev.settings.collaborationMembers.map((member) => {
        if ((member.inviteCode ?? '').toUpperCase() !== trimmedCode) {
          return member;
        }
        return {
          ...member,
          status: 'active' as const,
          presence: 'online' as const,
          inviteAcceptedAt: now,
          joinedAt: member.joinedAt ?? now,
          lastSeenAt: now
        };
      });
      return {
        ...prev,
        settings: {
          ...prev.settings,
          collaborationMembers: reconcileCollaborationMembers(nextMembers)
        }
      };
    });
    logAuditEvent({
      action: 'collaboration.invite_accepted',
      category: 'collaboration',
      metadata: { inviteCode: trimmedCode }
    });
    return true;
  }, []);

  const updateCollaborator = useCallback(
    (memberId: string, updates: Partial<CollaborationMember>) => {
      if (!guardCollaborationAdmin('updateCollaborator')) {
        return;
      }
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationMembers: reconcileCollaborationMembers(
              prev.settings.collaborationMembers.map((member) =>
                member.id === memberId
                  ? {
                      ...member,
                      ...updates,
                      contact: updates.contact ? updates.contact.trim() : member.contact,
                      name: updates.name ? updates.name.trim() : member.name,
                      lastSeenAt: updates.status === 'active' ? updates.lastSeenAt ?? nowIso() : member.lastSeenAt
                    }
                  : member
              )
            )
          }
        };
      });
      logAuditEvent({ action: 'collaboration.member_updated', category: 'collaboration', metadata: { memberId } });
    },
    [guardCollaborationAdmin]
  );

  const removeCollaborator = useCallback(
    (memberId: string) => {
      if (!guardCollaborationAdmin('removeCollaborator')) {
        return;
      }
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationMembers: reconcileCollaborationMembers(
              prev.settings.collaborationMembers.filter((member) => member.id !== memberId)
            )
          }
        };
      });
      logAuditEvent({ action: 'collaboration.member_removed', category: 'collaboration', metadata: { memberId } });
    },
    [guardCollaborationAdmin]
  );

  const setCollaborationRole = useCallback(
    (role: CollaborationRole) => {
      setState((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            collaborationRole: role
          }
        };
      });
      logAuditEvent({ action: 'collaboration.role_set', category: 'collaboration', metadata: { role } });
    },
    []
  );

  const ensureTwoFactor = useCallback(async (): Promise<TwoFactorStatus> => {
    if (!state?.settings.twoFactorEnabled) {
      return 'clear';
    }
    if (availableTwoFactorModes.length === 0) {
      return 'failed';
    }
    if (twoFactorVerified) {
      return 'clear';
    }
    if (!twoFactorPending) {
      setTwoFactorPending(true);
      try {
        if (activeTwoFactorMode === 'totp') {
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
    activeTwoFactorMode,
    availableTwoFactorModes.length,
    state?.securityPrefs.totpSecret,
    state?.settings.twoFactorChannel,
    state?.settings.twoFactorDestination,
    state?.settings.twoFactorEnabled,
    twoFactorPending,
    twoFactorVerified
  ]);

  const setTwoFactorMode = useCallback(
    async (mode: TwoFactorMethod) => {
      if (!availableTwoFactorModes.includes(mode)) {
        return;
      }
      setSelectedTwoFactorMode(mode);
      updateSettings({ twoFactorMode: mode });
      if (!twoFactorPending) {
        return;
      }
      if (mode === 'otp') {
        try {
          await startTwoFactorChallenge(state?.settings.twoFactorChannel ?? 'email', state?.settings.twoFactorDestination);
        } catch {
          setTwoFactorPending(false);
        }
      }
    },
    [
      availableTwoFactorModes,
      state?.settings.twoFactorChannel,
      state?.settings.twoFactorDestination,
      twoFactorPending,
      updateSettings
    ]
  );

  const unlock = useCallback(
    async (secret?: string, method: UnlockSecretMethod = 'auto') => {
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
      const allowPinChecks = method === 'auto' || method === 'pin';
      const allowPassphraseChecks = method === 'auto' || method === 'passphrase';
      const allowRecoveryChecks = method === 'auto' || method === 'recovery';
      const matchesPrimary =
        allowPinChecks &&
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
        allowPinChecks &&
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
        allowPassphraseChecks &&
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
      const matchesRecovery =
        allowRecoveryChecks &&
        state.securityPrefs.recoveryCodeHash &&
        state.securityPrefs.recoveryCodeSalt
          ? await verifyRecoveryCode(secret, {
              hash: state.securityPrefs.recoveryCodeHash,
              salt: state.securityPrefs.recoveryCodeSalt,
              iterations: state.securityPrefs.recoveryCodeIterations ?? 180000
            })
          : false;
      if (matchesRecovery) {
        const usedAt = nowIso();
        setState((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            securityPrefs: {
              ...prev.securityPrefs,
              recoveryCodeHash: undefined,
              recoveryCodeSalt: undefined,
              recoveryCodeIterations: undefined,
              recoveryCodeUsedAt: usedAt
            }
          };
        });
        setLocked(false);
        setTwoFactorPending(false);
        setTwoFactorVerified(false);
        clearTwoFactorSession();
        logAuditEvent({ action: 'auth.recovery_unlocked', category: 'auth' });
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
        activeTwoFactorMode === 'totp' && state?.securityPrefs.totpSecret
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
    [activeTwoFactorMode, state?.securityPrefs.totpSecret]
  );

  const resendTwoFactor = useCallback(async () => {
    if (!state?.settings.twoFactorEnabled || activeTwoFactorMode !== 'otp') {
      return;
    }
    await startTwoFactorChallenge(state.settings.twoFactorChannel, state.settings.twoFactorDestination);
  }, [
    activeTwoFactorMode,
    state?.settings.twoFactorChannel,
    state?.settings.twoFactorDestination,
    state?.settings.twoFactorEnabled
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
    if (!guardWorkspaceWrite('replaceState')) {
      return;
    }
    const normalizedNext: AppState = {
      ...next,
      profiles: next.profiles.map((profile) => ({
        ...profile,
        updatedAt: profile.updatedAt ?? profile.createdAt ?? nowIso()
      })),
      calendars: next.calendars.map((calendar) => ({
        ...calendar,
        updatedAt: calendar.updatedAt ?? calendar.createdAt ?? nowIso()
      })),
      events: next.events.map((event) => ({
        ...event,
        updatedAt: event.updatedAt ?? event.end ?? event.start ?? nowIso()
      })),
      templates: next.templates.map((template) => ({
        ...template,
        updatedAt: template.updatedAt ?? template.createdAt ?? nowIso()
      })),
      settings: {
        ...next.settings,
        syncConflictPolicy: next.settings.syncConflictPolicy ?? 'last-write-wins',
        twoFactorOtpEnabled:
          next.settings.twoFactorOtpEnabled ??
          (next.settings.twoFactorEnabled && next.settings.twoFactorMode === 'otp'),
        twoFactorTotpEnabled:
          next.settings.twoFactorTotpEnabled ??
          (next.settings.twoFactorEnabled && next.settings.twoFactorMode === 'totp'),
        collaborationMembers: reconcileCollaborationMembers(next.settings.collaborationMembers ?? []),
        collaborationCalendarPermissions: normalizeCalendarPermissions(
          next.settings.collaborationCalendarPermissions
        ),
        backupKeyVersion: Math.max(1, Number(next.settings.backupKeyVersion ?? 1)),
        backupKeyRotatedAt: next.settings.backupKeyRotatedAt ?? undefined
      }
    };
    setState(normalizedNext);
  }, [guardWorkspaceWrite]);

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
      if (!guardWorkspaceWrite('importEncrypted')) {
        return;
      }
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
        syncConflictPolicy: decrypted.settings.syncConflictPolicy ?? 'last-write-wins',
        collaborationRole: decrypted.settings.collaborationRole ?? 'owner',
        collaborationMembers: reconcileCollaborationMembers(decrypted.settings.collaborationMembers ?? []),
        collaborationCalendarPermissions: normalizeCalendarPermissions(
          decrypted.settings.collaborationCalendarPermissions
        ),
        twoFactorOtpEnabled:
          decrypted.settings.twoFactorOtpEnabled ??
          (decrypted.settings.twoFactorEnabled && (decrypted.settings.twoFactorMode ?? 'otp') === 'otp'),
        twoFactorTotpEnabled:
          decrypted.settings.twoFactorTotpEnabled ??
          (decrypted.settings.twoFactorEnabled && (decrypted.settings.twoFactorMode ?? 'otp') === 'totp'),
        backupKeyVersion: Math.max(1, Number(decrypted.settings.backupKeyVersion ?? 1)),
        backupKeyRotatedAt: decrypted.settings.backupKeyRotatedAt ?? undefined,
        activeProfileId: activeProfileExists
          ? decrypted.settings.activeProfileId
          : decrypted.profiles[0]?.id ?? decrypted.settings.activeProfileId
      };
      const normalizedImportedState: AppState = {
        profiles: decrypted.profiles.map((profile) => ({
          ...profile,
          updatedAt: profile.updatedAt ?? profile.createdAt ?? nowIso()
        })),
        calendars: (decrypted.calendars ?? []).map((calendar) => ({
          ...calendar,
          updatedAt: calendar.updatedAt ?? calendar.createdAt ?? nowIso()
        })),
        events: (decrypted.events ?? []).map((event) => ({
          ...event,
          updatedAt: event.updatedAt ?? event.end ?? event.start ?? nowIso()
        })),
        templates: (decrypted.templates ?? []).map((template) => ({
          ...template,
          updatedAt: template.updatedAt ?? template.createdAt ?? nowIso()
        })),
        settings,
        securityPrefs: {
          ...baseSecurityPrefs,
          ...decrypted.securityPrefs
        }
      };
      setState(normalizedImportedState);
      const preferredMode = getDefaultTwoFactorMethod(normalizedImportedState.settings, normalizedImportedState.securityPrefs);
      if (preferredMode) {
        setSelectedTwoFactorMode(preferredMode);
      }
      setLocked(
        Boolean(
          normalizedImportedState.securityPrefs.pinEnabled ||
            normalizedImportedState.securityPrefs.decoyPinEnabled ||
            normalizedImportedState.securityPrefs.localAuthEnabled ||
            normalizedImportedState.securityPrefs.webAuthnEnabled ||
            normalizedImportedState.settings.biometricEnabled ||
            normalizedImportedState.settings.twoFactorEnabled
        )
      );
    },
    [guardWorkspaceWrite]
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
      twoFactorMode: activeTwoFactorMode,
      availableTwoFactorModes,
      setTwoFactorMode,
      verifyTwoFactor,
      resendTwoFactor,
      updateSettings,
      updateSecurityPrefs,
      canEditWorkspace,
      canManageCollaboration,
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
      inviteCollaborator,
      acceptCollaboratorInvite,
      updateCollaborator,
      removeCollaborator,
      setCollaborationRole,
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
      activeTwoFactorMode,
      availableTwoFactorModes,
      setTwoFactorMode,
      verifyTwoFactor,
      resendTwoFactor,
      updateSettings,
      updateSecurityPrefs,
      canEditWorkspace,
      canManageCollaboration,
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
      inviteCollaborator,
      acceptCollaboratorInvite,
      updateCollaborator,
      removeCollaborator,
      setCollaborationRole,
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
