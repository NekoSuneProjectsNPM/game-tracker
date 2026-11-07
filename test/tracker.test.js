'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTracker, TrackerError } = require('../index');

test('requests JSON with query parameters and authorization', async () => {
  let observed;
  const tracker = createTracker({ baseUrl: 'https://example.com/api/', apiKey: 'test', fetchImpl: async (url, options) => {
    observed = { url: String(url), headers: options.headers };
    return { ok: true, status: 200, json: async () => ({ wins: 4 }) };
  } });
  assert.deepEqual(await tracker.request('players/test', { query: { season: 2 } }), { wins: 4 });
  assert.equal(observed.url, 'https://example.com/api/players/test?season=2');
  assert.equal(observed.headers.Authorization, 'Bearer test');
});

test('rejects HTTP failures with status', async () => {
  const tracker = createTracker({ baseUrl: 'https://example.com/', fetchImpl: async () => ({ ok: false, status: 404 }) });
  await assert.rejects(tracker.request('profile'), e => e instanceof TrackerError && e.status === 404);
});

test('does not allow external URL or invalid base URL', async () => {
  assert.throws(() => createTracker({ baseUrl: 'invalid' }), TypeError);
  const tracker = createTracker({ baseUrl: 'https://example.com/' });
  await assert.rejects(tracker.request('https://evil.example'), TypeError);
});
