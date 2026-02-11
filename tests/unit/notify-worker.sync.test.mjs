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
        payload: { profiles: [], calendars: [], events: [], templates: [] }
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
