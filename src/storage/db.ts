import { openDB, type DBSchema } from 'idb';
import type { AppSettings, Calendar, CalendarEvent, Profile, SecurityPrefs } from './types';

export const DB_NAME = 'nullcal-db';
export const DB_VERSION = 1;

interface NullCalDB extends DBSchema {
  profiles: {
    key: string;
    value: Profile;
  };
  calendars: {
    key: string;
    value: Calendar;
    indexes: { 'by-profile': string };
  };
  events: {
    key: string;
    value: CalendarEvent;
    indexes: { 'by-profile': string; 'by-calendar': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  securityPrefs: {
    key: string;
    value: SecurityPrefs;
  };
}

export const openNullCalDB = () =>
  openDB<NullCalDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('calendars')) {
        const store = db.createObjectStore('calendars', { keyPath: 'id' });
        store.createIndex('by-profile', 'profileId');
      }
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'id' });
        store.createIndex('by-profile', 'profileId');
        store.createIndex('by-calendar', 'calendarId');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('securityPrefs')) {
        db.createObjectStore('securityPrefs', { keyPath: 'id' });
      }
    }
  });
