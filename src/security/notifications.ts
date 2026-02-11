type NotificationChannel = 'email' | 'sms';

type NotificationPayload = {
  channel: NotificationChannel;
  to: string;
  message: string;
  subject?: string;
  metadata?: Record<string, string>;
};

const configuredApiBase = import.meta.env.VITE_NOTIFICATION_API?.trim();
const API_BASE = (configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : '/api').replace(
  /\/+$/,
  ''
);

const sendNotification = async (payload: NotificationPayload) => {
  const response = await fetch(`${API_BASE}/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
