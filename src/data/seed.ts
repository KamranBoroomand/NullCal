import { addHours, addDays, startOfHour } from 'date-fns';
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
    visible: true
  }));

export const createSeedEvents = (calendars: Calendar[]): CalendarEvent[] => {
  const [work, personal] = calendars;
  const start = startOfHour(new Date());

  return [
    {
      id: nanoid(),
      title: 'Weekly sync',
      start: addDays(start, 1).toISOString(),
      end: addHours(addDays(start, 1), 1).toISOString(),
      calendarId: work?.id ?? calendars[0].id,
      location: 'Atrium room',
      notes: 'Photon roadmap + blockers.'
    },
    {
      id: nanoid(),
      title: 'Dinner plans',
      start: addDays(start, 2).toISOString(),
      end: addHours(addDays(start, 2), 2).toISOString(),
      calendarId: personal?.id ?? calendars[0].id,
      location: 'Riverside'
    }
  ];
};

export const createSeedProfile = (name: string): Profile => {
  const calendars = createSeedCalendars();
  return {
    id: nanoid(),
    name,
    calendars,
    events: createSeedEvents(calendars)
  };
};
