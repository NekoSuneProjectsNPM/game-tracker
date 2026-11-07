'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Warframe = require('../index');

test('package exposes separate Warframe API and local JSON namespaces', async () => {
  let requests=[];
  const warframeData=Warframe({platform:'pc',fetchImpl:async url=>{
    requests.push(String(url));
    return {ok:true,status:200,json:async()=>({ok:true})};
  }});
  assert.equal(typeof warframeData.About,'function');
  assert.equal(typeof warframeData.search,'function');
  assert.equal(typeof warframeData.character,'function');
  assert.equal(typeof warframeData.api.alerts,'function');
  assert.deepEqual(await warframeData.api.alerts(),{ok:true});
  assert.equal(requests[0],'https://api.warframestat.us/pc/alerts');
  await warframeData.api.searchWarframes('Ash Prime',{language:'en'});
  assert.equal(requests[1],'https://api.warframestat.us/warframes/search/Ash%20Prime?language=en');
  await warframeData.api.profileStats('Tenno Test');
  assert.equal(requests[2],'https://api.warframestat.us/profile/Tenno%20Test/stats');
  await warframeData.api.worldstate();
  assert.equal(requests[3],'https://api.warframestat.us/pc');
  await warframeData.api.drops();
  assert.equal(requests[4],'https://api.warframestat.us/drops');
});

test('bundled Warframe meta and 127 JSON records read offline', async () => {
  const warframeData=Warframe({fetchImpl:async()=>{throw Error('network should not be called');}});
  const about=await warframeData.About();
  assert.equal(about.name,'Warframe');
  const ash=await warframeData.character('ash');
  assert.equal(ash.name,'Ash');
  const prime=await warframeData.character('ashprime');
  assert.equal(prime.name,'Ash Prime');
  const fileList=await warframeData.data.list();
  assert.ok(fileList.includes('characters/ash.json'));
  assert.ok(fileList.includes('characters/ashprime.json'));
  assert.ok(fileList.length>=127);
});

test('request validation and status errors', async () => {
  assert.throws(()=>Warframe({platform:'invalid'}),RangeError);
  const warframeData=Warframe({fetchImpl:async()=>({ok:false,status:404})});
  await assert.rejects(warframeData.api.profile('Missing User'),{name:'TrackerError',status:404});
  assert.throws(()=>warframeData.api.warframe(''),TypeError);
  assert.throws(()=>warframeData.api.list('mystery'),RangeError);
  assert.throws(()=>warframeData.api.worldstateField('https://evil.example'),TypeError);
});
