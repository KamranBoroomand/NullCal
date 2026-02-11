import type { Calendar, CalendarEvent, EventTemplate, Profile } from '../storage/types';

export type SyncPayload = {
  profiles: Profile[];
  calendars: Calendar[];
  events: CalendarEvent[];
  templates: EventTemplate[];
};

export type SyncMessage = {
  senderId: string;
  payload: SyncPayload;
  sentAt: number;
  revision?: number;
};

export type SyncHandle = {
  broadcast: (payload: SyncPayload) => void;
  close: () => void;
};
