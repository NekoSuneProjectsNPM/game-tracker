'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const HSR=require('../index');
const example={detailInfo:{uid:601499975,nickname:'Example',level:28,worldLevel:1,avatarDetailList:[{avatarId:8004,level:40,skillTreeList:[{pointId:8004001,level:1}],equipment:{tid:23005,level:40,_flat:{props:[{type:'BaseHP',value:463.2}]}},relicList:[{tid:31021,level:2,_flat:{setID:102}}]}],recordInfo:{achievementCount:74}},ttl:60,uid:'601499975',region:'NA'};
const response=(value=example)=>({ok:true,status:200,headers:{get:()=>null},json:async()=>value});
test('loads all 91 local character records, game and code archive offline',async()=>{
 const hsr=HSR({fetchImpl:async()=>{throw Error('Unexpected network');}});
 assert.equal((await hsr.About()).name,'Honkai: Star Rail');
 assert.equal((await hsr.characters.list()).length,91);
 for(const name of ['Pearl','Aventurine • Waveflair','Robin • Summeretto']) assert.equal((await hsr.character(name)).name,name);
 assert.equal((await hsr.character('acheron')).name,'Acheron');
 assert.ok((await hsr.characters.search('Acheron')).total>0);
 const codes=await hsr.codes.snapshot();
 assert.equal(codes.Active.length,0);
 assert.equal(codes.Expired.length,224);
 assert.equal(codes.Unknown.length,12);
 assert.equal((await hsr.codes.all()).length,236);
 assert.deepEqual(await hsr.codes.verifiedActive(),[]);
});
test('queries a supplied HSR UID and returns full original detailInfo, relics and light cones',async()=>{
 const calls=[];
 const hsr=HSR({fetchImpl:async(url,opt)=>{calls.push([url,opt]);return response();}});
 assert.deepEqual(await hsr.enka.player('601499975'),example);
 assert.equal(new URL(calls[0][0]).pathname,'/api/hsr/uid/601499975');
 assert.ok(calls[0][1].headers['User-Agent']);
 assert.equal((await hsr.enka.avatars('601499975'))[0].equipment._flat.props[0].type,'BaseHP');
 assert.equal((await hsr.enka.info('601499975')).nickname,'Example');
 assert.equal(calls.length,1);
});
test('cache respects TTL and refresh',async()=>{
 let now=0,calls=0;
 const hsr=HSR({enkaOptions:{clock:()=>now},fetchImpl:async()=>{calls++;return response({...example,ttl:2});}});
 await hsr.player('601499975');now=1000;await hsr.player('601499975');
 assert.equal(calls,1);now=3000;await hsr.player('601499975');assert.equal(calls,2);
 await hsr.player('601499975',{refresh:true});assert.equal(calls,3);
 hsr.enka.clearCache('601499975');await hsr.player('601499975');assert.equal(calls,4);
});
test('invalid UIDs and typed Enka HTTP errors',async()=>{
 const hsr=HSR({fetchImpl:async()=>response()});
 for(const uid of ['','abc','12345678','1234567890','000000000'])await assert.rejects(hsr.enka.player(uid),TypeError);
 for(const [status,code] of [[400,'INVALID_UID'],[404,'PLAYER_NOT_FOUND'],[424,'GAME_MAINTENANCE'],[429,'RATE_LIMITED'],[500,'SERVER_ERROR'],[503,'SERVICE_UNAVAILABLE']]){
   const h=HSR({fetchImpl:async()=>({ok:false,status,headers:{get:()=>status===429?'10':null}})});
   await assert.rejects(h.enka.player('601499975'),err=>err.code===code&&err.status===status);
 }
});
test('handles absent public showcased characters, invalid JSON and network failures',async()=>{
 const empty=HSR({fetchImpl:async()=>response({detailInfo:{nickname:'Hidden'},ttl:0})});
 assert.deepEqual(await empty.enka.avatars('601499975'),[]);
 const bad=HSR({fetchImpl:async()=>response({ttl:0})});
 await assert.rejects(bad.player('601499975'),{code:'INVALID_RESPONSE'});
 const network=HSR({fetchImpl:async()=>{throw Error('offline');}});
 await assert.rejects(network.player('601499975'),{code:'NETWORK_ERROR'});
 const json=HSR({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('bad')}})});
 await assert.rejects(json.player('601499975'),{code:'INVALID_JSON'});
});

test('audited HSR codes exclude 81 scraped character/reward fragments',async()=>{
 const hsr=HSR(),snapshot=await hsr.codes.snapshot();
 assert.equal((await hsr.codes.active()).length,0);
 const keys=new Set((await hsr.codes.all()).map(x=>String(x.code).toLowerCase()));
 assert.equal(keys.size,236);
 for(const bad of ['Acheron','Bronya','Credit','Fuel','Updated','x100','s'])assert.equal(keys.has(bad.toLowerCase()),false);
 for(const known of ['STARRAILGIFT','OMEGA','DSLSPNBREASP','PEARLAPPRAISE'])assert.equal((await hsr.codes.get(known)).status,'unknown');
 for(const old of ['NEVERGONNAGIVE','NEVERGONNAMAKE','AHABLESSYOU'])assert.equal((await hsr.codes.get(old)).status,'expired');
 assert.equal(snapshot.Unknown.length,12);
});
