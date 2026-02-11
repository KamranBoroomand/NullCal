import type { AppSettings, CalendarEvent } from '../storage/types';
import { sendSecurePing } from './securePing';
import { parseReminderRule } from './reminderRules';

type ReminderHandle = {
  stop: () => void;
};

const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const RESCAN_INTERVAL_MS = 15 * 60 * 1000;

const showLocalReminder = (event: CalendarEvent, body?: string) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }
  new Notification(event.title || 'Upcoming event', {
    body: body ?? (event.location ? `${event.location}` : 'Event starting now')
  });
};

export const scheduleReminders = (
  events: CalendarEvent[],
  settings: AppSettings
): ReminderHandle => {
  const timeouts = new Map<string, number>();

  if (settings.reminderChannel === 'local' || settings.reminderChannel === 'push') {
    if (typeof Notification === 'undefined') {
      return { stop: () => {} };
    }
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    if (Notification.permission === 'denied') {
      return { stop: () => {} };
    }
  }

  const scheduleEvent = (event: CalendarEvent) => {
    const existingTimeout = timeouts.get(event.id);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
      timeouts.delete(event.id);
    }

    const now = Date.now();
    const start = new Date(event.start).getTime();
    const offsetMinutes = parseReminderRule(event.reminderRule);
    const offsetMs = offsetMinutes ? offsetMinutes * 60 * 1000 : 0;
    const delay = start - offsetMs - now;
    if (delay <= 0 || delay > MAX_LOOKAHEAD_MS) {
      return;
    }
    const timeout = window.setTimeout(() => {
      timeouts.delete(event.id);
      if (settings.reminderChannel === 'local' || settings.reminderChannel === 'push') {
        showLocalReminder(event);
        return;
      }
      if (settings.reminderChannel === 'email' || settings.reminderChannel === 'sms') {
        const destination =
          settings.reminderChannel === 'email' ? settings.notificationEmail : settings.notificationPhone;
        if (!destination) {
          return;
        }
        const message = `${event.title || 'Upcoming event'} — ${new Date(event.start).toLocaleString()}`;
        void import('../security/notifications')
          .then(({ sendReminder }) =>
            sendReminder(settings.reminderChannel as 'email' | 'sms', destination, message)
          )
          .catch(() => {
            // Fall back to local reminder when remote notification delivery is unavailable.
            showLocalReminder(event, message);
          });
        return;
      }
      void sendSecurePing(event, settings).catch(() => {
        // Ignore failed pings; UI will surface status separately.
      });
    }, delay);
    timeouts.set(event.id, timeout);
  };

  const runScan = () => {
    const activeIds = new Set(events.map((event) => event.id));
    Array.from(timeouts.entries()).forEach(([eventId, timeout]) => {
      if (!activeIds.has(eventId)) {
        window.clearTimeout(timeout);
        timeouts.delete(eventId);
      }
    });
    events.forEach((event) => scheduleEvent(event));
  };

  runScan();
  const interval = window.setInterval(runScan, RESCAN_INTERVAL_MS);

  return {
    stop: () => {
      window.clearInterval(interval);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      timeouts.clear();
    }
  };
};
