'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createAvatarSearch,sources,BROWSER_UA}=require('../src/avatar-providers');
function fakeResponse(status,data,contentType='application/json'){
  return {status,ok:status>=200&&status<300,headers:{get:()=>contentType},text:async()=>typeof data==='string'?data:JSON.stringify(data)};
}
test('all eight fixed endpoints use search query and a browser-style User-Agent',async()=>{
  const calls=[];
  const api=createAvatarSearch({fetchImpl:async(url,opts)=>{calls.push({url,opts});return fakeResponse(200,{avatars:[{id:'avtr_1',name:'Rindo'}]});}});
  const out=await api.search('Rindo');
  assert.equal(out.providers.length,8);assert.equal(out.successful,8);assert.equal(out.total,8);
  assert.equal(sources().length,8);
  for(const c of calls){
    const url=new URL(c.url);assert.equal(url.searchParams.get('search'),'Rindo');
    assert.equal(c.opts.headers['User-Agent'],BROWSER_UA);
    assert.equal(c.opts.method,'GET');
  }
});
test('403/404/500 statuses do not crash other providers',async()=>{
  const api=createAvatarSearch({fetchImpl:async url=>{
    if(url.includes('avtr.icu'))return fakeResponse(403,{error:'forbidden'});
    if(url.includes('worldbalancer.com'))return fakeResponse(404,{error:'missing'});
    if(url.includes('fumikoecho.net'))return fakeResponse(500,{error:'server'});
    return fakeResponse(200,{results:[{id:'avtr_ok'}]});
  }});
  const out=await api.search('Rindo');
  assert.equal(out.failed,3);assert.equal(out.successful,5);
  assert.deepEqual(out.providers.slice(0,3).map(p=>p.status),[403,404,500]);
  assert.ok(out.providers.slice(0,3).every(p=>p.state==='http_error'));
});
test('HTML and unknown JSON formats are reported as incompatible',async()=>{
  const api=createAvatarSearch({fetchImpl:async url=>url.includes('avtr.icu')?fakeResponse(200,'<html>Login</html>','text/html'):fakeResponse(200,{unknown:true})});
  const out=await api.search('Rindo');
  assert.equal(out.providers[0].state,'unsupported_response');
  assert.equal(out.providers[1].state,'unsupported_schema');
  assert.equal(out.failed,8);
});
test('failure and validation isolation',async()=>{
  const api=createAvatarSearch({timeoutMs:500,fetchImpl:async()=>{throw Error('DNS failed');}});
  const out=await api.search('Rindo',{providers:['avtrdb']});
  assert.equal(out.failed,1);assert.equal(out.providers[0].state,'network_error');
  await assert.rejects(api.search('',{}),TypeError);
  await assert.rejects(api.search('x',{providers:['not-real']}),RangeError);
});
