import type { AppSettings, CalendarEvent } from '../storage/types';

const buildReminderMessage = (event: CalendarEvent) => {
  const when = new Date(event.start).toLocaleString();
  const title = event.title || 'Upcoming event';
  const location = event.location ? ` @ ${event.location}` : '';
  return `${title}${location} — ${when}`;
};

export const sendSecurePing = async (event: CalendarEvent, settings: AppSettings) => {
  const message = buildReminderMessage(event);

  if (settings.reminderChannel === 'telegram') {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      throw new Error('Telegram settings missing.');
    }
    const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message
      })
    });
    if (!response.ok) {
      throw new Error('Telegram reminder delivery failed.');
    }
    return;
  }

  if (settings.reminderChannel === 'signal') {
    if (!settings.signalWebhookUrl) {
      throw new Error('Signal webhook missing.');
    }
    const response = await fetch(settings.signalWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) {
      throw new Error('Signal reminder delivery failed.');
    }
  }
};
