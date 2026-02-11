type NotificationChannel = 'email' | 'sms';

type NotificationPayload = {
  channel: NotificationChannel;
  to: string;
  message: string;
  subject?: string;
  metadata?: Record<string, string>;
};

const DEFAULT_NOTIFICATION_API = '/api';
const configuredApiBase = import.meta.env.VITE_NOTIFICATION_API?.trim();
const configuredRequestToken = import.meta.env.VITE_NOTIFICATION_TOKEN?.trim();
const API_BASE = (
  configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : DEFAULT_NOTIFICATION_API
).replace(/\/+$/, '');

const sendNotification = async (payload: NotificationPayload) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (configuredRequestToken) {
    headers['X-Nullcal-Token'] = configuredRequestToken;
    headers.Authorization = `Bearer ${configuredRequestToken}`;
  }
  const response = await fetch(`${API_BASE}/notify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Notification delivery failed.');
  }
};

export const sendTwoFactorCode = async (
  channel: NotificationChannel,
  destination: string,
  code: string
) => {
  const message = `NullCal verification code: ${code}. It expires in 10 minutes.`;
  const subject = channel === 'email' ? 'NullCal verification code' : undefined;
  await sendNotification({ channel, to: destination, message, subject, metadata: { purpose: '2fa' } });
};

export const sendReminder = async (
  channel: NotificationChannel,
  destination: string,
  message: string
) => {
  const subject = channel === 'email' ? 'NullCal event reminder' : undefined;
  await sendNotification({ channel, to: destination, message, subject, metadata: { purpose: 'reminder' } });
};
