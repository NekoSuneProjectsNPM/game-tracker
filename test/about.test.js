'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createDataStore } = require('../src/data-store');

test('About data is the complete meta.json object, including platform details', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'game-about-'));
  try {
    const meta = { name: 'Warframe', Platform: 'Windows, PlayStation, Xbox', engine: 'Evolution', developers: 'Digital Extremes' };
    await fs.writeFile(path.join(root, 'meta.json'), JSON.stringify(meta));
    const store = createDataStore({ gameId: 'warframe', bundledDir: root, cacheDir: path.join(root, 'cache') });
    assert.deepEqual(await store.get('meta.json'), meta);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('tracker About() reads local meta.json and reports missing data without guessing', async () => {
  const Tracker = require('../index');
  const instance = Tracker({ cacheDir: path.join(os.tmpdir(), 'nonexistent-game-about-' + process.pid) });
  assert.equal(typeof instance.About, 'function');
  await assert.rejects(instance.About(), { code: 'ENOENT' });
});
