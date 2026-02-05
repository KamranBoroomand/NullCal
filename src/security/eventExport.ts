import type { Calendar, CalendarEvent, Profile } from '../storage/types';

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

export const buildCsv = (events: CalendarEvent[], calendars: Calendar[]) => {
  const calendarLookup = new Map(calendars.map((calendar) => [calendar.id, calendar.name]));
  const header = [
    'title',
    'start',
    'end',
    'calendar',
    'location',
    'notes',
    'label',
    'icon',
    'reminderRule'
  ];
  const rows = events.map((event) => [
    event.title,
    event.start,
    event.end,
    calendarLookup.get(event.calendarId) ?? '',
    event.location ?? '',
    event.notes ?? '',
    event.label ?? '',
    event.icon ?? '',
    event.reminderRule ?? ''
  ]);
  return [header.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
};

const formatIcsDate = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

export const buildIcs = (events: CalendarEvent[], profile: Profile | null) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NullCal//EN',
    `X-WR-CALNAME:${profile?.displayName ?? profile?.name ?? 'NullCal Calendar'}`
  ];
  events.forEach((event) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@nullcal`);
    lines.push(`DTSTART:${formatIcsDate(event.start)}`);
    lines.push(`DTEND:${formatIcsDate(event.end)}`);
    lines.push(`SUMMARY:${event.title || 'Untitled event'}`);
    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }
    if (event.notes) {
      lines.push(`DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}`);
    }
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

export const buildJson = (events: CalendarEvent[], calendars: Calendar[], profile: Profile | null) =>
  JSON.stringify(
    {
      profile: profile ? { id: profile.id, name: profile.displayName ?? profile.name } : null,
      calendars,
      events
    },
    null,
    2
  );
