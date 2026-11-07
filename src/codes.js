'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='wuthering-waves.json',GROUPS=Object.freeze({active:'Active',expired:'Expired',unknown:'Unknown'});
const lower=x=>String(x??'').trim().toLowerCase();
function createCodes({cacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'wutheringwaves-codes',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data','codes'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},syncFiles:[FILE]});
 async function snapshot({refresh=false,signal}={}){if(refresh)await data.sync({signal});const doc=await data.get(FILE);for(const group of Object.values(GROUPS))if(!Array.isArray(doc[group]))throw Error('Invalid Wuthering Waves code data: '+group);return doc;}
 function filter(rows,{limit,status,category,hasCode}={}){
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1-10000');
  if(status!==undefined&&!Object.hasOwn(GROUPS,lower(status)))throw new RangeError('Invalid code status');
  if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
  return rows.filter(x=>(status===undefined||lower(x.status)===lower(status))&&(category===undefined||lower(x.category)===lower(category))&&(hasCode===undefined||Boolean(x.code)===hasCode)).slice(0,limit??rows.length);
 }
 async function all(options={}){const doc=await snapshot(options);return filter([...doc.Active,...doc.Expired,...doc.Unknown],options);}
 async function grouped(key,options={}){const doc=await snapshot(options);return filter(doc[GROUPS[key]],options);}
 async function get(value,options={}){if(typeof value!=='string'&&!Number.isSafeInteger(value))throw new TypeError('Code or ID required');if(!lower(value))throw new TypeError('Nonempty code required');const result=(await all(options)).find(v=>lower(v.code)===lower(value)||lower(v.id)===lower(value));if(!result)throw Object.assign(new Error('Code not found'),{code:'NOT_FOUND'});return result;}
 async function search(query,options={}){if(typeof query!=='string'||!query.trim())throw new TypeError('Search query required');const needle=lower(query);const results=(await all(options)).filter(v=>[v.code,v.category,v.status,...(v.items||[]).map(x=>x.name)].some(x=>lower(x).includes(needle)));return {query,total:results.length,results};}
 async function candidates({now=Date.now(),...options}={}){
  const timestamp=now instanceof Date?now.getTime():now;
  if(!Number.isFinite(timestamp))throw new TypeError('now must be a valid timestamp');
  const doc=await snapshot(options);
  return filter(doc.Active.filter(x=>!x.expiry?.expiresAt||Date.parse(x.expiry.expiresAt)>timestamp),options)
   .map(x=>({...x,verificationStatus:x.verificationStatus||'reported-active-unverified'}));
 }
 async function verifiedActive(){return [];}
 return Object.freeze({snapshot,all,active:o=>grouped('active',o),expired:o=>grouped('expired',o),unknown:o=>grouped('unknown',o),get,search,candidates,verifiedActive,data,sync:o=>data.sync(o)});
}
module.exports={createCodes};
