import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../server/notify-worker.mjs';

const env = {
  NOTIFY_REQUEST_TOKEN: 'integration-token',
  NOTIFY_CORS_ORIGIN: 'http://localhost:5173',
  NOTIFY_QUEUE_RETRY_SEC: '5',
  NOTIFY_QUEUE_MAX_ATTEMPTS: '2',
  EMAIL_WEBHOOK_URL: 'http://127.0.0.1:1/unreachable'
};

const authHeaders = {
  Origin: 'http://localhost:5173',
  'Content-Type': 'application/json',
  'X-Nullcal-Token': 'integration-token'
};

test('worker notify route queues failures and exposes queue depth', async () => {
  const notifyResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/notify', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        channel: 'email',
        to: 'alerts@example.com',
        message: 'integration queue test'
      })
    }),
    env
  );

  assert.equal(notifyResponse.status, 202);
  const notifyPayload = await notifyResponse.json();
  assert.equal(notifyPayload.ok, true);
  assert.equal(notifyPayload.queued, true);

  const healthResponse = await worker.fetch(
    new Request('https://example.workers.dev/health', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173'
      }
    }),
    env
  );

  assert.equal(healthResponse.status, 200);
  const healthPayload = await healthResponse.json();
  assert.ok(healthPayload.queueDepth >= 1);
});

test('worker sync route supports write/read integration flow', async () => {
  const writeResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        token: 'integration-sync-token',
        senderId: 'integration-client',
        sentAt: Date.now(),
        payloadEncoding: 'e2ee-v1',
        payloadCiphertext: {
          version: 1,
          salt: 'c2FsdA==',
          iv: 'aXY=',
          ciphertext: 'aW50ZWdyYXRpb24='
        }
      })
    }),
    env
  );

  assert.equal(writeResponse.status, 200);
  const writePayload = await writeResponse.json();
  assert.equal(writePayload.ok, true);

  const readResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync?token=integration-sync-token&since=0', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        'X-Nullcal-Token': 'integration-token'
      }
    }),
    env
  );

  assert.equal(readResponse.status, 200);
  const readPayload = await readResponse.json();
  assert.equal(readPayload.ok, true);
  assert.equal(Array.isArray(readPayload.items), true);
  assert.equal(readPayload.items.length >= 1, true);
  assert.equal(readPayload.items[0].payload, undefined);
  assert.equal(readPayload.items[0].payloadEncoding, 'e2ee-v1');
});
