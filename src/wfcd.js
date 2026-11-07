'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

// Verified WFCD GitHub repositories. All URLs are internal, never caller-provided.
const SOURCES = Object.freeze({
  drops:{repo:'warframe-drop-data',branch:'main',prefix:'data/',files:['all.json','info.json','missionRewards.json','relics.json','modLocations.json','blueprintLocations.json','cetusBountyRewards.json','solarisBountyRewards.json','sortieRewards.json','transientRewards.json','deimosRewards.json','entratiLabRewards.json','hexRewards.json','zarimanRewards.json','syndicates.json']},
  items:{repo:'warframe-items',branch:'master',prefix:'data/json/',files:['Arcanes.json','Arch-Gun.json','Arch-Melee.json','Archwing.json','Components.json','Enemy.json','Fish.json','Gear.json','Glyphs.json','Honoria.json','Melee.json','Misc.json','Mods.json','Node.json','Pets.json','Primary.json','Quests.json','Railjack.json','Relics.json','Resources.json','Secondary.json','SentinelWeapons.json','Sentinels.json','Sigils.json','Skins.json','Warframes.json']},
  relics:{repo:'warframe-relic-data',branch:'development',prefix:'data/',files:['Relics.json','Relics.min.json','hash.json','version.json']},
  patchlogs:{repo:'warframe-patchlogs',branch:'master',prefix:'data/',files:['patchlogs.json']}
});
const FILE_LIMIT = 16 * 1024 * 1024;
function createWFCD({cacheDir,githubToken,fetchImpl=globalThis.fetch}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch is required');
  const root=path.resolve(cacheDir || path.join(os.homedir(),'.cache','nekosune-game-tracker','warframe'),'wfcd');
  const headers={Accept:'application/vnd.github+json','User-Agent':'nekosuneprojects-warframe-api',...(githubToken?{Authorization:'Bearer '+githubToken}:{})};
  const sha=buffer=>crypto.createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
  async function get(source,name,{refresh=false,signal}={}){
    const definition=SOURCES[source];
    if(!definition)throw new RangeError('Unknown WFCD data source');
    if(typeof name!=='string'||!definition.files.includes(name))throw new RangeError('Unsupported '+source+' JSON file');
    const dest=path.join(root,source,name);
    const manifest=dest+'.sha';
    let local;
    try{local=await fs.readFile(dest);JSON.parse(local.toString('utf8'))}
    catch(error){if(error.code!=='ENOENT' && !(error instanceof SyntaxError))throw error;local=null}
    if(local && !refresh)return JSON.parse(local.toString('utf8'));
    const remotePath=definition.prefix+name;
    const contentsUrl='https://api.github.com/repos/WFCD/'+definition.repo+'/contents/'+remotePath+'?ref='+definition.branch;
    try {
      const metadataResponse=await fetchImpl(contentsUrl,{headers,signal});
      if(!metadataResponse.ok)throw new Error('WFCD metadata HTTP '+metadataResponse.status);
      const metadata=await metadataResponse.json();
      if(!/^[a-f0-9]{40}$/.test(metadata.sha||'') || metadata.type!=='file' ||
         !Number.isSafeInteger(metadata.size) || metadata.size>FILE_LIMIT)throw new Error('Invalid WFCD source metadata');
      if(local && sha(local)===metadata.sha)return JSON.parse(local.toString('utf8'));
      const blobURL='https://api.github.com/repos/WFCD/'+definition.repo+'/git/blobs/'+metadata.sha;
      const response=await fetchImpl(blobURL,{headers,signal});
      if(!response.ok)throw new Error('WFCD blob HTTP '+response.status);
      const blob=await response.json();
      if(blob.encoding!=='base64'||typeof blob.content!=='string')throw new Error('Unexpected WFCD blob encoding');
      const body=Buffer.from(blob.content.replace(/\s/g,''),'base64');
      if(body.length>FILE_LIMIT||sha(body)!==metadata.sha)throw new Error('WFCD checksum/size mismatch');
      const value=JSON.parse(body.toString('utf8'));
      await fs.mkdir(path.dirname(dest),{recursive:true});
      const tmp=dest+'.'+process.pid+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';
      try{await fs.writeFile(tmp,body);await fs.rename(tmp,dest);await fs.writeFile(manifest,metadata.sha)}
      finally{await fs.rm(tmp,{force:true})}
      return value;
    } catch(error) {
      if(local && !refresh)return JSON.parse(local.toString('utf8'));
      throw error;
    }
  }
  const groups=Object.fromEntries(Object.keys(SOURCES).map(source=>[source,Object.freeze({
    files:Object.freeze([...SOURCES[source].files]),
    get:(name,options)=>get(source,name,options),
    refresh:(name,options)=>get(source,name,{...options,refresh:true}),
    ...(source==='drops'?{all:opts=>get(source,'all.json',opts),info:opts=>get(source,'info.json',opts),
      missionRewards:opts=>get(source,'missionRewards.json',opts)}:{}),
    ...(source==='items'?{warframes:opts=>get(source,'Warframes.json',opts),
      weapons:opts=>Promise.all(['Primary.json','Secondary.json','Melee.json'].map(name=>get(source,name,opts))).then(parts=>parts.flat()),
      mods:opts=>get(source,'Mods.json',opts),arcanes:opts=>get(source,'Arcanes.json',opts)}:{}),
    ...(source==='relics'?{all:opts=>get(source,'Relics.json',opts)}:{}),
    ...(source==='patchlogs'?{all:opts=>get(source,'patchlogs.json',opts)}:{})
  })]));
  return Object.freeze({...groups,cacheDir:root});
}

async function createMarketQuery(options={}) {
  let pkg;
  try {pkg=await import('warframe-nexus-query');}
  catch(error) {
    if(error.code==='ERR_MODULE_NOT_FOUND')throw new Error('Install optional market integration: npm install warframe-nexus-query',{cause:error});
    throw error;
  }
  const Constructor=pkg.default||pkg.PriceCheckQuerier;
  if(typeof Constructor!=='function')throw new Error('Unsupported warframe-nexus-query export');
  return new Constructor(options);
}
function createUpdateMonitor(options={}){
  let Package;
  try{Package=require('warframe-updates')}
  catch(error){
    if(error.code==='MODULE_NOT_FOUND')throw new Error('Install optional patch monitor: npm install warframe-updates',{cause:error});
    throw error;
  }
  if(typeof Package!=='function')throw new Error('Unsupported warframe-updates export');
  return new Package(options);
}
module.exports={createWFCD,createMarketQuery,createUpdateMonitor,SOURCES};
