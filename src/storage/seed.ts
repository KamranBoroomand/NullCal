import { nanoid } from 'nanoid';
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
