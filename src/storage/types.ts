export type Profile = {
  id: string;
  name: string;
  createdAt: string;
};

export type Calendar = {
  id: string;
  profileId: string;
  name: string;
  color: string;
  isVisible: boolean;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  profileId: string;
  calendarId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  notes?: string;
  label?: string;
  icon?: string;
  reminderRule?: string;
};

export type AppSettings = {
  id: 'app';
  theme: 'dark' | 'light';
  palette: string;
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
  tamperProofLog: boolean;
  twoFactorEnabled: boolean;
  twoFactorChannel: 'email' | 'sms';
  twoFactorDestination?: string;
  biometricEnabled: boolean;
  encryptedNotes: boolean;
  encryptedAttachments: boolean;
  encryptedSharingEnabled: boolean;
  eventObfuscation: boolean;
  reminderChannel: 'local' | 'signal' | 'telegram';
  remindersEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  signalWebhookUrl?: string;
  collaborationMode: 'private' | 'shared' | 'team';
  collaborationEnabled: boolean;
  notesShareToken?: string;
  lastExportAt?: string;
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
};

export type AppState = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  settings: AppSettings;
  securityPrefs: SecurityPrefs;
};
