import type { SyncHandle, SyncMessage, SyncPayload } from './types';

const DEFAULT_SYNC_API = '/api';
const DEFAULT_POLL_INTERVAL_MS = 4000;

type RelaySyncOptions = {
  apiBase?: string;
  requestToken?: string;
  shareToken?: string;
  pollIntervalMs?: number;
};

type SyncPullResponse = {
  ok: boolean;
  latestRevision?: number;
  items?: SyncMessage[];
};

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const normalizeBase = (value?: string) => {
  const raw = hasText(value) ? value : DEFAULT_SYNC_API;
  return raw.replace(/\/+$/, '');
};

const buildHeaders = (requestToken?: string): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (hasText(requestToken)) {
    headers['X-Nullcal-Token'] = requestToken.trim();
    headers.Authorization = `Bearer ${requestToken.trim()}`;
  }
  return headers;
};

const toNumber = (value: unknown) => {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : null;
};

const isSyncMessage = (value: unknown): value is SyncMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    hasText(record.senderId) &&
    typeof record.payload === 'object' &&
    record.payload !== null &&
    toNumber(record.sentAt) !== null
  );
};

export const createRelaySync = (
  senderId: string,
  onReceive: (message: SyncMessage) => void,
  options: RelaySyncOptions
): SyncHandle => {
  if (typeof window === 'undefined' || typeof fetch === 'undefined' || !hasText(options.shareToken)) {
    return {
      broadcast: () => {},
      close: () => {}
    };
  }

  const apiBase = normalizeBase(options.apiBase);
  const shareToken = options.shareToken.trim();
  const headers = buildHeaders(options.requestToken);
  const pollIntervalMs = Math.max(1500, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
  let closed = false;
  let lastRevision = 0;
  let polling = false;

  const applyServerResponse = (data: SyncPullResponse) => {
    if (typeof data.latestRevision === 'number') {
      lastRevision = Math.max(lastRevision, data.latestRevision);
    }
    if (!Array.isArray(data.items)) {
      return;
    }
    data.items
      .filter((item) => isSyncMessage(item))
      .forEach((message) => {
        if (message.senderId === senderId) {
          return;
        }
        if (typeof message.revision === 'number') {
          lastRevision = Math.max(lastRevision, message.revision);
        }
        onReceive(message);
      });
  };

  const poll = async () => {
    if (closed || polling) {
      return;
    }
    polling = true;
    try {
      const response = await fetch(
        `${apiBase}/sync?token=${encodeURIComponent(shareToken)}&since=${encodeURIComponent(String(lastRevision))}`,
        {
          method: 'GET',
          headers
        }
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as SyncPullResponse;
      if (!data?.ok) {
        return;
      }
      applyServerResponse(data);
    } catch {
      // Network lock/offline mode can reject fetch. Retry on next interval.
    } finally {
      polling = false;
    }
  };

  const interval = window.setInterval(() => {
    void poll();
  }, pollIntervalMs);
  void poll();

  return {
    broadcast: (payload: SyncPayload) => {
      if (closed) {
        return;
      }
      const message: SyncMessage = {
        senderId,
        payload,
        sentAt: Date.now()
      };
      void fetch(`${apiBase}/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token: shareToken,
          ...message
        })
      })
        .then(async (response) => {
          if (!response.ok) {
            return;
          }
          const data = (await response.json().catch(() => null)) as { revision?: number } | null;
          if (data && typeof data.revision === 'number') {
            lastRevision = Math.max(lastRevision, data.revision);
          }
        })
        .catch(() => {
          // Best-effort sync; polling reconciles later.
        });
    },
    close: () => {
      closed = true;
      window.clearInterval(interval);
    }
  };
};
