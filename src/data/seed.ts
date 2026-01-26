import { nanoid } from 'nanoid';
import type { Calendar, CalendarEvent, Profile } from './types';

const calendarPresets = [
  { name: 'Work', color: '#ff6b3d' },
  { name: 'Personal', color: '#5bbcff' },
  { name: 'Gym', color: '#9c7dff' }
];

export const createSeedCalendars = (): Calendar[] =>
  calendarPresets.map((calendar) => ({
    id: nanoid(),
    name: calendar.name,
    color: calendar.color,
    isVisible: true,
    createdAt: new Date().toISOString()
  }));

export const createSeedEvents = (_calendars: Calendar[]): CalendarEvent[] => [];

export const createSeedProfile = (name: string): Profile => {
  const calendars = createSeedCalendars();
  return {
    id: nanoid(),
    name,
    calendars,
    events: createSeedEvents(calendars)
  };
};
