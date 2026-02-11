import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.NOTIFY_SERVER_PORT ?? 8787);
const CORS_ORIGIN = process.env.NOTIFY_CORS_ORIGIN ?? '*';

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body).toString(),
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  });
  res.end(body);
};

const readJson = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    throw new Error('Request body is empty.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Request body is not valid JSON.');
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
  if (process.env.EMAIL_WEBHOOK_URL) {
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
  if (process.env.SMS_WEBHOOK_URL) {
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
  if (!body || typeof body !== 'object') {
    throw new Error('Payload must be an object.');
  }
  const channel = body.channel;
  if (channel !== 'email' && channel !== 'sms') {
    throw new Error('Unsupported channel. Expected "email" or "sms".');
  }
  if (typeof body.to !== 'string' || body.to.trim().length === 0) {
    throw new Error('Destination "to" is required.');
  }
  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw new Error('Message is required.');
  }
  return {
    channel,
    to: body.to.trim(),
    message: body.message,
    subject: typeof body.subject === 'string' ? body.subject : undefined,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : undefined
  };
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {});
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `127.0.0.1:${PORT}`}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, service: 'nullcal-notify' });
  }

  if (req.method !== 'POST' || url.pathname !== '/api/notify') {
    return json(res, 404, { ok: false, error: 'Not found.' });
  }

  try {
    const payload = validatePayload(await readJson(req));
    if (payload.channel === 'email') {
      await sendEmail(payload);
    } else {
      await sendSms(payload);
    }
    return json(res, 200, { ok: true, id: randomUUID() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown delivery error.';
    return json(res, 502, { ok: false, error: message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`NullCal notify server listening on http://127.0.0.1:${PORT}`);
});
