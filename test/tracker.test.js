'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Genshin=require('../index');
test('bundled game metadata and 121 characters load offline',async()=>{
  const client=Genshin({fetchImpl:async()=>{throw Error('Unexpected network')}});
  assert.equal((await client.About()).name,'Genshin Impact');
  assert.equal((await client.characters.list()).length,124);
  for(const name of ['Mitya','Valeriy','Vodyanitsa'])assert.equal((await client.character(name)).name,name);
  assert.equal((await client.character('amber')).name,'Amber');
  assert.equal((await client.character('furina')).name,'Furina');
  assert.ok((await client.characters.search('Amber')).total>=1);
});
test('offline redeem codes preserve source grouping and data',async()=>{
  const client=Genshin({fetchImpl:async()=>{throw Error('Unexpected network')}});
  const doc=await client.codes.snapshot();
  assert.equal(doc.Active.length,0);
  assert.equal(doc.Expired.length,252);
  assert.equal(doc.Unknown.length,8);
  assert.equal((await client.codes.active()).length,0);
  assert.equal((await client.codes.expired()).length,252);
  assert.equal((await client.codes.all()).length,260);
  assert.ok((await client.codes.search('Primogems')).results.length>0);
  const first=doc.Unknown.find(x=>x.code==='PJ2KEBRAYSRM');
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

test('audited codes do not expose expired or malformed tokens as active',async()=>{
  const c=Genshin();
  const doc=await c.codes.snapshot();
  const known=new Set([...doc.Active,...doc.Expired,...doc.Unknown].map(v=>String(v.code).toLowerCase()));
  assert.equal(known.size,260);
  for(const fragment of ['Mora','Primogem','x100','s'])assert.equal(known.has(fragment.toLowerCase()),false);
  for(const code of ['BALLETCOLLAB','XVIZDH2B9WGX','MySnezhnayaCareer','LEGEDILJKSGM']){
    assert.equal((await c.codes.get(code)).status,'expired');
  }
  assert.equal((await c.codes.get('GENSHINGIFT')).status,'unknown');
  assert.equal((await c.codes.get('KeepUpWithMitya')).verificationStatus,'reported-active-unverified');
});
