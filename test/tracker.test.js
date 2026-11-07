'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),WuWa=require('../index');
test('loads all 57 characters and game data with no network',async()=>{
 const api=WuWa({fetchImpl:async()=>{throw Error('Network not permitted');}});
 assert.equal((await api.About()).name,'Wuthering Waves');
 const characters=await api.characters.list();
 assert.equal(characters.length,57);
 assert.equal(new Set(characters.map(x=>x.slug)).size,57);
 assert.equal((await api.character('Hsin')).element,'Electro');
 assert.equal((await api.character('Suoming')).weapon,'Sword');
 assert.equal((await api.character('Yangyang: Xuanling')).version,'3.5');
 assert.equal((await api.character('The Shorekeeper')).rarity,5);
 assert.ok((await api.characters.search('3.7')).total>=2);
});
test('audited code archive retains four candidates and old history',async()=>{
 const api=WuWa({fetchImpl:async()=>{throw Error('Network not permitted');}});
 const doc=await api.codes.snapshot();
 assert.equal(doc.Active.length,4);
 assert.equal(doc.Expired.length,68);
 assert.equal(doc.Unknown.length,0);
 assert.equal((await api.codes.all()).length,72);
 for(const label of ['Astrite','Attention!','x2','x50','Accessibility','Add-Ons','PCGamesN'])assert.ok(!(await api.codes.all()).some(x=>x.code===label));
 for(const code of ['TRAINOFSOULS','BLOOMINGFLOWERS','SCHOOLLIFE','WUTHERINGGIFT'])assert.ok((await api.codes.get(code)).code===code);
 assert.equal((await api.codes.candidates({now:Date.parse('2026-11-07T12:00:00Z')})).length,4);
 assert.equal((await api.codes.candidates({now:Date.parse('2026-11-09T00:00:00Z')})).length,1);
 assert.deepEqual(await api.codes.verifiedActive(),[]);
});
test('rejects invalid local paths and code filters',async()=>{
 const api=WuWa();
 await assert.rejects(api.data.get('../package.json'),TypeError);
 await assert.rejects(api.codes.candidates({now:NaN}),TypeError);
 await assert.rejects(api.codes.all({limit:-1}),RangeError);
 await assert.rejects(api.codes.all({hasCode:1}),TypeError);
 await assert.rejects(api.codes.get('NO_REAL_CODE'),{code:'NOT_FOUND'});
 await assert.rejects(api.character('unknown-resonator'),{code:'NOT_FOUND'});
});
