'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const Warframe = require('../index');
const { createDataStore } = require('../src/data-store');

test('bundled Warframe codes preserve status groups and non-redeemable glyph entries', async () => {
  const warframeData = Warframe({ fetchImpl: async () => { throw Error('No network expected'); } });
  const summary = await warframeData.codes.summary();
  assert.equal(summary.groups.active.total, 503);
  assert.equal(summary.groups.expired.total, 32);
  assert.equal(summary.groups.unknown.total, 0);
  assert.equal(summary.total, 535);
  assert.ok(summary.groups.active.withoutCode > 0);
  const activeCodes = await warframeData.codes.active({ hasCode: true, limit: 3 });
  assert.equal(activeCodes.length, 3);
  assert.ok(activeCodes.every(record => typeof record.code === 'string' && record.code.trim()));
  const creatorGlyphs = await warframeData.codes.active({ category: 'creator-glyph', hasCode: false, limit: 2 });
  assert.ok(creatorGlyphs.length);
  assert.ok(creatorGlyphs.every(record => record.code == null));
  assert.equal((await warframeData.codes.unknown()).length, 0);
});

test('code lookups return full records and search produces useful not-found messages', async () => {
  const warframeData = Warframe();
  const code = await warframeData.codes.get('1999-QUINCY');
  assert.equal(code.code, '1999-QUINCY');
  assert.equal(code.status, 'active');
  assert.ok(Array.isArray(code.items));
  const byId = await warframeData.code(code.id);
  assert.equal(byId.id, code.id);
  const results = await warframeData.codes.search('QUINCY');
  assert.ok(results.total >= 1);
  assert.ok(results.results.some(item => item.code === '1999-QUINCY'));
  const missing = await warframeData.codes.search('no-code-will-match-this-123456789');
  assert.equal(missing.total, 0);
  assert.match(missing.message, /don't have anything/);
  await assert.rejects(warframeData.code('no-code-will-match-this-123456789'), { code:'NOT_FOUND' });
});

test('codes incremental sync filters only the Warframe file from all games', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'warframe-codes-sync-'));
  const body = Buffer.from(JSON.stringify({ Active:[], Expired:[], Unknown:[] }));
  const sha = crypto.createHash('sha1').update('blob ' + body.length + '\0').update(body).digest('hex');
  let blobs = 0;
  const fetchImpl = async url => {
    if(String(url).includes('/git/trees/')) return { ok:true,json:async()=>({
      tree:[
        { path:'codes/games/fortnite.json',type:'blob',sha,size:body.length },
        { path:'codes/games/warframe.json',type:'blob',sha,size:body.length }
      ]
    }) };
    blobs++;
    return { ok:true,json:async()=>({encoding:'base64',content:body.toString('base64')}) };
  };
  try {
    const store = createDataStore({
      gameId:'warframe-codes',cacheDir:root,
      github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},
      syncFiles:['warframe.json'],fetchImpl
    });
    assert.deepEqual(await store.sync(),{updated:1,unchanged:0,checked:1,cacheDir:root});
    assert.equal((await store.sync()).unchanged,1);
    assert.equal(blobs,1);
    assert.deepEqual(await store.get('warframe.json'),{Active:[],Expired:[],Unknown:[]});
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
