'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const Warframe=require('../index');

test('all six WFCD projects are represented by fixed-source adapters',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'warframe-wfcd-'));
  const body=Buffer.from(JSON.stringify([{name:'Ash'}]));
  const sha=crypto.createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex');
  let blobs=0,metadata=0;
  const fetchImpl=async url=>{
    const text=String(url);
    if(text.includes('/contents/data/json/Warframes.json?ref=master')) {
      metadata++;
      return {ok:true,json:async()=>({type:'file',size:body.length,sha})};
    }
    if(text.includes('/git/blobs/'+sha)) {
      blobs++;
      return {ok:true,json:async()=>({encoding:'base64',content:body.toString('base64')})};
    }
    throw Error('Unexpected URL '+text);
  };
  try{
    const game=Warframe({cacheDir:dir,fetchImpl});
    for(const kind of ['drops','items','relics','patchlogs'])assert.equal(typeof game.wfcd[kind].get,'function');
    assert.equal(typeof game.market,'function');
    assert.equal(typeof game.createUpdateMonitor,'function');
    assert.deepEqual(await game.wfcd.items.warframes(),[{name:'Ash'}]);
    assert.deepEqual(await game.wfcd.items.warframes(),[{name:'Ash'}]);
    assert.equal(blobs,1);
    assert.equal(metadata,1);
    assert.deepEqual(await game.wfcd.items.warframes({refresh:true}),[{name:'Ash'}]);
    assert.equal(metadata,2);
    assert.equal(blobs,1);
    const offline=Warframe({cacheDir:dir,fetchImpl:()=>{throw Error('No network');}});
    assert.deepEqual(await offline.wfcd.items.warframes(),[{name:'Ash'}]);
    await assert.rejects(game.wfcd.items.get('../README.md'),RangeError);
  } finally {await fs.rm(dir,{recursive:true,force:true});}
});
