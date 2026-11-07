'use strict';
const {createAvatarSearch}=require('../src/avatar-providers');
const query=process.argv[2]||'Rindo';
(async()=>{
  const result=await createAvatarSearch({timeoutMs:12000}).search(query);
  for(const p of result.providers)console.log(JSON.stringify({provider:p.provider,status:p.status,state:p.state,count:p.count||0,latencyMs:p.latencyMs,url:p.url,message:p.message||null}));
  console.log('Providers checked:',result.providers.length,'HTTP+JSON usable:',result.successful,'unavailable/incompatible:',result.failed);
  // This command is diagnostic: provider outages must not block builds.
})().catch(e=>{console.error(e);process.exitCode=1;});
