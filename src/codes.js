'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const FILE='arknights-endfield.json';
const GROUPS=Object.freeze({active:'Active',expired:'Expired',unknown:'Unknown'});
const canonical=value=>String(value??'').trim().toLowerCase();
function createCodes({cacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'arknightsendfield-codes',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data','codes'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},syncFiles:[FILE]});
 async function snapshot({refresh=false,signal}={}){
  if(refresh)await data.sync({signal});
  const doc=await data.get(FILE);
  for(const group of Object.values(GROUPS))if(!Array.isArray(doc[group]))throw Error('Invalid Endfield redemption code JSON: '+group);
  return doc;
 }
 function filter(rows,{hasCode,status,category,limit}={}){
  if(hasCode!==undefined&&typeof hasCode!=='boolean')throw new TypeError('hasCode must be boolean');
  if(status!==undefined&&!Object.hasOwn(GROUPS,canonical(status)))throw new RangeError('Invalid code status');
  if(limit!==undefined&&(!Number.isInteger(limit)||limit<1||limit>10000))throw new RangeError('limit must be 1–10000');
  return rows.filter(row=>(hasCode===undefined||Boolean(row.code)===hasCode)&&(status===undefined||canonical(row.status)===canonical(status))&&(category===undefined||canonical(row.category)===canonical(category))).slice(0,limit??rows.length);
 }
 async function all(opts={}){const d=await snapshot(opts);return filter([...d.Active,...d.Expired,...d.Unknown],opts);}
 async function group(name,opts={}){const d=await snapshot(opts);return filter(d[GROUPS[name]],opts);}
 async function get(value,opts={}){
  if(typeof value!=='string'&&!Number.isSafeInteger(value))throw new TypeError('Code string or numeric id required');
  if(!canonical(value))throw new TypeError('Nonempty code required');
  const entry=(await all(opts)).find(x=>canonical(x.code)===canonical(value)||canonical(x.id)===canonical(value));
  if(!entry)throw Object.assign(new Error('Endfield code not found'),{code:'NOT_FOUND'});
  return entry;
 }
 async function search(query,opts={}){
  if(typeof query!=='string'||!query.trim())throw new TypeError('Search query is required');
  const q=canonical(query);
  const results=(await all(opts)).filter(row=>[row.code,row.status,row.category,row.verificationStatus,...(row.items||[]).map(v=>v.name)].some(x=>canonical(x).includes(q)));
  return {query,total:results.length,results};
 }
 async function candidates({now=Date.now(),...opts}={}){
  const time=now instanceof Date?now.valueOf():now;
  if(!Number.isFinite(time))throw new TypeError('now must be a valid timestamp');
  const d=await snapshot(opts);
  return filter(d.Active.filter(row=>(!row.expiry?.expiresAt||Date.parse(row.expiry.expiresAt)>time)),opts)
    .map(row=>({...row,verificationStatus:row.verificationStatus||'reported-active-unverified'}));
 }
 async function verifiedActive(){return [];}
 return Object.freeze({snapshot,all,active:opts=>group('active',opts),expired:opts=>group('expired',opts),unknown:opts=>group('unknown',opts),get,search,candidates,verifiedActive,data,sync:opts=>data.sync(opts)});
}
module.exports={createCodes};
