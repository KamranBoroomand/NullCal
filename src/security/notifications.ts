type NotificationChannel = 'email' | 'sms';

type NotificationPayload = {
  channel: NotificationChannel;
  to: string;
  message: string;
  subject?: string;
  metadata?: Record<string, string>;
};

type SendNotificationOptions = {
  queueOnFailure?: boolean;
};

const DEFAULT_NOTIFICATION_API = '/api';
const configuredApiBase = import.meta.env.VITE_NOTIFICATION_API?.trim();
const configuredRequestToken = import.meta.env.VITE_NOTIFICATION_TOKEN?.trim();
const API_BASE = (
  configuredApiBase && configuredApiBase.length > 0 ? configuredApiBase : DEFAULT_NOTIFICATION_API
).replace(/\/+$/, '');
const PENDING_QUEUE_KEY = 'nullcal:pendingNotifications';
let queueListenerAttached = false;

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readPendingQueue = (): NotificationPayload[] => {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as NotificationPayload[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item === 'object' && item !== null).slice(-50);
  } catch {
    return [];
  }
};

const writePendingQueue = (items: NotificationPayload[]) => {
  if (!canUseStorage()) {
    return;
  }
  try {
    window.localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(items.slice(-50)));
  } catch {
    // Ignore storage failures.
  }
};

const enqueuePending = (payload: NotificationPayload) => {
  const queue = readPendingQueue();
  queue.push(payload);
  writePendingQueue(queue);
};

const buildHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (configuredRequestToken) {
    headers['X-Nullcal-Token'] = configuredRequestToken;
    headers.Authorization = `Bearer ${configuredRequestToken}`;
  }
  return headers;
};

export const flushPendingNotifications = async () => {
  const queue = readPendingQueue();
  if (queue.length === 0) {
    return;
  }
  const remaining: NotificationPayload[] = [];
  for (const payload of queue) {
    try {
      const response = await fetch(`${API_BASE}/notify`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        remaining.push(payload);
      }
    } catch {
      remaining.push(payload);
    }
  }
  writePendingQueue(remaining);
};

const attachQueueListener = () => {
  if (queueListenerAttached || typeof window === 'undefined') {
    return;
  }
  queueListenerAttached = true;
  window.addEventListener('online', () => {
    void flushPendingNotifications();
  });
};

const sendNotification = async (payload: NotificationPayload, options: SendNotificationOptions = {}) => {
  attachQueueListener();
  try {
    const response = await fetch(`${API_BASE}/notify`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Notification delivery failed.');
    }
  } catch (error) {
    if (options.queueOnFailure) {
      enqueuePending(payload);
      return;
    }
    throw error;
  }
};

export const sendTwoFactorCode = async (
  channel: NotificationChannel,
  destination: string,
  code: string
) => {
  const message = `NullCal verification code: ${code}. It expires in ten minutes.`;
  const subject = channel === 'email' ? 'NullCal verification code' : undefined;
  await sendNotification({ channel, to: destination, message, subject, metadata: { purpose: '2fa' } });
};

export const sendReminder = async (
  channel: NotificationChannel,
  destination: string,
  message: string
) => {
  const subject = channel === 'email' ? 'NullCal event reminder' : undefined;
  await sendNotification(
    { channel, to: destination, message, subject, metadata: { purpose: 'reminder' } },
    { queueOnFailure: true }
  );
};
