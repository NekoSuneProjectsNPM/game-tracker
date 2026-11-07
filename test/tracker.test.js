'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Endfield=require('../index');
test('bundled game metadata and 34 Operators work entirely offline',async()=>{
 const e=Endfield({fetchImpl:async()=>{throw Error('Unexpected network call')}});
 assert.equal((await e.About()).name,'Arknights: Endfield');
 const list=await e.characters.list();
 assert.equal(list.length,34);
 assert.equal(new Set(list.map(v=>v.slug)).size,34);
 assert.equal((await e.character('Si')).element,'Cryo');
 assert.equal((await e.character('Argent Flow')).element,'Electric');
 assert.equal((await e.character('akekuri')).name,'Akekuri');
 assert.equal((await e.character('Perlica')).name,'Perlica');
 assert.equal((await e.character('endministrator')).name,'Endministrator');
 assert.ok((await e.characters.search('Heat')).total>0);
});
test('archived redemption-code groups preserve historical data',async()=>{
 const e=Endfield({fetchImpl:async()=>{throw Error('Unexpected network call')}});
 const doc=await e.codes.snapshot();
 assert.equal(doc.Active.length,4);
 assert.equal(doc.Expired.length,4);
 assert.equal(doc.Unknown.length,0);
 assert.equal((await e.codes.all()).length,8);
 assert.equal((await e.codes.active()).length,4);
 assert.equal((await e.codes.expired()).length,4);
 assert.equal((await e.codes.get('AKENDFIELDSUB')).status,'expired');
 assert.ok((await e.codes.search('Oroberyl')).total>0);
 assert.equal((await e.codes.get('ENDFIELDSTEAM')).expiry.expiresAt,'2026-11-25T15:59:00.000Z');
});
test('code candidates exclude reward fragments and past expiry',async()=>{
 const e=Endfield();
 const candidates=await e.codes.candidates({now:Date.parse('2026-11-07T00:00:00Z')});
 assert.deepEqual(candidates.map(x=>x.code).sort(),['ENDFIELDSTEAM','ENDFIELDGIFT','ENDFIELD4PC','ZAU2SYXHWX5L4ZH'].sort());
 assert.ok(candidates.every(x=>x.verificationStatus==='reported-active-unverified'||x.verificationStatus==='official-announcement-reported'));
 assert.deepEqual(await e.codes.verifiedActive(),[]);
});
test('invalid inputs are rejected',async()=>{
 const e=Endfield();
 await assert.rejects(e.data.get('../package.json'),TypeError);
 await assert.rejects(e.codes.all({limit:-1}),RangeError);
 await assert.rejects(e.codes.all({hasCode:'true'}),TypeError);
 await assert.rejects(e.codes.candidates({now:NaN}),TypeError);
 await assert.rejects(e.codes.get('NOT_A_REAL_CODE'),{code:'NOT_FOUND'});
 await assert.rejects(e.character('not-a-character'),{code:'NOT_FOUND'});
});

test('audited code archive excludes scraped fragments and respects expired deadlines',async()=>{
 const api=Endfield();const keys=new Set((await api.codes.all()).map(x=>x.code.toLowerCase()));
 assert.equal(keys.size,8);
 for(const bad of ['Oroberyl','Sticker','T-Creds','x100','Protodisk'])assert.equal(keys.has(bad.toLowerCase()),false);
 for(const old of ['AKENDFIELDSUB','ENDFIELDRENEW','ALLFIELD','RETURNOFALL'])assert.equal((await api.codes.get(old)).status,'expired');
 assert.equal((await api.codes.candidates({now:Date.parse('2026-11-26T00:00:00Z')})).some(x=>x.code==='ENDFIELDSTEAM'),false);
 assert.ok((await api.codes.get('ENDFIELD4PC')).requirements.includes('PC client only'));
});
