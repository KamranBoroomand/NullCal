export type Calendar = {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarId: string;
  location?: string;
  notes?: string;
};

export type Profile = {
  id: string;
  name: string;
  calendars: Calendar[];
  events: CalendarEvent[];
};

export type StorageState = {
  version: 1;
  profiles: Profile[];
  activeProfileId: string;
};

export type EventDraft = Omit<CalendarEvent, 'id'> & { id?: string };
