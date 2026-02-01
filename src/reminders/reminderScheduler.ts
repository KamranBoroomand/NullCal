import type { CalendarEvent } from '../storage/types';

type ReminderHandle = {
  stop: () => void;
};

const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

export const scheduleReminders = (events: CalendarEvent[]): ReminderHandle => {
  const timeouts: number[] = [];

  if (Notification.permission === 'default') {
    void Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') {
    return { stop: () => {} };
  }

  const now = Date.now();
  events.forEach((event) => {
    const start = new Date(event.start).getTime();
    const delay = start - now;
    if (delay <= 0 || delay > MAX_LOOKAHEAD_MS) {
      return;
    }
    const timeout = window.setTimeout(() => {
      new Notification(event.title || 'Upcoming event', {
        body: event.location ? `${event.location}` : 'Event starting now'
      });
    }, delay);
    timeouts.push(timeout);
  });

  return {
    stop: () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    }
  };
};
