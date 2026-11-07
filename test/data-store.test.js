'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { createDataStore } = require('../src/data-store');

test('reads bundled JSON without network and rejects traversal', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tracker-data-'));
  try {
    await fs.writeFile(path.join(dir,'meta.json'), '{"name":"Test"}');
    const store = createDataStore({ gameId: 'sample', bundledDir: dir, cacheDir: path.join(dir,'cache') });
    assert.deepEqual(await store.get('meta.json'), { name: 'Test' });
    assert.deepEqual(await store.list(), ['meta.json']);
    await assert.rejects(store.get('../package.json'), /Unsafe/);
  } finally { await fs.rm(dir, { recursive:true, force:true }); }
});

test('downloads only changed GitHub JSON, persists and reads offline', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tracker-sync-'));
  let downloads = 0;
  const content = Buffer.from('{"name":"Warframe"}');
  const sha = crypto.createHash('sha1').update('blob ' + content.length + '\0').update(content).digest('hex');
  const fetchImpl = async url => {
    if (String(url).includes('/git/trees/')) return { ok:true, json:async()=>({ tree:[{ path:'data/warframe/meta.json', type:'blob', sha, size: content.length }] }) };
    downloads++;
    return {ok:true, arrayBuffer:async()=>content};
  };
  try {
    const settings = { gameId:'warframe', cacheDir:dir, github:{owner:'NekoSuneProjectsNPM',repo:'gaming-infos',branch:'main',directory:'data/warframe'} };
    const online = createDataStore({ ...settings, fetchImpl });
    assert.equal((await online.sync()).updated,1);
    assert.deepEqual(await online.get('meta.json'),{name:'Warframe'});
    assert.equal((await online.sync()).unchanged,1);
    assert.equal(downloads,1);
    const offline = createDataStore({ ...settings, fetchImpl:async()=>{throw Error('offline');} });
    assert.deepEqual(await offline.get('meta.json'),{name:'Warframe'});
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
