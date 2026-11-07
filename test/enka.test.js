'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Genshin=require('../index');
const {createEnka}=require('../src/enka');
const example={playerInfo:{nickname:'Example',level:40,worldLevel:5,showAvatarInfoList:[{avatarId:10000024,level:50}]},avatarInfoList:[{avatarId:10000024,fightPropMap:{'20':0.1176},equipList:[{weapon:{level:20}}]}],ttl:60,uid:'123456789',region:'NA'};
const success=(value=example)=>({ok:true,status:200,json:async()=>value,headers:{get:()=>null}});
test('passes dynamic UID, preserves raw profile and honours TTL',async()=>{
 const requests=[];const e=createEnka({fetchImpl:async(url,opts)=>{requests.push({url,opts});return success();}});
 assert.deepEqual(await e.player('123456789'),example);
 assert.equal((await e.avatars('123456789'))[0].equipList[0].weapon.level,20);
 assert.equal(requests.length,1);
 assert.equal(new URL(requests[0].url).pathname,'/api/gi/uid/123456789/');
 assert.ok(requests[0].opts.headers['User-Agent'].includes('genshinimpact-api'));
});
test('supports legacy documented path and info-only query',async()=>{
 let url;
 const e=createEnka({endpoint:'legacy',fetchImpl:async(input)=>{url=input;return success({playerInfo:{nickname:'Example'},ttl:1});}});
 assert.equal((await e.info('123456789')).playerInfo.nickname,'Example');
 assert.equal(new URL(url).pathname,'/api/uid/123456789/');
 assert.equal(new URL(url).search,'?info');
 assert.deepEqual(await e.avatars('123456789'),[]);
});
test('tracker exposes UID methods and retains offline JSON',async()=>{
 const c=Genshin({fetchImpl:async()=>success()});
 assert.equal((await c.enka.player('123456789')).playerInfo.level,40);
 assert.equal((await c.character('amber')).name,'Amber');
 assert.equal((await c.codes.snapshot()).Expired.length,252);
});
test('refresh, TTL expiry and cache clearing work',async()=>{
 let calls=0,now=0;
 const e=createEnka({clock:()=>now,fetchImpl:async()=>{calls++;return success({...example,ttl:2});}});
 await e.player('123456789');now=1500;await e.player('123456789');assert.equal(calls,1);
 now=3000;await e.player('123456789');assert.equal(calls,2);
 await e.player('123456789',{refresh:true});assert.equal(calls,3);
 e.clearCache('123456789');await e.player('123456789');assert.equal(calls,4);
});
test('rejects invalid UID and unsupported options',async()=>{
 const e=createEnka({fetchImpl:async()=>success()});
 for(const id of ['','bad','123','12345678','1234567890','000000000']){
   await assert.rejects(e.player(id),TypeError);
 }
 await assert.rejects(e.player('123456789',{refresh:'yes'}),TypeError);
 assert.throws(()=>createEnka({endpoint:'other'}),RangeError);
});
test('typed errors for server responses',async()=>{
 for(const [status,code]of [[400,'INVALID_UID'],[404,'PLAYER_NOT_FOUND'],[424,'GAME_MAINTENANCE'],[429,'RATE_LIMITED'],[500,'SERVER_ERROR'],[503,'SERVICE_UNAVAILABLE']]){
   const e=createEnka({fetchImpl:async()=>({status,ok:false,headers:{get:()=>status===429?'30':null}})});
   await assert.rejects(e.player('123456789'),error=>error.code===code&&error.status===status);
 }
});
test('handles network, invalid JSON and missing public showcase',async()=>{
 const network=createEnka({fetchImpl:async()=>{throw Error('offline');}});
 await assert.rejects(network.player('123456789'),{code:'NETWORK_ERROR'});
 const json=createEnka({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('invalid')}})});
 await assert.rejects(json.player('123456789'),{code:'INVALID_JSON'});
 const noAvatars=createEnka({fetchImpl:async()=>success({playerInfo:{nickname:'Private'},ttl:0})});
 assert.deepEqual(await noAvatars.avatars('123456789'),[]);
});
