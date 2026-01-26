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
  activeProfileId: string;
  networkLock: boolean;
  secureMode: boolean;
  blurSensitive: boolean;
  scanlines: boolean;
  autoLockMinutes: number;
  lastExportAt?: string;
};

export type SecurityPrefs = {
  id: 'security';
  pinEnabled: boolean;
  pinHash?: string;
  pinSalt?: string;
  pinIterations?: number;
};

export type AppState = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  settings: AppSettings;
  securityPrefs: SecurityPrefs;
};
