'use strict';
const provider=require('./provider');
const {createWarframeClient,parameter,optionsQuery}=require('./warframe-client');
const {createDataStore}=require('./data-store');
const {createCatalog}=require('./catalog');
const {TrackerError}=require('./client-error');

const itemTypes=new Set(['warframes','weapons','items','mods']);
const id=v=>parameter(v,'identifier');
function platformOf(value) {
  const p=value||'pc';
  if(!provider.platforms.includes(p))throw new RangeError('Unsupported platform '+p);
  return p;
}
function createWarframeTracker({platform='pc',language='en',timeoutMs=15000,cacheDir,githubToken,fetchImpl}={}) {
  const selected=platformOf(platform);
  const {request}=createWarframeClient({language,timeoutMs,fetchImpl});
  const data=createDataStore({
    gameId:'warframe', github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/warframe'},
    bundledDir:require('node:path').join(__dirname,'..','data'),
    cacheDir, githubToken, fetchImpl
  });
  const catalog=createCatalog(data);
  const worldstate=(field,options={})=>{
    if(typeof field!=='string' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)) throw new TypeError('Invalid worldstate field');
    return request(selected+'/'+field,optionsQuery(options,['filter']));
  };
  const listing=(kind,options={})=>{
    if(!itemTypes.has(kind))throw new RangeError('Unknown item type');
    return request(kind,optionsQuery(options,['language','filter','only','remove']));
  };
  const single=(kind,name,options={})=>{
    if(!itemTypes.has(kind))throw new RangeError('Unknown item type');
    return request(kind+'/'+id(name),optionsQuery(options,['language','filter','only','remove','by']));
  };
  const find=(kind,query,options={})=>{
    if(!itemTypes.has(kind))throw new RangeError('Unknown item type');
    return request(kind+'/search/'+id(query),optionsQuery(options,['language','filter','only','remove','by']));
  };
  const api=Object.freeze({
    health:()=>request('health'),
    worldstate:()=>request(selected),
    worldstateField:(field,options)=>worldstate(field,options),
    profile:(playerId,options)=>request('profile/'+id(playerId),optionsQuery(options,['language','withItem'])),
    profileStats:playerId=>request('profile/'+id(playerId)+'/stats'),
    profileXP:(playerId,options)=>request('profile/'+id(playerId)+'/xpInfo',optionsQuery(options,['withItem'])),
    list:listing,
    get:single,
    search:find,
    warframes:options=>listing('warframes',options),
    weapons:options=>listing('weapons',options),
    items:options=>listing('items',options),
    mods:options=>listing('mods',options),
    warframe:(name,options)=>single('warframes',name,options),
    weapon:(name,options)=>single('weapons',name,options),
    item:(name,options)=>single('items',name,options),
    mod:(name,options)=>single('mods',name,options),
    searchWarframes:(q,options)=>find('warframes',q,options),
    searchWeapons:(q,options)=>find('weapons',q,options),
    searchItems:(q,options)=>find('items',q,options),
    searchMods:(q,options)=>find('mods',q,options),
    drops:()=>request('drops'),
    searchDrops:(query,options)=>request('drops/search/'+id(query),optionsQuery(options,['grouped_by'])),
    rivens:()=>request(selected+'/rivens'),
    searchRivens:query=>request(selected+'/rivens/search/'+id(query)),
    staticData:(key,options)=>request(id(key),optionsQuery(options,['language'])),
    searchStatic:(key,query,options)=>request(id(key)+'/search/'+id(query),optionsQuery(options,['language'])),
    synthTargets:options=>request('synthTargets',optionsQuery(options,['language'])),
    arcanes:options=>request('arcanes',optionsQuery(options,['language'])),
    rss:()=>request('rss'),
    twitter:()=>request('twitter'),
    wfinfoFilteredItems:()=>request('wfinfo/filtered_items'),
    wfinfoPrices:()=>request('wfinfo/prices')
  });
  const fields=Object.fromEntries(provider.worldstateFields.filter(k=>!Object.hasOwn(api,k)).map(k=>[k,options=>worldstate(k,options)]));
  const fullApi=Object.freeze({...api,...fields});
  return Object.freeze({
    api:fullApi,
    data,
    About:()=>data.get('meta.json'),
    search:catalog.search,
    character:catalog.character,
    record:catalog.get,
    item:catalog.item,
    map:catalog.map,
    // live player endpoints remain under api.* to distinguish local records
    getPlayerStats:fullApi.profileStats
  });
}
module.exports={createTracker:createWarframeTracker,TrackerError};
