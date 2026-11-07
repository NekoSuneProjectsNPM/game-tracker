'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='zenless-zone-zero.json';
const GROUPS=Object.freeze({active:'Active',expired:'Expired',unknown:'Unknown'});
const norm=s=>String(s??'').trim().toLowerCase();
const NON_CODES=new Set(['denny','polychrome','x1','x2','x3','x300','x50','x60','x6666']);
function createCodes({cacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'zenlesszonezero-codes',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data','codes'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},syncFiles:[FILE]});
 async function snapshot({refresh=false,signal}={}){if(refresh)await data.sync({signal});const doc=await data.get(FILE);for(const group of Object.values(GROUPS))if(!Array.isArray(doc[group]))throw Error('Invalid ZZZ code data: '+group);return doc;}
 function select(rows,{status,category,hasCode,limit}={}){
  if(status!==undefined&&!Object.hasOwn(GROUPS,norm(status)))throw new RangeError('Invalid code status');
  if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1-10000');
  return rows.filter(x=>(status===undefined||norm(x.status)===norm(status))&&(category===undefined||norm(x.category)===norm(category))&&(hasCode===undefined||Boolean(x.code)===hasCode)).slice(0,limit??rows.length);
 }
 async function all(options={}){const doc=await snapshot(options);return select([...doc.Active,...doc.Expired,...doc.Unknown],options);}
 async function group(name,options={}){const doc=await snapshot(options);return select(doc[GROUPS[name]],options);}
 async function get(id,options={}){if(typeof id!=='string'&&!Number.isSafeInteger(id))throw new TypeError('Code or numeric ID required');if(!norm(id))throw new TypeError('Code cannot be empty');const row=(await all(options)).find(x=>norm(x.code)===norm(id)||norm(x.id)===norm(id));if(!row)throw Object.assign(new Error('Code not found'),{code:'NOT_FOUND'});return row;}
 async function search(query,options={}){if(typeof query!=='string'||!query.trim())throw new TypeError('Search text required');const needle=norm(query);const results=(await all(options)).filter(x=>[x.code,x.status,x.category,...(x.items||[]).map(i=>i.name)].some(v=>norm(v).includes(needle)));return {query,total:results.length,results};}
 async function candidates(options={}){const doc=await snapshot(options);return select(doc.Active.filter(x=>!NON_CODES.has(norm(x.code))),options).map(x=>({...x,verificationStatus:'unverified-snapshot'}));}
 async function verifiedActive(){return [];}
 return Object.freeze({snapshot,all,active:options=>group('active',options),expired:options=>group('expired',options),unknown:options=>group('unknown',options),get,search,candidates,verifiedActive,data,sync:opts=>data.sync(opts)});
}
module.exports={createCodes};
