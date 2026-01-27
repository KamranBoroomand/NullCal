import type { Calendar, CalendarEvent } from '../storage/types';

type SnapshotInput = {
  calendars: Calendar[];
  events: CalendarEvent[];
};

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const record = value as Record<string, unknown>;
        const nextValue = record[key];
        if (nextValue === undefined) {
          return acc;
        }
        acc[key] = sortValue(nextValue);
        return acc;
      }, {});
  }
  return value;
};

const stableStringify = (value: unknown) => JSON.stringify(sortValue(value));

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export const canonicalSnapshot = ({ calendars, events }: SnapshotInput) => {
  const snapshot = {
    calendars: [...calendars]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((calendar) => ({
        id: calendar.id,
        name: calendar.name,
        color: calendar.color,
        isVisible: calendar.isVisible
      })),
    events: [...events]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((event) => ({
        id: event.id,
        calendarId: event.calendarId,
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        notes: event.notes,
        allDay: (event as CalendarEvent & { allDay?: boolean }).allDay
      }))
  };

  return stableStringify(snapshot);
};

export const hashSnapshot = async (snapshot: string) => {
  const encoded = new TextEncoder().encode(snapshot);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(digest);
};
