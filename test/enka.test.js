'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ZZZ = require('../index');
const {createEnka,normalizeUID} = require('../src/enka');

const sample = {
  PlayerInfo:{
    ShowcaseDetail:{AvatarList:[
      {Id:1331,Level:60,PromotionLevel:6,TalentLevel:0,CoreSkillEnhancement:6,
        SkillLevelList:[{Index:0,Level:12}],Weapon:{Id:14133,Level:41,Uid:4396},
        EquippedList:[{Slot:1,Equipment:{Id:31641,Level:15,
          MainPropertyList:[{PropertyId:11103,PropertyValue:550}],
          RandomPropertyList:[{PropertyId:23203,PropertyValue:9}]}}]}
    ]},
    SocialDetail:{Desc:'Sample',MedalList:[{MedalType:1,Value:7}],
      ProfileDetail:{Nickname:'Example',Uid:1300528351,Level:58,PlatformType:26}}
  },
  uid:'1300528351',ttl:60,region:'Asia'
};
const ok = (data=sample)=>({ok:true,status:200,json:async()=>data,headers:{get:()=>null}});

test('ZZZ Enka requests dynamic 10-digit UID and keeps the raw nested showcase data',async()=>{
  const calls=[];
  const enka=createEnka({fetchImpl:async(url,opts)=>{calls.push({url,opts});return ok();}});
  const full=await enka.player('1300528351');
  assert.deepEqual(full,sample);
  assert.equal(calls[0].url,'https://enka.network/api/zzz/uid/1300528351');
  assert.match(calls[0].opts.headers['User-Agent'],/zenlesszonezero-api/);
  assert.equal((await enka.agents('1300528351'))[0].EquippedList[0].Equipment.RandomPropertyList[0].PropertyValue,9);
  assert.equal((await enka.info('1300528351')).Level,58);
  assert.equal((await enka.social('1300528351')).MedalList[0].Value,7);
  assert.equal(calls.length,1);
});

test('public SDK exposes Enka alongside offline JSON character and code APIs',async()=>{
  const zzz=ZZZ({fetchImpl:async()=>ok()});
  assert.equal((await zzz.enka.player('1300528351')).PlayerInfo.SocialDetail.ProfileDetail.Nickname,'Example');
  assert.equal((await zzz.player('1300528351')).region,'Asia');
  assert.equal((await zzz.character('ellenjoe')).name,'Ellen Joe');
  assert.equal((await zzz.codes.snapshot()).Expired.length,109);
});

test('Enka supports 9-digit UIDs, TTL, refresh, cache clear and in-flight deduplication',async()=>{
  let calls=0,now=0;
  const api=createEnka({clock:()=>now,fetchImpl:async()=>{calls++;return ok({...sample,ttl:2});}});
  const [a,b]=await Promise.all([api.player('123456789'),api.player('123456789')]);
  assert.equal(a,b);assert.equal(calls,1);
  now=1000;await api.player('123456789');assert.equal(calls,1);
  now=3000;await api.player('123456789');assert.equal(calls,2);
  await api.player('123456789',{refresh:true});assert.equal(calls,3);
  api.clearCache('123456789');await api.player('123456789');assert.equal(calls,4);
});

test('rejects malformed UID, options and network errors',async()=>{
  const api=createEnka({fetchImpl:async()=>ok()});
  for(const uid of ['','abc','12345678','12345678901','0000000000','123456/../../']){
    await assert.rejects(api.player(uid),TypeError);
  }
  assert.equal(normalizeUID(1300528351),'1300528351');
  await assert.rejects(api.player('1300528351',{refresh:'yes'}),TypeError);
  const broken=createEnka({fetchImpl:async()=>{throw Error('unavailable');}});
  await assert.rejects(broken.player('1300528351'),{code:'NETWORK_ERROR'});
});

test('responds to HTTP errors, including rate limits and retry-after',async()=>{
  for(const [status,code]of [[400,'INVALID_UID'],[404,'PLAYER_NOT_FOUND'],[424,'GAME_MAINTENANCE'],[429,'RATE_LIMITED'],[500,'SERVER_ERROR'],[503,'SERVICE_UNAVAILABLE']]){
    const api=createEnka({fetchImpl:async()=>({ok:false,status,headers:{get:()=>status===429?'20':null}})});
    await assert.rejects(api.player('1300528351'),err=>err.status===status&&err.code===code&&(status!==429||err.retryAfter===20));
  }
});

test('missing showcase is valid, but missing PlayerInfo or malformed JSON is not',async()=>{
  const api=createEnka({fetchImpl:async()=>ok({PlayerInfo:{SocialDetail:{ProfileDetail:{Nickname:'Private'}}},ttl:0})});
  assert.deepEqual(await api.agents('1300528351'),[]);
  assert.equal((await api.info('1300528351')).Nickname,'Private');
  const invalid=createEnka({fetchImpl:async()=>ok({ttl:60})});
  await assert.rejects(invalid.player('1300528351'),{code:'INVALID_RESPONSE'});
  const json=createEnka({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('bad json');}})});
  await assert.rejects(json.player('1300528351'),{code:'INVALID_JSON'});
});
