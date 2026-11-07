'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGroupSearch}=require('../src/group-search');
const VRChat=require('../index');
const response=(status,payload)=>({ok:status>=200&&status<300,status,json:async()=>payload});
test('search sends caller query and requested page, not a hardcoded name',async()=>{
  const calls=[];
  const api=createGroupSearch({fetchImpl:async(url,options)=>{
    calls.push({url,options});
    return response(200,{data:[{groupId:'grp_test',name:'Some Dancing Club',shortCode:'ABC.1234',memberCount:12}],meta:{count:1,page:2,totalPages:7}});
  }});
  const result=await api.search('Dancing Club',{page:2});
  assert.equal(new URL(calls[0].url).searchParams.get('search'),'Dancing Club');
  assert.equal(new URL(calls[0].url).searchParams.get('page'),'2');
  assert.equal(calls[0].options.headers.Accept,'application/json');
  assert.equal(result.data[0].groupId,'grp_test');
  assert.deepEqual(result.meta,{count:1,page:2,totalPages:7});
});
test('groups.searchOnline is distinct from local JSON group search',async()=>{
  const v=VRChat({fetchImpl:async(url)=>{
    assert.match(url,/\/api\/v1\/groups\/search/);
    return response(200,{data:[{groupId:'grp_example',name:'Another Group'}],meta:{count:1,page:1,totalPages:1}});
  }});
  const remote=await v.groups.searchOnline('Another Group');
  assert.equal(remote.data[0].groupId,'grp_example');
  const local=await v.groups.search('NekoSune');
  assert.equal(typeof local.total,'number');
});
test('missing, invalid and unsafe query options are rejected',async()=>{
  const api=createGroupSearch({fetchImpl:async()=>response(200,{data:[],meta:{count:0,page:1,totalPages:1}})});
  await assert.rejects(api.search(''),TypeError);
  await assert.rejects(api.search('club',{page:0}),RangeError);
  await assert.rejects(api.search('club',{page:1.5}),RangeError);
});
test('HTTP 403, 404 and 500 have a typed status error',async()=>{
  for(const status of [403,404,500]){
    const api=createGroupSearch({fetchImpl:async()=>response(status,{error:'failure'})});
    await assert.rejects(api.search('club'),err=>err.code==='HTTP_ERROR'&&err.status===status);
  }
});
test('invalid JSON format is reported separately',async()=>{
  const api=createGroupSearch({fetchImpl:async()=>response(200,{items:[]})});
  await assert.rejects(api.search('club'),err=>err.code==='INVALID_RESPONSE');
});
test('network errors have a typed code',async()=>{
  const api=createGroupSearch({fetchImpl:async()=>{throw Error('Offline');}});
  await assert.rejects(api.search('club'),err=>err.code==='NETWORK_ERROR');
});
