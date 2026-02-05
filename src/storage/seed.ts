import { nanoid } from 'nanoid';
import type { Calendar, CalendarEvent, Profile } from './types';

const avatarPalette = ['#f4ff00', '#9bff00', '#6b7cff', '#38f5c8', '#ff6b3d', '#ff4d8d', '#ffd166'];
const avatarEmojis = ['🛰️', '🌒', '🗂️', '🧭', '🧠', '⚡️', '🧪'];

const pickAvatar = (name: string) => {
  const seed = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    avatarColor: avatarPalette[seed % avatarPalette.length],
    avatarEmoji: avatarEmojis[seed % avatarEmojis.length]
  };
};

export const createSeedProfile = (name: string): Profile => ({
  id: nanoid(),
  name,
  displayName: name,
  ...pickAvatar(name),
  createdAt: new Date().toISOString()
});

export const createSeedCalendars = (profileId: string): Calendar[] => [
  {
    id: nanoid(),
    profileId,
    name: 'Operations',
    color: '#f4ff00',
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(),
    profileId,
    name: 'Personal',
    color: '#9bff00',
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(),
    profileId,
    name: 'Recon',
    color: '#6b7cff',
    isVisible: true,
    createdAt: new Date().toISOString()
  }
];

export const createSeedEvents = (_profileId: string, _calendars: Calendar[]): CalendarEvent[] => [];

export const createDecoyCalendars = (profileId: string): Calendar[] => [
  {
    id: nanoid(),
    profileId,
    name: 'Wellness',
    color: '#38f5c8',
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(),
    profileId,
    name: 'Study',
    color: '#6b7cff',
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    id: nanoid(),
    profileId,
    name: 'Errands',
    color: '#ffd166',
    isVisible: true,
    createdAt: new Date().toISOString()
  }
];

export const createDecoyEvents = (profileId: string, calendars: Calendar[]): CalendarEvent[] => {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const build = (offsetDays: number, startHour: number, endHour: number) => {
    const start = new Date(now.getTime() + offsetDays * day);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(now.getTime() + offsetDays * day);
    end.setHours(endHour, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  return [
    {
      id: nanoid(),
      profileId,
      calendarId: calendars[0]?.id ?? nanoid(),
      title: 'Morning Run',
      ...build(1, 7, 8)
    },
    {
      id: nanoid(),
      profileId,
      calendarId: calendars[1]?.id ?? nanoid(),
      title: 'Language Study',
      ...build(2, 18, 19)
    },
    {
      id: nanoid(),
      profileId,
      calendarId: calendars[2]?.id ?? nanoid(),
      title: 'Grocery Run',
      ...build(3, 16, 17)
    },
    {
      id: nanoid(),
      profileId,
      calendarId: calendars[1]?.id ?? nanoid(),
      title: 'Reading Session',
      ...build(4, 20, 21)
    }
  ];
};
