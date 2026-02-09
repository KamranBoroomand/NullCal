import type { AppSettings, CalendarEvent } from '../storage/types';
import { sendSecurePing } from './securePing';
import { parseReminderRule } from './reminderRules';

type ReminderHandle = {
  stop: () => void;
};

const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

export const scheduleReminders = (
  events: CalendarEvent[],
  settings: AppSettings
): ReminderHandle => {
  const timeouts: number[] = [];

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

  const now = Date.now();
  events.forEach((event) => {
    const start = new Date(event.start).getTime();
    const offsetMinutes = parseReminderRule(event.reminderRule);
    const offsetMs = offsetMinutes ? offsetMinutes * 60 * 1000 : 0;
    const delay = start - offsetMs - now;
    if (delay <= 0 || delay > MAX_LOOKAHEAD_MS) {
      return;
    }
    const timeout = window.setTimeout(() => {
      if (settings.reminderChannel === 'local' || settings.reminderChannel === 'push') {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(event.title || 'Upcoming event', {
            body: event.location ? `${event.location}` : 'Event starting now'
          });
        }
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
            // Ignore notification failures.
          });
        return;
      }
      void sendSecurePing(event, settings).catch(() => {
        // Ignore failed pings; UI will surface status separately.
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
