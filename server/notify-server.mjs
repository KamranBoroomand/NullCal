import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.NOTIFY_SERVER_PORT ?? 8787);
const MAX_TO_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_METADATA_ENTRIES = 10;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_VALUE_LENGTH = 200;
const DEFAULT_MAX_REQUEST_BYTES = 8 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_SEC = 300;
const DEFAULT_RATE_LIMIT_MAX = 20;
const MAX_RATE_LIMIT_TRACKED_KEYS = 4096;
const DEFAULT_DEV_CORS_ORIGINS = ['http://127.0.0.1:5173', 'http://localhost:5173'];
const rateLimitStore = new Map();

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

const json = (res, status, payload, corsOrigin) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body).toString(),
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Nullcal-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin'
  });
  res.end(body);
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

const assertAllowedRecipient = (channel, recipient) => {
  const allowlist = parseAllowlist(process.env.NOTIFY_ALLOWED_RECIPIENTS);
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

const extractRequestToken = (req) => {
  const tokenHeader = req.headers['x-nullcal-token'];
  if (hasValue(tokenHeader)) {
    return tokenHeader.trim();
  }
  const authHeader = req.headers.authorization;
  if (hasValue(authHeader) && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
};

const assertRequestToken = (req) => {
  const expected = `${process.env.NOTIFY_REQUEST_TOKEN ?? ''}`.trim();
  const allowUnauthenticated = `${process.env.NOTIFY_ALLOW_UNAUTH ?? ''}`.trim() === '1';
  if (!hasValue(expected)) {
    if (allowUnauthenticated) {
      return;
    }
    throw new HttpError(503, 'Notification auth is not configured.');
  }
  const actual = extractRequestToken(req);
  if (actual !== expected) {
    throw new HttpError(401, 'Unauthorized request token.');
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

const enforceRateLimit = (key) => {
  if (`${process.env.NOTIFY_RATE_LIMIT_DISABLE ?? ''}`.trim() === '1') {
    return;
  }
  const windowSec = parsePositiveInt(
    process.env.NOTIFY_RATE_LIMIT_WINDOW_SEC,
    DEFAULT_RATE_LIMIT_WINDOW_SEC,
    { min: 1, max: 86400 }
  );
  const maxRequests = parsePositiveInt(process.env.NOTIFY_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX, {
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

const getClientKey = (req) => {
  const trustProxy = `${process.env.NOTIFY_TRUST_PROXY ?? ''}`.trim() === '1';
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (hasValue(forwarded)) {
      return forwarded.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress ?? 'unknown';
};

const readJson = async (req) => {
  const chunks = [];
  const maxBytes = parsePositiveInt(process.env.NOTIFY_MAX_REQUEST_BYTES, DEFAULT_MAX_REQUEST_BYTES, {
    min: 256,
    max: 1024 * 1024
  });
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new HttpError(413, 'Request payload is too large.');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    throw new HttpError(400, 'Request body is empty.');
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

const sendEmail = async ({ to, subject, message, metadata }) => {
  if (hasValue(process.env.EMAIL_WEBHOOK_URL)) {
    await postWebhook(process.env.EMAIL_WEBHOOK_URL, { to, subject, message, metadata });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.NOTIFY_FROM_EMAIL;
  if (!resendKey || !resendFrom) {
    throw new Error('Email provider is not configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFrom,
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

const sendSms = async ({ to, message, metadata }) => {
  if (hasValue(process.env.SMS_WEBHOOK_URL)) {
    await postWebhook(process.env.SMS_WEBHOOK_URL, { to, message, metadata });
    return;
  }

  const textbeltKey = process.env.TEXTBELT_API_KEY ?? (process.env.TEXTBELT_FREE === '1' ? 'textbelt' : undefined);
  if (textbeltKey) {
    await sendSmsViaTextbelt({ to, message, key: textbeltKey });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error('SMS provider is not configured.');
  }

  const params = new URLSearchParams({
    To: to,
    From: from,
    Body: message
  });
  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Twilio delivery failed: ${response.status} ${details}`);
  }
};

const validatePayload = (body) => {
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

  let metadata;
  if (body.metadata !== undefined) {
    if (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
      throw new HttpError(400, 'Metadata must be an object.');
    }
    const entries = Object.entries(body.metadata);
    if (entries.length > MAX_METADATA_ENTRIES) {
      throw new HttpError(400, `Metadata can include at most ${MAX_METADATA_ENTRIES} fields.`);
    }
    metadata = {};
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
      metadata[normalizedKey] = value;
    }
  }

  return {
    channel,
    to,
    message,
    subject: hasValue(subject) ? subject : undefined,
    metadata
  };
};

const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = parseAllowedOrigins(process.env.NOTIFY_CORS_ORIGIN);
  const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

  if (req.method === 'OPTIONS') {
    if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
      return json(res, 403, { ok: false, error: 'Origin not allowed.' }, corsOrigin);
    }
    return json(res, 204, {}, corsOrigin);
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `127.0.0.1:${PORT}`}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, service: 'nullcal-notify' }, corsOrigin);
  }

  if (req.method !== 'POST' || url.pathname !== '/api/notify') {
    return json(res, 404, { ok: false, error: 'Not found.' }, corsOrigin);
  }

  try {
    if (!isOriginAllowed(requestOrigin, allowedOrigins)) {
      throw new HttpError(403, 'Origin not allowed.');
    }
    assertRequestToken(req);
    enforceRateLimit(getClientKey(req));

    const payload = validatePayload(await readJson(req));
    assertAllowedRecipient(payload.channel, payload.to);

    if (payload.channel === 'email') {
      await sendEmail(payload);
    } else {
      await sendSms(payload);
    }
    return json(res, 200, { ok: true, id: randomUUID() }, corsOrigin);
  } catch (error) {
    if (error instanceof HttpError) {
      return json(res, error.status, { ok: false, error: error.message }, corsOrigin);
    }
    const message = error instanceof Error ? error.message : 'Unknown delivery error.';
    return json(res, 502, { ok: false, error: message }, corsOrigin);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`NullCal notify server listening on http://127.0.0.1:${PORT}`);
});
