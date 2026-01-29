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
};

export type AppState = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  settings: AppSettings;
  securityPrefs: SecurityPrefs;
};
