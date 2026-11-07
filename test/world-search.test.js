'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const VRChat=require('../index');
const {createWorldSearch}=require('../src/world-search');
const response=(status,payload)=>({ok:status>=200&&status<300,status,json:async()=>payload});

test('world search uses caller text and selected platform without hardcoded example',async()=>{
  let call;
  const provider=createWorldSearch({fetchImpl:async(url,opts)=>{
    call={url,opts};
    return response(200,{data:[{
      worldId:'wrld_example',name:'Sample Mirror',authorId:'usr_example',
      platformBadge:'PC + Quest + iOS',visits:4500,occupants:3,previewYoutubeId:null,
      imageUrl:'https://example.org/image.jpg'
    }],meta:{count:1}});
  }});
  const result=await provider.search('Mirror World',{platform:'pc'});
  const u=new URL(call.url);
  assert.equal(u.pathname,'/api/v1/worlds/search');
  assert.equal(u.searchParams.get('search'),'Mirror World');
  assert.equal(u.searchParams.get('platform'),'pc');
  assert.equal(result.data[0].worldId,'wrld_example');
  assert.equal(result.data[0].previewYoutubeId,null);
  assert.deepEqual(result.meta,{count:1});
  assert.equal(call.opts.headers.Accept,'application/json');
});
test('worlds.searchOnline is separate from local JSON search',async()=>{
  const client=VRChat({fetchImpl:async(url)=>{
    assert.match(url,/\/api\/v1\/worlds\/search/);
    return response(200,{data:[{worldId:'wrld_external',name:'External World'}],meta:{count:1}});
  }});
  const online=await client.worlds.searchOnline('External');
  assert.equal(online.data[0].worldId,'wrld_external');
  const offline=await client.worlds.search('Black Cat');
  assert.ok(offline.total>=1);
});
test('generic world searches accept a selected platform and validate input',async()=>{
  const provider=createWorldSearch({fetchImpl:async()=>response(200,{data:[],meta:{count:0}})});
  await assert.rejects(provider.search(''),TypeError);
  await assert.rejects(provider.search('x',{platform:'?'}),TypeError);
  assert.equal((await provider.search('Avatar',{platform:'android'})).meta.count,0);
});
test('HTTP errors 403 404 500 are isolated',async()=>{
  for(const status of [403,404,500]){
    const provider=createWorldSearch({fetchImpl:async()=>response(status,{})});
    await assert.rejects(provider.search('Some World'),e=>e.code==='HTTP_ERROR'&&e.status===status);
  }
});
test('invalid JSON and incompatible schema are reported separately',async()=>{
  const invalid=createWorldSearch({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('invalid JSON');}})});
  await assert.rejects(invalid.search('World'),e=>e.code==='INVALID_JSON');
  const bad=createWorldSearch({fetchImpl:async()=>response(200,{data:[],meta:{}})});
  await assert.rejects(bad.search('World'),e=>e.code==='INVALID_RESPONSE');
});
test('connection failures return typed errors',async()=>{
  const provider=createWorldSearch({fetchImpl:async()=>{throw Error('DNS failure');}});
  await assert.rejects(provider.search('World'),e=>e.code==='NETWORK_ERROR');
});
