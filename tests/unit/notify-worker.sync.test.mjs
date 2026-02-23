import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../server/notify-worker.mjs';

const env = {
  NOTIFY_REQUEST_TOKEN: 'test-token',
  NOTIFY_CORS_ORIGIN: 'http://localhost:5173'
};

const authHeaders = {
  Origin: 'http://localhost:5173',
  'Content-Type': 'application/json',
  'X-Nullcal-Token': 'test-token'
};

test('worker sync endpoint stores and returns revisions', async () => {
  const writeResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        token: 'sync-token',
        senderId: 'sender-a',
        sentAt: Date.now(),
        payloadEncoding: 'e2ee-v1',
        payloadCiphertext: {
          version: 1,
          salt: 'c2FsdA==',
          iv: 'aXY=',
          ciphertext: 'ZW5jcnlwdGVk'
        }
      })
    }),
    env
  );

  assert.equal(writeResponse.status, 200);
  const writeBody = await writeResponse.json();
  assert.equal(writeBody.ok, true);
  assert.equal(writeBody.revision, 1);

  const pullResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync?token=sync-token&since=0', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        'X-Nullcal-Token': 'test-token'
      }
    }),
    env
  );

  assert.equal(pullResponse.status, 200);
  const pullBody = await pullResponse.json();
  assert.equal(pullBody.ok, true);
  assert.equal(pullBody.latestRevision, 1);
  assert.equal(Array.isArray(pullBody.items), true);
  assert.equal(pullBody.items.length, 1);
  assert.equal(pullBody.items[0].senderId, 'sender-a');
  assert.equal(pullBody.items[0].payload, undefined);
  assert.deepEqual(pullBody.items[0].payloadCiphertext, {
    version: 1,
    salt: 'c2FsdA==',
    iv: 'aXY=',
    ciphertext: 'ZW5jcnlwdGVk'
  });
});

test('worker sync endpoint enforces request token', async () => {
  const response = await worker.fetch(
    new Request('https://example.workers.dev/api/sync?token=sync-token&since=0', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173'
      }
    }),
    env
  );

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.ok, false);
});

test('worker sync endpoint rejects unencrypted payload writes', async () => {
  const response = await worker.fetch(
    new Request('https://example.workers.dev/api/sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        token: 'sync-token',
        senderId: 'sender-a',
        sentAt: Date.now(),
        payload: { profiles: [], calendars: [], events: [], templates: [] }
      })
    }),
    env
  );

  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.error, 'Encrypted sync payload is required.');
});

test('worker sync endpoint supports durable KV backing when configured', async () => {
  const kvData = new Map();
  const durableEnv = {
    ...env,
    SYNC_KV: {
      async get(key) {
        return kvData.get(key) ?? null;
      },
      async put(key, value) {
        kvData.set(key, value);
      }
    }
  };

  const writeResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        token: 'kv-sync-token',
        senderId: 'kv-sender',
        sentAt: Date.now(),
        payloadEncoding: 'e2ee-v1',
        payloadCiphertext: {
          version: 1,
          salt: 'c2FsdA==',
          iv: 'aXY=',
          ciphertext: 'a3YtZW5jcnlwdGVk'
        }
      })
    }),
    durableEnv
  );

  assert.equal(writeResponse.status, 200);
  assert.equal(kvData.size >= 1, true);

  const readResponse = await worker.fetch(
    new Request('https://example.workers.dev/api/sync?token=kv-sync-token&since=0', {
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
        'X-Nullcal-Token': 'test-token'
      }
    }),
    durableEnv
  );

  assert.equal(readResponse.status, 200);
  const payload = await readResponse.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].payload, undefined);
  assert.equal(payload.items[0].payloadEncoding, 'e2ee-v1');
  assert.equal(payload.items[0].payloadCiphertext.ciphertext, 'a3YtZW5jcnlwdGVk');
});
