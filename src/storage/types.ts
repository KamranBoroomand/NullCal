export type Profile = {
  id: string;
  name: string;
  displayName?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  preferredNotification?: 'sms' | 'email';
  createdAt: string;
  updatedAt?: string;
};

export type Calendar = {
  id: string;
  profileId: string;
  name: string;
  color: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CalendarEvent = {
  id: string;
  profileId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  updatedAt?: string;
  location?: string;
  notes?: string;
  label?: string;
  icon?: string;
  reminderRule?: string;
  recurrenceRule?: string;
  attendees?: string[];
};

export type EventTemplate = {
  id: string;
  profileId: string;
  name: string;
  title: string;
  durationMinutes: number;
  updatedAt?: string;
  location?: string;
  notes?: string;
  label?: string;
  icon?: string;
  reminderRule?: string;
  recurrenceRule?: string;
  attendees?: string[];
  defaultCalendarId?: string;
  createdAt: string;
};

export type CollaborationRole = 'owner' | 'editor' | 'viewer';
export type CollaborationPresence = 'online' | 'away' | 'offline';

export type CollaborationMember = {
  id: string;
  name: string;
  contact: string;
  role: CollaborationRole;
  status: 'invited' | 'active';
  presence?: CollaborationPresence;
  inviteCode?: string;
  invitedAt: string;
  inviteAcceptedAt?: string;
  inviteExpiresAt?: string;
  joinedAt?: string;
  lastSeenAt?: string;
};

export type AppSettings = {
  id: 'app';
  theme: 'dark' | 'light';
  palette: string;
  language: 'en' | 'ru' | 'fa';
  activeProfileId: string;
  primaryProfileId: string;
  decoyProfileId?: string;
  networkLock: boolean;
  secureMode: boolean;
  blurSensitive: boolean;
  scanlines: boolean;
  autoLockMinutes: number;
  autoLockOnBlur: boolean;
  autoLockGraceSeconds: number;
  switchToDecoyOnBlur: boolean;
  privacyScreenHotkeyEnabled: boolean;
  syncStrategy: 'offline' | 'ipfs' | 'p2p';
  syncTrustedDevices: boolean;
  syncShareToken?: string;
  syncConflictPolicy: 'last-write-wins' | 'prefer-local' | 'prefer-remote';
  tamperProofLog: boolean;
  twoFactorEnabled: boolean;
  twoFactorMode: 'otp' | 'totp';
  twoFactorOtpEnabled: boolean;
  twoFactorTotpEnabled: boolean;
  twoFactorChannel: 'email' | 'sms';
  twoFactorDestination?: string;
  biometricEnabled: boolean;
  encryptedNotes: boolean;
  encryptedAttachments: boolean;
  encryptedSharingEnabled: boolean;
  eventObfuscation: boolean;
  reminderChannel: 'local' | 'signal' | 'telegram' | 'email' | 'sms' | 'push';
  remindersEnabled: boolean;
  notificationEmail?: string;
  notificationPhone?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  signalWebhookUrl?: string;
  collaborationMode: 'private' | 'shared' | 'team';
  collaborationEnabled: boolean;
  collaborationRole: CollaborationRole;
  collaborationMembers: CollaborationMember[];
  notesShareToken?: string;
  lastExportAt?: string;
  highContrast?: boolean;
  textScale?: number;
  keyboardNavigation?: boolean;
  cacheEnabled?: boolean;
  cacheTtlMinutes?: number;
  additionalTimeZones?: string[];
};

export type SecurityPrefs = {
  id: 'security';
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinIterations?: number;
  decoyPinEnabled: boolean;
  decoyPinHash?: string;
  decoyPinSalt?: string;
  decoyPinIterations?: number;
  localAuthEnabled: boolean;
  localAuthHash?: string;
  localAuthSalt?: string;
  localAuthIterations?: number;
  webAuthnEnabled: boolean;
  webAuthnCredentialId?: string;
  biometricCredentialId?: string;
  totpEnabled?: boolean;
  totpSecret?: string;
};

export type AppState = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  templates: EventTemplate[];
  settings: AppSettings;
  securityPrefs: SecurityPrefs;
};
