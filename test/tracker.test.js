'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Genshin=require('../index');
test('bundled game metadata and 121 characters load offline',async()=>{
  const client=Genshin({fetchImpl:async()=>{throw Error('Unexpected network')}});
  assert.equal((await client.About()).name,'Genshin Impact');
  assert.equal((await client.characters.list()).length,121);
  assert.equal((await client.character('amber')).name,'Amber');
  assert.equal((await client.character('furina')).name,'Furina');
  assert.ok((await client.characters.search('Amber')).total>=1);
});
test('offline redeem codes preserve source grouping and data',async()=>{
  const client=Genshin({fetchImpl:async()=>{throw Error('Unexpected network')}});
  const doc=await client.codes.snapshot();
  assert.equal(doc.Active.length,19);
  assert.equal(doc.Expired.length,248);
  assert.equal(doc.Unknown.length,0);
  assert.equal((await client.codes.active()).length,19);
  assert.equal((await client.codes.expired()).length,248);
  assert.equal((await client.codes.all()).length,267);
  assert.ok((await client.codes.search('Primogems')).results.length>0);
  const first=doc.Active[0];
  assert.equal((await client.codes.get(first.code)).code,first.code);
  assert.equal(typeof first.redeemUrl,'string');
});
test('input checks reject invalid paths and filters',async()=>{
  const c=Genshin();
  await assert.rejects(c.data.get('../package.json'),TypeError);
  await assert.rejects(c.codes.all({limit:-1}),RangeError);
  await assert.rejects(c.codes.all({hasCode:'yes'}),TypeError);
  await assert.rejects(c.codes.get('definitely-not-a-real-code'),{code:'NOT_FOUND'});
  await assert.rejects(c.character('not-a-character'),{code:'NOT_FOUND'});
});
