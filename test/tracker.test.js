'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ZZZ=require('../index');
test('loads all 61 playable Agents and local metadata without network',async()=>{
 const z=ZZZ({fetchImpl:async()=>{throw Error('Unexpected network');}});
 const about=await z.About();assert.equal(about.name,'Zenless Zone Zero');
 const agents=await z.characters.list();
 assert.equal(agents.length,61);
 assert.equal(new Set(agents.map(x=>x.slug)).size,61);
 assert.equal((await z.character('Anby Demara')).attribute,'Electric');
 assert.equal((await z.character('Phoenix Reffaella')).version,'3.3');
 assert.equal((await z.character('Starlight - Billy Kid')).specialty,'Rupture');
 assert.equal((await z.character('Pyrois')).rank,'I-Rank');
 assert.ok((await z.characters.search('Fire')).total>0);
 await assert.rejects(z.character('Severian Lowell'),{code:'NOT_FOUND'});
});
test('audited archive and reported code candidates exclude scraped reward labels',async()=>{
 const z=ZZZ({fetchImpl:async()=>{throw Error('Unexpected network');}});
 const doc=await z.codes.snapshot();
 assert.equal(doc.Active.length,4);
 assert.equal(doc.Expired.length,109);
 assert.equal(doc.Unknown.length,2);
 assert.equal((await z.codes.all()).length,115);
 const candidates=await z.codes.candidates();
 assert.equal(candidates.length,4);
 assert.ok(candidates.every(x=>x.verificationStatus==='reported-active-unverified'));
 for(const bad of ['Denny','Polychrome','x300']){
  assert.ok(!candidates.some(x=>x.code===bad));
  assert.ok(!(await z.codes.all()).some(x=>x.code===bad));
 }
 for(const known of ['LEVELUP33','INKSHIFT33','HOLLOWRUN33','ZENLESSGIFT'])assert.ok(candidates.some(x=>x.code===known));
 for(const old of ['ZZZ31REMIELLE','ZZZMEIJI','JRNY2SKY'])assert.equal((await z.codes.get(old)).status,'expired');
 for(const disputed of ['ZZZ2YEAR','SUNBRINGER'])assert.equal((await z.codes.get(disputed)).status,'unknown');
 assert.deepEqual(await z.codes.verifiedActive(),[]);
 assert.equal((await z.codes.get('ZENLESSGIFT')).code,'ZENLESSGIFT');
});
test('invalid inputs rejected without accessing network',async()=>{
 const z=ZZZ();
 await assert.rejects(z.data.get('../package.json'),TypeError);
 await assert.rejects(z.codes.all({hasCode:'yes'}),TypeError);
 await assert.rejects(z.codes.all({limit:0}),RangeError);
 await assert.rejects(z.codes.get('NO_SUCH_ZZZ_CODE'),{code:'NOT_FOUND'});
});
