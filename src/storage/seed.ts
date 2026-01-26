import { nanoid } from 'nanoid';
import { addDays, addHours, startOfHour } from 'date-fns';
import type { Calendar, CalendarEvent, Profile } from './types';

export const createSeedProfile = (name: string): Profile => ({
  id: nanoid(),
  name,
  createdAt: new Date().toISOString()
});

export const createSeedCalendars = (profileId: string): Calendar[] => [
  {
    id: nanoid(),
    profileId,
    name: 'Operations',
    color: '#f4ff00',
    visible: true
  },
  {
    id: nanoid(),
    profileId,
    name: 'Personal',
    color: '#9bff00',
    visible: true
  },
  {
    id: nanoid(),
    profileId,
    name: 'Recon',
    color: '#6b7cff',
    visible: true
  }
];

export const createSeedEvents = (profileId: string, calendars: Calendar[]): CalendarEvent[] => {
  const now = startOfHour(new Date());
  const [ops, personal, recon] = calendars;
  return [
    {
      id: nanoid(),
      profileId,
      calendarId: ops.id,
      title: 'Briefing: Threat review',
      start: addHours(now, 2).toISOString(),
      end: addHours(now, 3).toISOString(),
      location: 'Ops room',
      notes: 'Coordinate with threat intel team.'
    },
    {
      id: nanoid(),
      profileId,
      calendarId: personal.id,
      title: 'Recovery window',
      start: addHours(now, 6).toISOString(),
      end: addHours(now, 7).toISOString(),
      notes: 'Focus on sleep discipline.'
    },
    {
      id: nanoid(),
      profileId,
      calendarId: recon.id,
      title: 'Field sweep',
      start: addDays(now, 1).toISOString(),
      end: addHours(addDays(now, 1), 2).toISOString(),
      location: 'Sector 3'
    }
  ];
};
