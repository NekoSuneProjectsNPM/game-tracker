'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Endfield=require('../index');
test('bundled game metadata and 32 Operators work entirely offline',async()=>{
 const e=Endfield({fetchImpl:async()=>{throw Error('Unexpected network call')}});
 assert.equal((await e.About()).name,'Arknights: Endfield');
 const list=await e.characters.list();
 assert.equal(list.length,32);
 assert.equal(new Set(list.map(v=>v.slug)).size,32);
 assert.equal((await e.character('akekuri')).name,'Akekuri');
 assert.equal((await e.character('Perlica')).name,'Perlica');
 assert.equal((await e.character('endministrator')).name,'Endministrator');
 assert.ok((await e.characters.search('Heat')).total>0);
});
test('archived redemption-code groups preserve historical data',async()=>{
 const e=Endfield({fetchImpl:async()=>{throw Error('Unexpected network call')}});
 const doc=await e.codes.snapshot();
 assert.equal(doc.Active.length,15);
 assert.equal(doc.Expired.length,11);
 assert.equal(doc.Unknown.length,0);
 assert.equal((await e.codes.all()).length,26);
 assert.equal((await e.codes.active()).length,15);
 assert.equal((await e.codes.expired()).length,11);
 assert.equal((await e.codes.get('AKENDFIELDSUB')).code,'AKENDFIELDSUB');
 assert.ok((await e.codes.search('Oroberyl')).total>0);
});
test('code candidates exclude reward fragments and past expiry',async()=>{
 const e=Endfield();
 const candidates=await e.codes.candidates({now:Date.parse('2026-11-07T00:00:00Z')});
 assert.deepEqual(candidates.map(x=>x.code).sort(),['AKENDFIELDSUB','ZAU2SYXHWX5L4ZH'].sort());
 assert.ok(candidates.every(x=>x.verificationStatus==='unverified-snapshot'));
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
