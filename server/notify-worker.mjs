const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const readJson = async (request) => {
  const raw = await request.text();
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

const sendEmail = async (env, { to, subject, message, metadata }) => {
  if (hasValue(env.EMAIL_WEBHOOK_URL)) {
    await postWebhook(env.EMAIL_WEBHOOK_URL, { to, subject, message, metadata });
    return;
  }

  if (!hasValue(env.RESEND_API_KEY) || !hasValue(env.NOTIFY_FROM_EMAIL)) {
    throw new Error('Email provider is not configured.');
  }

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

const sendSms = async (env, { to, message, metadata }) => {
  if (hasValue(env.SMS_WEBHOOK_URL)) {
    await postWebhook(env.SMS_WEBHOOK_URL, { to, message, metadata });
    return;
  }

  const textbeltKey = hasValue(env.TEXTBELT_API_KEY)
    ? env.TEXTBELT_API_KEY
    : env.TEXTBELT_FREE === '1'
      ? 'textbelt'
      : undefined;
  if (textbeltKey) {
    await sendSmsViaTextbelt({ to, message, key: textbeltKey });
    return;
  }

  if (!hasValue(env.TWILIO_ACCOUNT_SID) || !hasValue(env.TWILIO_AUTH_TOKEN) || !hasValue(env.TWILIO_FROM_NUMBER)) {
    throw new Error('SMS provider is not configured.');
  }

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

const validatePayload = (body) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Payload must be an object.');
  }
  const channel = body.channel;
  if (channel !== 'email' && channel !== 'sms') {
    throw new Error('Unsupported channel. Expected "email" or "sms".');
  }
  if (!hasValue(body.to)) {
    throw new Error('Destination "to" is required.');
  }
  if (!hasValue(body.message)) {
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

export default {
  async fetch(request, env) {
    const corsOrigin = hasValue(env.NOTIFY_CORS_ORIGIN) ? env.NOTIFY_CORS_ORIGIN : '*';
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin)
      });
    }

    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      return json(200, { ok: true, service: 'nullcal-notify-worker' }, corsOrigin);
    }

    if (request.method !== 'POST' || url.pathname !== '/api/notify') {
      return json(404, { ok: false, error: 'Not found.' }, corsOrigin);
    }

    try {
      const payload = validatePayload(await readJson(request));
      if (payload.channel === 'email') {
        await sendEmail(env, payload);
      } else {
        await sendSms(env, payload);
      }
      return json(200, { ok: true, id: crypto.randomUUID() }, corsOrigin);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown delivery error.';
      return json(502, { ok: false, error: message }, corsOrigin);
    }
  }
};
