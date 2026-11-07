'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='neverness-to-everness.json',REPORTS='reported-codes.json';
const GROUPS=Object.freeze({active:'Active',expired:'Expired',unknown:'Unknown'});
const BAD=new Set(['000','copy','accessibility','contact','pcgamesn','s']);
const lower=x=>String(x??'').trim().toLowerCase();
function createCodes({cacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'nte-codes',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data','codes'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},syncFiles:[FILE]});
 async function snapshot({refresh=false,signal}={}){if(refresh)await data.sync({signal});const d=await data.get(FILE);for(const k of Object.values(GROUPS))if(!Array.isArray(d[k]))throw Error('Invalid NTE code archive: '+k);return d;}
 function filter(rows,{status,hasCode,category,limit}={}){
  if(status!==undefined&&!Object.hasOwn(GROUPS,lower(status)))throw new RangeError('Invalid code status');
  if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1–10000');
  return rows.filter(x=>(status===undefined||lower(x.status)===lower(status))&&(hasCode===undefined||Boolean(x.code)===hasCode)&&(category===undefined||lower(x.category)===lower(category))).slice(0,limit??rows.length);
 }
 async function all(options={}){const d=await snapshot(options);return filter([...d.Active,...d.Expired,...d.Unknown],options);}
 async function group(k,options={}){return filter((await snapshot(options))[GROUPS[k]],options);}
 async function get(value,options={}){if(typeof value!=='string'&&!Number.isSafeInteger(value))throw new TypeError('Code or ID required');if(!lower(value))throw new TypeError('Code required');const x=(await all(options)).find(v=>lower(v.code)===lower(value)||lower(v.id)===lower(value));if(!x)throw Object.assign(new Error('Code not found'),{code:'NOT_FOUND'});return x;}
 async function search(query,options={}){if(typeof query!=='string'||!query.trim())throw new TypeError('Search required');const q=lower(query);const results=(await all(options)).filter(x=>[x.code,x.status,x.category,...(x.items||[]).map(v=>v.name)].some(v=>lower(v).includes(q)));return {query,total:results.length,results};}
 async function candidates({now=Date.now(),...opts}={}){const ts=now instanceof Date?now.getTime():now;if(!Number.isFinite(ts))throw new TypeError('Invalid now');const doc=await snapshot(opts);return filter(doc.Active.filter(x=>!BAD.has(lower(x.code))&&(!x.expiry?.expiresAt||Date.parse(x.expiry.expiresAt)>ts)),opts).map(x=>({...x,verificationStatus:x.verificationStatus||'reported-active-unverified'}));}
 async function reported({now=Date.now(),includeExpired=false}={}){const ts=now instanceof Date?now.getTime():now;if(!Number.isFinite(ts))throw new TypeError('Invalid now');if(typeof includeExpired!=='boolean')throw new TypeError('Invalid includeExpired');const doc=await data.get(REPORTS);if(!Array.isArray(doc.codes))throw Error('Invalid reported code data');return doc.codes.filter(x=>includeExpired||!x.expiresAt||Date.parse(x.expiresAt)>ts);}
 async function verifiedActive(){return [];}
 return Object.freeze({snapshot,all,active:o=>group('active',o),expired:o=>group('expired',o),unknown:o=>group('unknown',o),get,search,candidates,reported,verifiedActive,data,sync:o=>data.sync(o)});
}
module.exports={createCodes};
