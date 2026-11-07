'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),NTE=require('../index');
test('offline metadata and character roster',async()=>{
 const api=NTE({fetchImpl:async()=>{throw Error('No network');}});
 assert.equal((await api.About()).name,'Neverness to Everness');
 assert.equal((await api.characters.list()).length,21);
 assert.equal((await api.character('Adler')).name,'Adler');
 assert.equal((await api.character('Zankou')).name,'Zankou');
 assert.ok((await api.characters.search('Incantation')).total>0);
});
test('historical archive is separate from November reports',async()=>{
 const api=NTE({fetchImpl:async()=>{throw Error('No network');}});
 const raw=await api.codes.snapshot();
 assert.equal(raw.Active.length,11);assert.equal(raw.Expired.length,25);assert.equal(raw.Unknown.length,0);
 assert.equal((await api.codes.all()).length,36);
 assert.equal((await api.codes.candidates()).some(x=>x.code==='Copy'),false);
 assert.equal((await api.codes.reported({now:Date.parse('2026-11-07T00:00:00Z')})).length,4);
 assert.equal((await api.codes.reported({includeExpired:true})).length,7);
 assert.deepEqual(await api.codes.verifiedActive(),[]);
});
test('rejects unsafe input and invalid filters',async()=>{
 const api=NTE();await assert.rejects(api.data.get('../package.json'),TypeError);
 await assert.rejects(api.codes.all({hasCode:'true'}),TypeError);
 await assert.rejects(api.codes.all({limit:-1}),RangeError);
 await assert.rejects(api.codes.candidates({now:NaN}),TypeError);
 await assert.rejects(api.codes.get('NOT_REAL'),{code:'NOT_FOUND'});
 await assert.rejects(api.character('not-a-character'),{code:'NOT_FOUND'});
});
