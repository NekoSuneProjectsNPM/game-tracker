'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const Warframe=require('../index');

test('new Warframe JSON missing from local files downloads from JsonData and is cached',async()=>{
  const cache=await fs.mkdtemp(path.join(os.tmpdir(),'warframe-new-json-'));
  const payload=Buffer.from(JSON.stringify({name:'Future Test Warframe',isPrime:false,description:'Mocked test record'}));
  const sha=crypto.createHash('sha1').update('blob '+payload.length+'\0').update(payload).digest('hex');
  let blobs=0,trees=0;
  const fetchImpl=async url=>{
    const target=String(url);
    if(target.includes('/git/trees/')){
      trees++;
      return {ok:true,json:async()=>({truncated:false,tree:[
        {path:'games/warframe/characters/futuretestwarframe.json',type:'blob',sha,size:payload.length}
      ]})};
    }
    if(target.endsWith('/git/blobs/'+sha)){
      blobs++;
      return {ok:true,json:async()=>({encoding:'base64',content:payload.toString('base64')})};
    }
    throw Error('Unexpected test URL '+target);
  };
  try{
    const game=Warframe({cacheDir:cache,fetchImpl});
    const item=await game.character('futuretestwarframe');
    assert.equal(item.name,'Future Test Warframe');
    assert.equal(blobs,1);
    assert.equal((await game.search('Future Test Warframe')).total,1);
    assert.equal((await game.data.sync()).unchanged,1);
    assert.equal(blobs,1);
    assert.ok(trees>=2);
    const offline=Warframe({cacheDir:cache,fetchImpl:()=>{throw Error('Network unavailable');}});
    assert.equal((await offline.character('futuretestwarframe')).name,'Future Test Warframe');
  } finally {await fs.rm(cache,{recursive:true,force:true});}
});

test('missing exact JSON can skip network and searches optionally check GitHub for new files',async()=>{
  const game=Warframe({fetchImpl:()=>{throw Error('Should not access GitHub');}});
  await assert.rejects(game.character('a-character-that-does-not-exist',{refresh:false}),{code:'NOT_FOUND'});
  const result=await game.search('Narin');
  assert.ok(result.total>=1);
  assert.equal((await game.character('narin')).name,'Narin');
  assert.equal((await game.character('citrineprime')).name,'Citrine Prime');
});
