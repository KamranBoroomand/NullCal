type NotificationChannel = 'email' | 'sms';

type NotificationPayload = {
  channel: NotificationChannel;
  to: string;
  message: string;
  subject?: string;
  metadata?: Record<string, string>;
};

type PendingNotification = NotificationPayload & {
  queuedAt: string;
  attempts: number;
  lastError?: string;
};

export type PendingNotificationStatus = {
  total: number;
  lastQueuedAt?: string;
  lastError?: string;
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
const pendingQueueSubscribers = new Set<(status: PendingNotificationStatus) => void>();

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizePendingItem = (item: unknown): PendingNotification | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }
  const record = item as Record<string, unknown>;
  const channel = record.channel;
  const to = record.to;
  const message = record.message;
  if ((channel !== 'email' && channel !== 'sms') || typeof to !== 'string' || typeof message !== 'string') {
    return null;
  }
  const subject = typeof record.subject === 'string' ? record.subject : undefined;
  const metadata =
    record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? (record.metadata as Record<string, string>)
      : undefined;
  const queuedAtRaw = typeof record.queuedAt === 'string' ? record.queuedAt : new Date().toISOString();
  const queuedAt = Number.isFinite(Date.parse(queuedAtRaw)) ? queuedAtRaw : new Date().toISOString();
  const attemptsRaw = Number(record.attempts ?? 0);
  const attempts = Number.isFinite(attemptsRaw) && attemptsRaw >= 0 ? Math.floor(attemptsRaw) : 0;
  const lastError = typeof record.lastError === 'string' ? record.lastError.slice(0, 180) : undefined;
  return {
    channel,
    to,
    message,
    subject,
    metadata,
    queuedAt,
    attempts,
    lastError
  };
};

const readPendingQueue = (): PendingNotification[] => {
  if (!canUseStorage()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => normalizePendingItem(item))
      .filter((item): item is PendingNotification => Boolean(item))
      .slice(-50);
  } catch {
    return [];
  }
};

const toStatus = (items: PendingNotification[]): PendingNotificationStatus => {
  const lastItem = items[items.length - 1];
  const lastErrorItem = [...items].reverse().find((item) => item.lastError);
  return {
    total: items.length,
    lastQueuedAt: lastItem?.queuedAt,
    lastError: lastErrorItem?.lastError
  };
};

const emitPendingQueueStatus = (items: PendingNotification[]) => {
  const status = toStatus(items);
  pendingQueueSubscribers.forEach((listener) => {
    listener(status);
  });
};

const writePendingQueue = (items: PendingNotification[]) => {
  if (!canUseStorage()) {
    return;
  }
  try {
    const sliced = items.slice(-50);
    window.localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(sliced));
    emitPendingQueueStatus(sliced);
  } catch {
    // Ignore storage failures.
  }
};

const enqueuePending = (payload: NotificationPayload, error?: string) => {
  const queue = readPendingQueue();
  queue.push({
    ...payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: error
  });
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
    emitPendingQueueStatus(queue);
    return;
  }
  const remaining: PendingNotification[] = [];
  for (const payload of queue) {
    try {
      const response = await fetch(`${API_BASE}/notify`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        remaining.push({
          ...payload,
          attempts: payload.attempts + 1,
          lastError: `Delivery failed (${response.status}).`
        });
      }
    } catch {
      remaining.push({
        ...payload,
        attempts: payload.attempts + 1,
        lastError: 'Network unavailable.'
      });
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
      const details = await response.text().catch(() => '');
      const trimmedDetails = details.trim();
      const detailSuffix = trimmedDetails ? ` ${trimmedDetails.slice(0, 180)}` : '';
      throw new Error(`Notification delivery failed (${response.status}).${detailSuffix}`);
    }
  } catch (error) {
    if (options.queueOnFailure) {
      enqueuePending(payload, error instanceof Error ? error.message : 'Notification send failed.');
      return;
    }
    throw error;
  }
};

export const getPendingNotificationStatus = (): PendingNotificationStatus => toStatus(readPendingQueue());

export const subscribePendingNotificationStatus = (
  listener: (status: PendingNotificationStatus) => void
) => {
  pendingQueueSubscribers.add(listener);
  listener(getPendingNotificationStatus());
  return () => {
    pendingQueueSubscribers.delete(listener);
  };
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
