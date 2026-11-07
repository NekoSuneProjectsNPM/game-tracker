'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='genshin-impact.json';
const GROUPS=Object.freeze({active:'Active',expired:'Expired',unknown:'Unknown'});
const canonical=value=>String(value??'').trim().toLowerCase();

function createCodes({cacheDir,githubToken,fetchImpl}={}){
  const data=createDataStore({
    gameId:'genshinimpact-codes', cacheDir, githubToken,fetchImpl,
    bundledDir:path.join(__dirname,'..','data','codes'),
    github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},
    syncFiles:[FILE]
  });
  async function snapshot({refresh=false,signal}={}){
    if(refresh)await data.sync({signal});
    const result=await data.get(FILE);
    for(const key of Object.values(GROUPS)){
      if(!Array.isArray(result[key]))throw Error('Invalid Genshin redeem-code JSON: '+key);
    }
    return result;
  }
  function filter(entries,{hasCode,status,category,limit}={}){
    if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
    if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1-10000');
    if(status!==undefined&&!(canonical(status) in GROUPS))throw new RangeError('Invalid code status');
    return entries.filter(entry=>
      (hasCode===undefined||Boolean(entry.code)===hasCode)&&
      (status===undefined||canonical(entry.status)===canonical(status))&&
      (category===undefined||canonical(entry.category)===canonical(category))
    ).slice(0,limit??entries.length);
  }
  async function all(options={}){
    const doc=await snapshot(options);
    return filter([...doc.Active,...doc.Expired,...doc.Unknown],options);
  }
  async function grouped(name,options={}){
    const doc=await snapshot(options);
    return filter(doc[GROUPS[name]],options);
  }
  async function get(value,options={}){
    if(typeof value!=='string'&&!Number.isSafeInteger(value))throw new TypeError('Code or numeric ID required');
    const needle=canonical(value);
    if(!needle)throw new TypeError('Nonempty code required');
    const found=(await all(options)).find(x=>canonical(x.code)===needle||canonical(x.id)===needle);
    if(!found){const error=new Error('Code not found: '+value);error.code='NOT_FOUND';throw error;}
    return found;
  }
  async function search(query,options={}){
    if(typeof query!=='string'||!query.trim())throw new TypeError('Code search query required');
    const needle=canonical(query);
    const matches=(await all(options)).filter(x=>
      [x.code,x.category,x.status,x.verificationStatus,x.redeemLocation,...(x.items||[]).map(v=>v.name)]
      .some(v=>canonical(v).includes(needle))
    );
    return {query,total:matches.length,results:matches};
  }
  return Object.freeze({
    all,active:options=>grouped('active',options),expired:options=>grouped('expired',options),
    unknown:options=>grouped('unknown',options),get,search,snapshot,data,
    sync:options=>data.sync(options)
  });
}
module.exports={createCodes};
