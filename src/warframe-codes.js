'use strict';
const path = require('node:path');
const { createDataStore } = require('./data-store');

const FILE = 'warframe.json';
const GROUPS = Object.freeze({ active:'Active', expired:'Expired', unknown:'Unknown' });
const normalise = text => String(text ?? '').normalize('NFKC').trim().toLowerCase();
function validate(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source) ||
      !Object.values(GROUPS).every(group => Array.isArray(source[group]))) {
    throw new TypeError('Invalid Warframe codes JSON: Active, Expired and Unknown arrays are required');
  }
  return source;
}
function createWarframeCodes({cacheDir,githubToken,fetchImpl}={}) {
  const storage = createDataStore({
    gameId:'warframe-codes',
    cacheDir:cacheDir ? path.join(path.resolve(cacheDir),'codes') : undefined,
    bundledDir:path.join(__dirname,'..','data','codes'),
    github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'codes/games'},
    syncFiles:[FILE],
    githubToken,fetchImpl
  });
  async function raw() { return validate(await storage.get(FILE)); }
  async function list({status,category,claimType,hasCode,limit}={}) {
    if (status !== undefined && !Object.hasOwn(GROUPS,status)) throw new RangeError('status must be active, expired, or unknown');
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) throw new RangeError('limit must be a positive integer');
    const doc=await raw();
    const keys=status ? [GROUPS[status]] : Object.values(GROUPS);
    let entries=keys.flatMap(key=>doc[key]);
    if (category !== undefined) entries=entries.filter(item=>normalise(item.category)===normalise(category));
    if (claimType !== undefined) entries=entries.filter(item=>normalise(item.claimType)===normalise(claimType));
    if (hasCode !== undefined) {
      if (typeof hasCode !== 'boolean') throw new TypeError('hasCode must be boolean');
      entries=entries.filter(item=>Boolean(typeof item.code==='string'&&item.code.trim())===hasCode);
    }
    return limit ? entries.slice(0,limit) : entries;
  }
  async function search(query,options={}) {
    if(typeof query!=='string'||!query.trim()) throw new TypeError('Search query is required');
    const needle=normalise(query);
    const entries=await list(options);
    const results=entries.filter(record=>{
      const fields=[record.code,record.id,record.category,record.claimType,record.notes,record.redeemLocation,
        ...(Array.isArray(record.items)?record.items.map(item=>item?.name):[])];
      return fields.some(value=>normalise(value).includes(needle));
    });
    return {query,total:results.length,results,message:results.length?
      'Found '+results.length+' Warframe code-related entries for "'+query+'".':
      'We don\'t have anything related to "'+query+'" in Warframe codes.'};
  }
  async function get(key) {
    if((typeof key!=='string' && typeof key!=='number') || !String(key).trim()) throw new TypeError('Code or ID is required');
    const needle=normalise(key);
    const results=(await list()).filter(item=>normalise(item.id)===needle || (item.code && normalise(item.code)===needle));
    if(results.length===0) {
      const err=new Error('No Warframe code entry found: '+key); err.code='NOT_FOUND';throw err;
    }
    if(results.length>1) {
      const err=new Error('Multiple Warframe code entries match: '+key);err.code='AMBIGUOUS';err.results=results;throw err;
    }
    return results[0];
  }
  async function summary() {
    const doc=await raw(); const groups={};let total=0;let redeemable=0;
    for(const [status,key] of Object.entries(GROUPS)) {
      const entries=doc[key];
      const withCode=entries.filter(item=>typeof item.code==='string' && item.code.trim()).length;
      groups[status]={total:entries.length,withCode,withoutCode:entries.length-withCode};
      total+=entries.length;redeemable+=withCode;
    }
    return {total,withCode:redeemable,withoutCode:total-redeemable,groups};
  }
  return Object.freeze({
    raw,list,active:options=>list({...options,status:'active'}),
    expired:options=>list({...options,status:'expired'}),
    unknown:options=>list({...options,status:'unknown'}),
    search,get,summary,sync:options=>storage.sync(options),
    cacheDir:storage.cacheDir
  });
}
module.exports={createWarframeCodes};
