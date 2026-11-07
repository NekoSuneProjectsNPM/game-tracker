'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createWorldSearch}=require('../src/world-search');
const VRChat=require('../index');
const makeResponse=(status,body)=>({status,ok:status>=200&&status<300,json:async()=>body});
const makePage=(page=1)=>({
  data:Array.from({length:24},(_,i)=>({
    worldId:'wrld_'+i,name:'World '+i,authorName:'creator',visits:1000+i,
    releaseStatus:'public',platformBadge:'PC + Quest',previewYoutubeId:null
  })),
  meta:{count:24,page,totalPages:1974,totalCount:47355}
});

test('browse defaults to popular page 1 and preserves 24 world records and metadata',async()=>{
  let request;
  const api=createWorldSearch({fetchImpl:async(url,options)=>{
    request={url,options};return makeResponse(200,makePage());
  }});
  const result=await api.browse();
  const parsed=new URL(request.url);
  assert.equal(parsed.pathname,'/api/v1/worlds/browse');
  assert.equal(parsed.searchParams.get('sort'),'popular');
  assert.equal(parsed.searchParams.get('page'),'1');
  assert.equal(parsed.searchParams.has('search'),false);
  assert.equal(result.data.length,24);
  assert.deepEqual(result.meta,{count:24,page:1,totalPages:1974,totalCount:47355});
  assert.equal(result.data[0].worldId,'wrld_0');
  assert.equal(request.options.headers.Accept,'application/json');
});

test('supports each sort value, pagination, and public tracker namespace',async()=>{
  const calls=[];
  const client=VRChat({fetchImpl:async url=>{
    calls.push(new URL(url));return makeResponse(200,makePage(2));
  }});
  for(const sort of ['updated','newest','oldest','popular']){
    const result=await client.worlds.browse({sort,page:2});
    assert.equal(result.meta.page,2);
    assert.equal(calls.at(-1).searchParams.get('sort'),sort);
    assert.equal(calls.at(-1).searchParams.get('page'),'2');
  }
  assert.deepEqual(client.worlds.browseSorts,['updated','newest','oldest','popular']);
  assert.equal((await client.worlds.search('Black Cat')).total>0,true);
});

test('rejects unsupported sorting modes and invalid page values',async()=>{
  const api=createWorldSearch({fetchImpl:async()=>makeResponse(200,makePage())});
  await assert.rejects(api.browse({sort:'trending'}),RangeError);
  for(const page of [0,-1,1.5,'2',NaN,Infinity]){
    await assert.rejects(api.browse({page}),RangeError);
  }
});

test('handles 403 404 500, malformed JSON, schema errors and network failures',async()=>{
  for(const status of [403,404,500]){
    const api=createWorldSearch({fetchImpl:async()=>makeResponse(status,{error:'failure'})});
    await assert.rejects(api.browse(),error=>error.code==='HTTP_ERROR'&&error.status===status);
  }
  const json=createWorldSearch({fetchImpl:async()=>({ok:true,status:200,json:async()=>{throw Error('bad JSON')}})});
  await assert.rejects(json.browse(),error=>error.code==='INVALID_JSON');
  const schema=createWorldSearch({fetchImpl:async()=>makeResponse(200,{data:[],meta:{count:0}})});
  await assert.rejects(schema.browse(),error=>error.code==='INVALID_RESPONSE');
  const offline=createWorldSearch({fetchImpl:async()=>{throw Error('offline')}});
  await assert.rejects(offline.browse(),error=>error.code==='NETWORK_ERROR');
});
