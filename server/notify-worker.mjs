const MAX_TO_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_METADATA_ENTRIES = 10;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_VALUE_LENGTH = 200;
const MAX_SYNC_TOKEN_LENGTH = 160;
const MAX_SYNC_SENDER_LENGTH = 120;
const DEFAULT_MAX_REQUEST_BYTES = 8 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_SEC = 300;
const DEFAULT_RATE_LIMIT_MAX = 20;
const MAX_RATE_LIMIT_TRACKED_KEYS = 4096;
const DEFAULT_DEV_CORS_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173'];
const DEFAULT_QUEUE_RETRY_SEC = 30;
const DEFAULT_QUEUE_MAX_ATTEMPTS = 5;
const DEFAULT_QUEUE_MAX_ITEMS = 500;
const DEFAULT_SYNC_TTL_SEC = 30 * 24 * 60 * 60;
const DEFAULT_SYNC_MAX_MESSAGES = 250;
const DEFAULT_SYNC_MAX_PULL = 100;
const DEFAULT_MAX_SYNC_REQUEST_BYTES = 512 * 1024;
const SYNC_STORE_KEY_PREFIX = 'sync:';

const rateLimitStore = new Map();
const deliveryQueue = [];
const syncStore = new Map();

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const parsePositiveInt = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
};

const parseList = (value) =>
  `${value ?? ''}`
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const parseAllowedOrigins = (value) => {
  const origins = parseList(value);
  return origins.length > 0 ? origins : DEFAULT_DEV_CORS_ORIGINS;
};

const isOriginAllowed = (origin, allowedOrigins) => {
  if (allowedOrigins.includes('*')) {
    return true;
  }
  if (!hasValue(origin)) {
    return false;
  }
  return allowedOrigins.includes(origin);
};

const resolveCorsOrigin = (origin, allowedOrigins) => {
  if (allowedOrigins.includes('*')) {
    return '*';
  }
  if (hasValue(origin) && allowedOrigins.includes(origin)) {
    return origin;
  }
  return 'null';
};

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nullcal-Token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  Vary: 'Origin'
});

const json = (status, payload, corsOrigin) => {
  const body = JSON.stringify(payload);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(corsOrigin)
    }
  });
};

const extractRequestToken = (request) => {
  const tokenHeader = request.headers.get('x-nullcal-token');
  if (hasValue(tokenHeader)) {
    return tokenHeader.trim();
  }
  const authHeader = request.headers.get('authorization');
  if (hasValue(authHeader) && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
};

const assertRequestToken = (request, env) => {
  const expected = `${env.NOTIFY_REQUEST_TOKEN ?? ''}`.trim();
  const allowUnauthenticated = `${env.NOTIFY_ALLOW_UNAUTH ?? ''}`.trim() === '1';
  if (!hasValue(expected)) {
    if (allowUnauthenticated) {
      return;
    }
    throw new HttpError(503, 'Notification auth is not configured.');
  }
  const actual = extractRequestToken(request);
  if (actual !== expected) {
    throw new HttpError(401, 'Unauthorized request token.');
  }
};

const normalizePhone = (value) => {
  const cleaned = `${value ?? ''}`.trim().replace(/[^\d+]/g, '');
  if (!cleaned) {
    return '';
  }
  if (!cleaned.startsWith('+')) {
    return cleaned.replace(/\+/g, '');
  }
  return `+${cleaned.slice(1).replace(/\+/g, '')}`;
};

const normalizeEmail = (value) => `${value ?? ''}`.trim().toLowerCase();

const parseAllowlist = (value) =>
  parseList(value).map((rawEntry) => {
    const entry = rawEntry.toLowerCase();
    if (entry.startsWith('email:')) {
      return { channel: 'email', pattern: entry.slice(6).trim() };
    }
    if (entry.startsWith('sms:')) {
      return { channel: 'sms', pattern: entry.slice(4).trim() };
    }
    return { channel: 'any', pattern: entry.trim() };
  });

const matchesAllowlistPattern = (channel, recipient, pattern) => {
  if (!hasValue(pattern)) {
    return false;
  }
  if (channel === 'email') {
    const normalizedRecipient = normalizeEmail(recipient);
    const normalizedPattern = pattern.toLowerCase();
    if (normalizedPattern.startsWith('*@')) {
      return normalizedRecipient.endsWith(normalizedPattern.slice(1));
    }
    if (normalizedPattern.startsWith('@')) {
      return normalizedRecipient.endsWith(normalizedPattern);
    }
    return normalizedRecipient === normalizeEmail(normalizedPattern);
  }
  return normalizePhone(recipient) === normalizePhone(pattern);
};

const assertAllowedRecipient = (channel, recipient, env) => {
  const allowlist = parseAllowlist(env.NOTIFY_ALLOWED_RECIPIENTS);
  if (allowlist.length === 0) {
    return;
  }
  const allowed = allowlist.some(({ channel: ruleChannel, pattern }) => {
    if (ruleChannel !== 'any' && ruleChannel !== channel) {
      return false;
    }
    return matchesAllowlistPattern(channel, recipient, pattern);
  });
  if (!allowed) {
    throw new HttpError(403, 'Recipient is not in allowlist.');
  }
};

const cleanupRateLimitStore = (now) => {
  if (rateLimitStore.size <= MAX_RATE_LIMIT_TRACKED_KEYS) {
    return;
  }
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

const enforceRateLimit = (key, env) => {
  if (`${env.NOTIFY_RATE_LIMIT_DISABLE ?? ''}`.trim() === '1') {
    return;
  }
  const windowSec = parsePositiveInt(env.NOTIFY_RATE_LIMIT_WINDOW_SEC, DEFAULT_RATE_LIMIT_WINDOW_SEC, {
    min: 1,
    max: 86400
  });
  const maxRequests = parsePositiveInt(env.NOTIFY_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX, {
    min: 1,
    max: 1000
  });
  const now = Date.now();
  cleanupRateLimitStore(now);
  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return;
  }
  if (existing.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new HttpError(429, `Rate limit exceeded. Retry in ${retryAfter}s.`);
  }
  existing.count += 1;
};

const getClientKey = (request, env) => {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (hasValue(cfIp)) {
    return cfIp.trim();
  }
  const trustProxy = `${env.NOTIFY_TRUST_PROXY ?? ''}`.trim() === '1';
  if (trustProxy) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (hasValue(forwarded)) {
      return forwarded.split(',')[0].trim();
    }
  }
  return 'unknown';
};

const readJson = async (request, env, maxBytesOverride) => {
  const maxBytes =
    maxBytesOverride ??
    parsePositiveInt(env.NOTIFY_MAX_REQUEST_BYTES, DEFAULT_MAX_REQUEST_BYTES, {
      min: 256,
      max: 1024 * 1024
    });
  const raw = await request.text();
  if (!raw) {
    throw new HttpError(400, 'Request body is empty.');
  }
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new HttpError(413, 'Request payload is too large.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON.');
  }
};

const postWebhook = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status}`);
  }
};

const sendEmailViaWebhook = async (env, { to, subject, message, metadata }) => {
  await postWebhook(env.EMAIL_WEBHOOK_URL, { to, subject, message, metadata });
};

const sendEmailViaResend = async (env, { to, subject, message }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.NOTIFY_FROM_EMAIL,
      to: [to],
      subject: subject ?? 'NullCal notification',
      text: message
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend delivery failed: ${response.status} ${details}`);
  }
};

const sendSmsViaTextbelt = async ({ to, message, key }) => {
  const params = new URLSearchParams({
    phone: to,
    message,
    key
  });
  const response = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  let details;
  try {
    details = await response.json();
  } catch {
    details = null;
  }
  if (!response.ok || !details?.success) {
    const reason =
      details && typeof details.error === 'string'
        ? details.error
        : `status ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
    throw new Error(`Textbelt delivery failed: ${reason}`);
  }
};

const sendSmsViaTwilio = async (env, { to, message }) => {
  const params = new URLSearchParams({
    To: to,
    From: env.TWILIO_FROM_NUMBER,
    Body: message
  });
  const basicAuth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Twilio delivery failed: ${response.status} ${details}`);
  }
};

const runProviderChain = async (providers) => {
  const failures = [];
  for (const provider of providers) {
    try {
      await provider.send();
      return provider.name;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error.';
      failures.push(`${provider.name}: ${message}`);
    }
  }
  throw new Error(failures.join(' | ') || 'No provider available.');
};

const buildEmailProviders = (env, payload) => {
  const providers = [];
  if (hasValue(env.EMAIL_WEBHOOK_URL)) {
    providers.push({ name: 'email:webhook', send: () => sendEmailViaWebhook(env, payload) });
  }
  if (hasValue(env.RESEND_API_KEY) && hasValue(env.NOTIFY_FROM_EMAIL)) {
    providers.push({ name: 'email:resend', send: () => sendEmailViaResend(env, payload) });
  }
  return providers;
};

const buildSmsProviders = (env, payload) => {
  const providers = [];
  if (hasValue(env.SMS_WEBHOOK_URL)) {
    providers.push({ name: 'sms:webhook', send: () => postWebhook(env.SMS_WEBHOOK_URL, payload) });
  }
  const textbeltKey = hasValue(env.TEXTBELT_API_KEY)
    ? env.TEXTBELT_API_KEY
    : env.TEXTBELT_FREE === '1'
      ? 'textbelt'
      : undefined;
  if (textbeltKey) {
    providers.push({
      name: 'sms:textbelt',
      send: () => sendSmsViaTextbelt({ to: payload.to, message: payload.message, key: textbeltKey })
    });
  }
  if (hasValue(env.TWILIO_ACCOUNT_SID) && hasValue(env.TWILIO_AUTH_TOKEN) && hasValue(env.TWILIO_FROM_NUMBER)) {
    providers.push({ name: 'sms:twilio', send: () => sendSmsViaTwilio(env, payload) });
  }
  return providers;
};

const deliverNotification = async (env, payload) => {
  const providers = payload.channel === 'email' ? buildEmailProviders(env, payload) : buildSmsProviders(env, payload);
  if (providers.length === 0) {
    throw new Error(`${payload.channel.toUpperCase()} provider is not configured.`);
  }
  const provider = await runProviderChain(providers);
  return { provider };
};

const queueEnabled = (env) => `${env.NOTIFY_QUEUE_DISABLE ?? ''}`.trim() !== '1';

const queueMaxAttempts = (env) =>
  parsePositiveInt(env.NOTIFY_QUEUE_MAX_ATTEMPTS, DEFAULT_QUEUE_MAX_ATTEMPTS, { min: 1, max: 20 });

const queueRetrySeconds = (env) =>
  parsePositiveInt(env.NOTIFY_QUEUE_RETRY_SEC, DEFAULT_QUEUE_RETRY_SEC, { min: 5, max: 3600 });

const queueMaxItems = (env) =>
  parsePositiveInt(env.NOTIFY_QUEUE_MAX_ITEMS, DEFAULT_QUEUE_MAX_ITEMS, { min: 10, max: 10000 });

const enqueueDelivery = (env, payload, lastError) => {
  const now = Date.now();
  const item = {
    id: crypto.randomUUID(),
    payload,
    attempts: 0,
    createdAt: now,
    nextAttemptAt: now + queueRetrySeconds(env) * 1000,
    lastError: lastError ?? 'Queued'
  };
  deliveryQueue.push(item);
  if (deliveryQueue.length > queueMaxItems(env)) {
    deliveryQueue.splice(0, deliveryQueue.length - queueMaxItems(env));
  }
  return item;
};

const processDeliveryQueue = async (env) => {
  if (!queueEnabled(env) || deliveryQueue.length === 0) {
    return;
  }
  const now = Date.now();
  const maxAttempts = queueMaxAttempts(env);
  for (const item of [...deliveryQueue]) {
    if (item.nextAttemptAt > now) {
      continue;
    }
    try {
      await deliverNotification(env, item.payload);
      const index = deliveryQueue.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        deliveryQueue.splice(index, 1);
      }
    } catch (error) {
      item.attempts += 1;
      item.lastError = error instanceof Error ? error.message : 'Unknown queue failure.';
      if (item.attempts >= maxAttempts) {
        const index = deliveryQueue.findIndex((entry) => entry.id === item.id);
        if (index >= 0) {
          deliveryQueue.splice(index, 1);
        }
        continue;
      }
      const backoffMs = queueRetrySeconds(env) * 1000 * Math.max(1, item.attempts);
      item.nextAttemptAt = now + backoffMs;
    }
  }
};

const validateMetadata = (metadata) => {
  if (metadata === undefined) {
    return undefined;
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new HttpError(400, 'Metadata must be an object.');
  }
  const entries = Object.entries(metadata);
  if (entries.length > MAX_METADATA_ENTRIES) {
    throw new HttpError(400, `Metadata can include at most ${MAX_METADATA_ENTRIES} fields.`);
  }
  const sanitized = {};
  for (const [key, value] of entries) {
    const normalizedKey = `${key}`.trim();
    if (!hasValue(normalizedKey)) {
      throw new HttpError(400, 'Metadata keys cannot be empty.');
    }
    if (normalizedKey.length > MAX_METADATA_KEY_LENGTH) {
      throw new HttpError(400, `Metadata key is too long: "${normalizedKey}".`);
    }
    if (typeof value !== 'string') {
      throw new HttpError(400, `Metadata value for "${normalizedKey}" must be a string.`);
    }
    if (value.length > MAX_METADATA_VALUE_LENGTH) {
      throw new HttpError(400, `Metadata value for "${normalizedKey}" is too long.`);
    }
    sanitized[normalizedKey] = value;
  }
  return sanitized;
};

const validateNotificationPayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Payload must be an object.');
  }
  const channel = body.channel;
  if (channel !== 'email' && channel !== 'sms') {
    throw new HttpError(400, 'Unsupported channel. Expected "email" or "sms".');
  }
  if (!hasValue(body.to)) {
    throw new HttpError(400, 'Destination "to" is required.');
  }
  if (!hasValue(body.message)) {
    throw new HttpError(400, 'Message is required.');
  }
  const to = body.to.trim();
  const message = body.message.trim();
  if (to.length > MAX_TO_LENGTH) {
    throw new HttpError(400, 'Destination "to" is too long.');
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, `Message is too long (max ${MAX_MESSAGE_LENGTH} chars).`);
  }
  if (channel === 'email' && !to.includes('@')) {
    throw new HttpError(400, 'Email destination is invalid.');
  }
  if (channel === 'sms' && normalizePhone(to).length < 7) {
    throw new HttpError(400, 'SMS destination is invalid.');
  }

  let subject;
  if (body.subject !== undefined) {
    if (typeof body.subject !== 'string') {
      throw new HttpError(400, 'Subject must be a string.');
    }
    subject = body.subject.trim();
    if (subject.length > MAX_SUBJECT_LENGTH) {
      throw new HttpError(400, `Subject is too long (max ${MAX_SUBJECT_LENGTH} chars).`);
    }
  }

  return {
    channel,
    to,
    message,
    subject: hasValue(subject) ? subject : undefined,
    metadata: validateMetadata(body.metadata)
  };
};

const sanitizeSyncPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'Sync payload must be an object.');
  }
  const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];
  const calendars = Array.isArray(payload.calendars) ? payload.calendars : [];
  const events = Array.isArray(payload.events) ? payload.events : [];
  const templates = Array.isArray(payload.templates) ? payload.templates : [];
  let collaboration;
  if (payload.collaboration && typeof payload.collaboration === 'object' && !Array.isArray(payload.collaboration)) {
    const modeRaw = `${payload.collaboration.mode ?? 'private'}`.trim().toLowerCase();
    const mode = modeRaw === 'shared' || modeRaw === 'team' ? modeRaw : 'private';
    let calendarPermissions = {};
    if (
      payload.collaboration.calendarPermissions &&
      typeof payload.collaboration.calendarPermissions === 'object' &&
      !Array.isArray(payload.collaboration.calendarPermissions)
    ) {
      for (const [calendarId, preset] of Object.entries(payload.collaboration.calendarPermissions)) {
        const normalizedCalendarId = `${calendarId}`.trim();
        if (!hasValue(normalizedCalendarId) || normalizedCalendarId.length > 200) {
          continue;
        }
        if (preset === 'owner-only' || preset === 'owner-editor') {
          calendarPermissions[normalizedCalendarId] = preset;
        }
      }
    }
    collaboration = {
      enabled: Boolean(payload.collaboration.enabled),
      mode,
      members: Array.isArray(payload.collaboration.members) ? payload.collaboration.members : [],
      calendarPermissions
    };
  }
  return { profiles, calendars, events, templates, collaboration };
};

const sanitizeEncryptedSyncPayload = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Encrypted sync payload must be an object.');
  }
  const version = Number(value.version ?? 0);
  const salt = `${value.salt ?? ''}`.trim();
  const iv = `${value.iv ?? ''}`.trim();
  const ciphertext = `${value.ciphertext ?? ''}`.trim();
  if (version !== 1) {
    throw new HttpError(400, 'Encrypted sync payload version is invalid.');
  }
  if (!hasValue(salt) || !hasValue(iv) || !hasValue(ciphertext)) {
    throw new HttpError(400, 'Encrypted sync payload is incomplete.');
  }
  if (salt.length > 4096 || iv.length > 4096 || ciphertext.length > 2 * 1024 * 1024) {
    throw new HttpError(400, 'Encrypted sync payload is too large.');
  }
  return { version: 1, salt, iv, ciphertext };
};

const validateSyncWritePayload = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Payload must be an object.');
  }
  const token = `${body.token ?? ''}`.trim();
  const senderId = `${body.senderId ?? ''}`.trim();
  if (!hasValue(token)) {
    throw new HttpError(400, 'Sync token is required.');
  }
  if (token.length > MAX_SYNC_TOKEN_LENGTH) {
    throw new HttpError(400, 'Sync token is too long.');
  }
  if (!hasValue(senderId) || senderId.length > MAX_SYNC_SENDER_LENGTH) {
    throw new HttpError(400, 'Sync senderId is invalid.');
  }
  const sentAt = Number(body.sentAt ?? Date.now());
  if (!Number.isFinite(sentAt)) {
    throw new HttpError(400, 'Sync sentAt is invalid.');
  }
  const payloadEncodingRaw = `${body.payloadEncoding ?? ''}`.trim().toLowerCase();
  const payloadEncoding = payloadEncodingRaw === 'e2ee-v1' ? 'e2ee-v1' : undefined;
  if (body.payloadCiphertext === undefined) {
    throw new HttpError(400, 'Encrypted sync payload is required.');
  }
  const payloadCiphertext = sanitizeEncryptedSyncPayload(body.payloadCiphertext);
  return { token, senderId, sentAt, payloadEncoding: payloadEncoding ?? 'e2ee-v1', payloadCiphertext };
};

const hasSyncKV = (env) =>
  env &&
  typeof env.SYNC_KV?.get === 'function' &&
  typeof env.SYNC_KV?.put === 'function';

const syncStoreKey = (token) => `${SYNC_STORE_KEY_PREFIX}${token}`;

const parseSyncEntry = (raw) => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Number.isFinite(parsed.revision) &&
      Array.isArray(parsed.messages)
    ) {
      return {
        revision: Number(parsed.revision),
        messages: parsed.messages
      };
    }
  } catch {
    return null;
  }
  return null;
};

const getSyncEntry = async (env, token) => {
  if (hasSyncKV(env)) {
    const raw = await env.SYNC_KV.get(syncStoreKey(token));
    const parsed = parseSyncEntry(raw);
    if (parsed) {
      syncStore.set(token, parsed);
      return parsed;
    }
  }
  let entry = syncStore.get(token);
  if (!entry) {
    entry = { revision: 0, messages: [] };
    syncStore.set(token, entry);
  }
  return entry;
};

const persistSyncEntry = async (env, token, entry) => {
  syncStore.set(token, entry);
  if (!hasSyncKV(env)) {
    return;
  }
  await env.SYNC_KV.put(syncStoreKey(token), JSON.stringify(entry));
};

const cleanupSyncEntry = (env, entry) => {
  const now = Date.now();
  const ttlMs = parsePositiveInt(env.NOTIFY_SYNC_TTL_SEC, DEFAULT_SYNC_TTL_SEC, {
    min: 60,
    max: 365 * 24 * 60 * 60
  }) * 1000;
  const maxMessages = parsePositiveInt(env.NOTIFY_SYNC_MAX_MESSAGES, DEFAULT_SYNC_MAX_MESSAGES, {
    min: 10,
    max: 5000
  });
  entry.messages = entry.messages.filter((message) => now - message.recordedAt <= ttlMs);
  if (entry.messages.length > maxMessages) {
    entry.messages.splice(0, entry.messages.length - maxMessages);
  }
};

const writeSyncMessage = async (env, token, message) => {
  const entry = await getSyncEntry(env, token);
  entry.revision += 1;
  const record = {
    revision: entry.revision,
    senderId: message.senderId,
    sentAt: message.sentAt,
    payload: message.payload,
    payloadCiphertext: message.payloadCiphertext,
    payloadEncoding: message.payloadEncoding,
    recordedAt: Date.now()
  };
  entry.messages.push(record);
  cleanupSyncEntry(env, entry);
  await persistSyncEntry(env, token, entry);
  return record.revision;
};

const readSyncMessages = async (env, token, since) => {
  const entry = await getSyncEntry(env, token);
  cleanupSyncEntry(env, entry);
  await persistSyncEntry(env, token, entry);
  const maxPull = parsePositiveInt(env.NOTIFY_SYNC_MAX_PULL, DEFAULT_SYNC_MAX_PULL, { min: 1, max: 500 });
  const items = entry.messages.filter((item) => item.revision > since).slice(-maxPull);
  return {
    latestRevision: entry.revision,
    items
  };
};

const parseSyncReadParams = (url) => {
  const token = `${url.searchParams.get('token') ?? ''}`.trim();
  if (!hasValue(token)) {
    throw new HttpError(400, 'Sync token is required.');
  }
  if (token.length > MAX_SYNC_TOKEN_LENGTH) {
    throw new HttpError(400, 'Sync token is too long.');
  }
  const sinceRaw = Number(url.searchParams.get('since') ?? 0);
  const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? Math.floor(sinceRaw) : 0;
  return { token, since };
};

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get('Origin');
    const allowedOrigins = parseAllowedOrigins(env.NOTIFY_CORS_ORIGINS ?? env.NOTIFY_CORS_ORIGIN);
    const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

    if (request.method === 'OPTIONS') {
      if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
        return json(403, { ok: false, error: 'Origin not allowed.' }, corsOrigin);
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin)
      });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      return json(
        200,
        {
          ok: true,
          service: 'nullcal-notify-worker',
          queueDepth: deliveryQueue.length,
          syncStore: hasSyncKV(env) ? 'kv' : 'memory'
        },
        corsOrigin
      );
    }

    const isNotifyRoute = url.pathname === '/api/notify';
    const isSyncRoute = url.pathname === '/api/sync';
    if (!isNotifyRoute && !isSyncRoute) {
      return json(404, { ok: false, error: 'Not found.' }, corsOrigin);
    }

    try {
      if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
        throw new HttpError(403, 'Origin not allowed.');
      }
      assertRequestToken(request, env);
      enforceRateLimit(getClientKey(request, env), env);
      await processDeliveryQueue(env);

      if (isNotifyRoute) {
        if (request.method !== 'POST') {
          throw new HttpError(405, 'Method not allowed.');
        }
        const payload = validateNotificationPayload(await readJson(request, env));
        assertAllowedRecipient(payload.channel, payload.to, env);
        try {
          const result = await deliverNotification(env, payload);
          return json(200, { ok: true, id: crypto.randomUUID(), provider: result.provider }, corsOrigin);
        } catch (deliveryError) {
          if (!queueEnabled(env)) {
            throw deliveryError;
          }
          const queued = enqueueDelivery(
            env,
            payload,
            deliveryError instanceof Error ? deliveryError.message : 'Queued after failure.'
          );
          return json(
            202,
            { ok: true, queued: true, queueId: queued.id, retryAfterSeconds: queueRetrySeconds(env) },
            corsOrigin
          );
        }
      }

      if (isSyncRoute && request.method === 'POST') {
        const maxSyncBytes = parsePositiveInt(env.NOTIFY_SYNC_MAX_REQUEST_BYTES, DEFAULT_MAX_SYNC_REQUEST_BYTES, {
          min: 1024,
          max: 4 * 1024 * 1024
        });
        const payload = validateSyncWritePayload(await readJson(request, env, maxSyncBytes));
        const revision = await writeSyncMessage(env, payload.token, payload);
        return json(200, { ok: true, revision }, corsOrigin);
      }

      if (isSyncRoute && request.method === 'GET') {
        const params = parseSyncReadParams(url);
        const data = await readSyncMessages(env, params.token, params.since);
        return json(200, { ok: true, ...data }, corsOrigin);
      }

      throw new HttpError(405, 'Method not allowed.');
    } catch (error) {
      if (error instanceof HttpError) {
        return json(error.status, { ok: false, error: error.message }, corsOrigin);
      }
      const message = error instanceof Error ? error.message : 'Unknown delivery error.';
      return json(502, { ok: false, error: message }, corsOrigin);
    }
  }
};
