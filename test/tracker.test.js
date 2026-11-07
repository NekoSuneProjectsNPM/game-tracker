'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const APEXStyleTracker = require('../index');
const { createClient, TrackerError } = require('../src/client');

test('direct API factory exposes game-specific methods without baseUrl', () => {
  const tracker = APEXStyleTracker({ apiKey: 'sample-key' });
  assert.equal(typeof tracker.getPlayerStats, 'function');
  assert.equal(typeof tracker.request, 'undefined');
});

test('unconfigured provider cannot accidentally call an invented endpoint', async () => {
  const tracker = APEXStyleTracker();
  await assert.rejects(tracker.getPlayerStats('player1'), /not implemented/);
});

test('internal provider URL is used with API-key bearer authentication', async () => {
  let observed;
  const provider = {
    baseUrl: 'https://example.test/v1/',
    auth: { type: 'bearer', required: true },
  };
  const request = createClient(provider, { apiKey: 'test-key', fetchImpl: async (url, options) => {
    observed = { url: String(url), headers: options.headers };
    return { ok: true, status: 200, json: async () => ({ wins: 4 }) };
  } });
  assert.deepEqual(await request({ path: 'players/test', query: { season: 2 } }), { wins: 4 });
  assert.equal(observed.url, 'https://example.test/v1/players/test?season=2');
  assert.equal(observed.headers.Authorization, 'Bearer test-key');
});

test('key-required providers reject missing credentials', () => {
  assert.throws(() => createClient({ baseUrl: 'https://example.test/', auth: { type: 'bearer', required: true } }), /requires an API key/);
});

test('internal client rejects foreign provider routes and reports HTTP errors', async () => {
  const request = createClient({ baseUrl: 'https://example.test/', auth: { type: 'none' } }, {
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });
  await assert.rejects(request({ path: 'https://malicious.test/' }), TypeError);
  await assert.rejects(request({ path: 'profile' }), error => error instanceof TrackerError && error.status === 404);
});
