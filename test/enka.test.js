'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Endfield=require('../index');
const {createEnka,normaliseUID}=require('../src/enka');
const sample={
 playerInfo:{businessCard:{
  name:'Example Endministrator',shortId:'2719',gender:2,signature:'Test signature',
  adventureLevel:60,worldLevel:7,platformRoleId:'6976332004',
  domainDev:{domains:[{domainId:'domain_1',level:12},{domainId:'domain_2',level:30}]},
  achievement:{display:[{key:5,value:94}],infoList:[{achieveNumId:94,level:2,isPlated:true}]},
  statistic:{charNum:33,weaponNum:66,docNum:534},charList:[]
 }},
 uid:'6976332004',ttl:60,region:'EU/NA'
};
const ok=(body=sample)=>({ok:true,status:200,json:async()=>body,headers:{get:()=>null}});
test('reads supplied 10-digit UID and preserves complete raw Endfield JSON',async()=>{
 const calls=[];
 const e=createEnka({fetchImpl:async(url,opts)=>{calls.push({url,opts});return ok();}});
 assert.deepEqual(await e.player('6976332004'),sample);
 assert.equal(calls[0].url,'https://enka.network/api/ef/uid/6976332004');
 assert.match(calls[0].opts.headers['User-Agent'],/arknightsendfield-api/);
 assert.equal((await e.businessCard('6976332004')).adventureLevel,60);
 assert.equal((await e.profile('6976332004')).businessCard.name,'Example Endministrator');
 assert.equal((await e.achievements('6976332004')).display[0].value,94);
 assert.equal((await e.domains('6976332004'))[1].level,30);
 assert.equal((await e.statistics('6976332004')).weaponNum,66);
 assert.deepEqual(await e.operators('6976332004'),[]);
 assert.equal(calls.length,1);
});
test('supports optional character arrays without inventing missing public showcase data',async()=>{
 const e=createEnka({fetchImpl:async()=>ok({...sample,playerInfo:{businessCard:{charList:[{id:9,level:50}]}}})});
 assert.deepEqual(await e.operators('6976332004'),[{id:9,level:50}]);
 const absent=createEnka({fetchImpl:async()=>ok({playerInfo:{businessCard:{}},ttl:0})});
 assert.deepEqual(await absent.characters('6976332004'),[]);
 assert.equal(await absent.statistics('6976332004'),null);
 assert.deepEqual(await absent.domains('6976332004'),[]);
});
test('keeps the offline JSON and codes fully functional',async()=>{
 const api=Endfield({fetchImpl:async()=>ok()});
 assert.equal((await api.enka.player('6976332004')).region,'EU/NA');
 assert.equal((await api.player('6976332004')).uid,'6976332004');
 assert.equal((await api.character('akekuri')).name,'Akekuri');
 assert.equal((await api.codes.snapshot()).Active.length,4);
});
test('caches by TTL, deduplicates overlapping requests, refreshes, and clears cache',async()=>{
 let calls=0,now=0;
 const e=createEnka({clock:()=>now,fetchImpl:async()=>{calls++;return ok({...sample,ttl:2});}});
 const [a,b]=await Promise.all([e.player('6976332004'),e.player('6976332004')]);
 assert.equal(a,b);assert.equal(calls,1);
 now=1000;await e.player('6976332004');assert.equal(calls,1);
 now=3000;await e.player('6976332004');assert.equal(calls,2);
 await e.player('6976332004',{refresh:true});assert.equal(calls,3);
 e.clearCache('6976332004');await e.player('6976332004');assert.equal(calls,4);
});
test('validates UIDs and reports typed HTTP and network errors',async()=>{
 const e=createEnka({fetchImpl:async()=>ok()});
 assert.equal(normaliseUID(6976332004),'6976332004');
 for(const uid of ['','1234','0'.repeat(10),'123/../','1234567890123']){
   await assert.rejects(e.player(uid),TypeError);
 }
 await assert.rejects(e.player('6976332004',{refresh:1}),TypeError);
 for(const [status,code] of [[400,'INVALID_UID'],[404,'PLAYER_NOT_FOUND'],[424,'GAME_MAINTENANCE'],[429,'RATE_LIMITED'],[500,'SERVER_ERROR'],[503,'SERVICE_UNAVAILABLE']]){
   const client=createEnka({fetchImpl:async()=>({ok:false,status,headers:{get:()=>status===429?'15':null}})});
   await assert.rejects(client.player('6976332004'),error=>error.status===status&&error.code===code&&(status!==429||error.retryAfter===15));
 }
 const offline=createEnka({fetchImpl:async()=>{throw Error('offline');}});
 await assert.rejects(offline.player('6976332004'),{code:'NETWORK_ERROR'});
 const invalid=createEnka({fetchImpl:async()=>ok({ttl:1})});
 await assert.rejects(invalid.player('6976332004'),{code:'INVALID_RESPONSE'});
 const json=createEnka({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('not JSON');}})});
 await assert.rejects(json.player('6976332004'),{code:'INVALID_JSON'});
});
