import type { SyncHandle, SyncMessage, SyncPayload } from './types';
import { decryptPayload, encryptPayload, type EncryptedPayload } from '../security/encryption';

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
  items?: unknown[];
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

const isEncryptedPayload = (value: unknown): value is EncryptedPayload => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    Number(record.version) === 1 &&
    hasText(record.salt) &&
    hasText(record.iv) &&
    hasText(record.ciphertext)
  );
};

const parseSyncMessage = (value: unknown): SyncMessage | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (!hasText(record.senderId) || toNumber(record.sentAt) === null) {
    return null;
  }
  const payload =
    record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)
      ? (record.payload as SyncPayload)
      : undefined;
  const payloadCiphertext = isEncryptedPayload(record.payloadCiphertext) ? record.payloadCiphertext : undefined;
  if (!payload && !payloadCiphertext) {
    return null;
  }
  const revision = toNumber(record.revision);
  const payloadEncoding = hasText(record.payloadEncoding) && record.payloadEncoding === 'e2ee-v1' ? 'e2ee-v1' : undefined;
  return {
    senderId: record.senderId.trim(),
    sentAt: Number(record.sentAt),
    revision: revision ?? undefined,
    payload,
    payloadCiphertext,
    payloadEncoding
  };
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

  const applyServerResponse = async (data: SyncPullResponse) => {
    if (typeof data.latestRevision === 'number') {
      lastRevision = Math.max(lastRevision, data.latestRevision);
    }
    if (!Array.isArray(data.items)) {
      return;
    }
    for (const rawItem of data.items) {
      const message = parseSyncMessage(rawItem);
      if (!message) {
        continue;
      }
      if (message.senderId === senderId) {
        continue;
      }
      if (typeof message.revision === 'number') {
        lastRevision = Math.max(lastRevision, message.revision);
      }
      let payload: SyncPayload | undefined = message.payload;
      if (!payload && message.payloadCiphertext) {
        try {
          const decrypted = (await decryptPayload(message.payloadCiphertext, shareToken)) as SyncPayload;
          if (decrypted && typeof decrypted === 'object') {
            payload = decrypted;
          }
        } catch {
          payload = undefined;
        }
      }
      if (!payload) {
        continue;
      }
      onReceive({
        ...message,
        payload
      });
    }
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
      await applyServerResponse(data);
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
      void encryptPayload(payload, shareToken)
        .then((payloadCiphertext) =>
          fetch(`${apiBase}/sync`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              token: shareToken,
              senderId,
              sentAt: Date.now(),
              payloadEncoding: 'e2ee-v1',
              payloadCiphertext
            })
          })
        )
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
