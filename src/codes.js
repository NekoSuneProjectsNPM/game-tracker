'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='honkai-star-rail.json', GROUPS={active:'Active',expired:'Expired',unknown:'Unknown'};
const norm=x=>String(x??'').trim().toLowerCase();
function createCodes({cacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'honkaistarrail-codes',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data','codes'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},syncFiles:[FILE]});
 async function snapshot({refresh=false,signal}={}){if(refresh)await data.sync({signal});const doc=await data.get(FILE);for(const k of Object.values(GROUPS))if(!Array.isArray(doc[k]))throw Error('Invalid HSR code archive: '+k);return doc;}
 function filter(rows,{hasCode,status,category,limit}={}){
   if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
   if(status!==undefined&&!Object.hasOwn(GROUPS,norm(status)))throw new RangeError('Invalid status');
   if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1–10000');
   return rows.filter(v=>(hasCode===undefined||Boolean(v.code)===hasCode)&&(status===undefined||norm(v.status)===norm(status))&&(category===undefined||norm(v.category)===norm(category))).slice(0,limit??rows.length);
 }
 async function all(options={}){const doc=await snapshot(options);return filter([...doc.Active,...doc.Expired,...doc.Unknown],options);}
 async function group(groupName,options={}){const doc=await snapshot(options);return filter(doc[GROUPS[groupName]],options);}
 async function get(value,options={}){if(typeof value!=='string'&&!Number.isSafeInteger(value))throw new TypeError('Code or numeric ID required');const needle=norm(value);if(!needle)throw new TypeError('Nonempty code required');const entry=(await all(options)).find(v=>norm(v.code)===needle||norm(v.id)===needle);if(!entry)throw Object.assign(new Error('Code not found'),{code:'NOT_FOUND'});return entry;}
 async function search(query,options={}){if(typeof query!=='string'||!query.trim())throw new TypeError('Search text required');const needle=norm(query);const results=(await all(options)).filter(v=>[v.code,v.status,v.category,...(v.items||[]).map(item=>item.name)].some(x=>norm(x).includes(needle)));return {query,total:results.length,results};}
 // The archive contains scraped names and stale "active" statuses.
 // Therefore verifiedActive intentionally returns no unverified records.
 async function verifiedActive(){return [];}
 return Object.freeze({snapshot,all,active:opts=>group('active',opts),expired:opts=>group('expired',opts),unknown:opts=>group('unknown',opts),get,search,verifiedActive,data,sync:opts=>data.sync(opts)});
}
module.exports={createCodes};
