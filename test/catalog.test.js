'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createDataStore } = require('../src/data-store');
const { createCatalog } = require('../src/catalog');

test('search finds Ash and Ash Prime, and exact character returns correct JSON', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tracker-catalog-'));
  try {
    const dir = path.join(root, 'characters'); await fs.mkdir(dir);
    await fs.writeFile(path.join(dir,'ash.json'), JSON.stringify({ id:'ash', name:'Ash', aliases:['Normal Ash'], ability:'Smoke Screen' }));
    await fs.writeFile(path.join(dir,'ashprime.json'), JSON.stringify({ id:'ashprime', name:'Ash Prime' }));
    await fs.writeFile(path.join(dir,'volt.json'), JSON.stringify({ id:'volt', name:'Volt' }));
    const store = createDataStore({ gameId:'test', bundledDir:root, cacheDir:path.join(root,'cache') });
    const catalog = createCatalog(store);
    const found = await catalog.search('Ash');
    assert.equal(found.total,2);
    assert.deepEqual(found.results.map(x=>x.id), ['ash','ashprime']);
    assert.equal((await catalog.character('ash')).name, 'Ash');
    assert.equal((await catalog.character('Ash Prime')).name, 'Ash Prime');
    assert.equal((await catalog.search('Electricity')).total,0);
    assert.match((await catalog.search('Not Here')).message, /don't have anything/);
    await assert.rejects(catalog.character('not-here'), {code:'NOT_FOUND'});
    assert.equal((await catalog.get('characters','ash')).ability,'Smoke Screen');
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});

test('search works across game data categories', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tracker-categories-'));
  try {
    await fs.mkdir(path.join(root,'items'));
    await fs.mkdir(path.join(root,'codes'));
    await fs.writeFile(path.join(root,'items','ash-token.json'), JSON.stringify({id:'ash-token',name:'Ash Token'}));
    await fs.writeFile(path.join(root,'codes','code-1.json'), JSON.stringify({id:'code-1',name:'Welcome Code',description:'Ash bonus'}));
    const catalog = createCatalog(createDataStore({ gameId:'test', bundledDir:root, cacheDir:path.join(root,'cache') }));
    assert.equal((await catalog.search('Ash')).total,2);
    assert.equal((await catalog.search('Ash',{category:'items'})).total,1);
    assert.equal((await catalog.item('ash-token')).name,'Ash Token');
    assert.equal((await catalog.code('code-1')).name,'Welcome Code');
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});
