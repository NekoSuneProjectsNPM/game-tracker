'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const {createCatalog}=require('./catalog');
const {createCodes}=require('./codes');
const {createEnka}=require('./enka');
function createZenlessZoneZero({cacheDir,codesCacheDir,githubToken,fetchImpl,enkaOptions}={}){
 const data=createDataStore({gameId:'zenlesszonezero',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/zenlesszonezero'}});
 const catalog=createCatalog(data);
 const codes=createCodes({cacheDir:codesCacheDir,githubToken,fetchImpl});
 const enka=createEnka({fetchImpl,...enkaOptions});
 async function character(id,{refresh=false,signal}={}){
  try{return await catalog.get('characters',id);}
  catch(err){if(err.code!=='NOT_FOUND'||!refresh)throw err;await data.sync({signal});return catalog.get('characters',id);}
 }
 async function search(query,{refresh=false,signal,...options}={}){if(refresh)await data.sync({signal});return catalog.search(query,options);}
 const characters=Object.freeze({get:character,list:async()=>Promise.all((await data.list()).filter(p=>p.startsWith('characters/')&&p.endsWith('.json')).map(p=>data.get(p))),search:(q,options={})=>search(q,{...options,category:'characters'})});
 return Object.freeze({About:()=>data.get('meta.json'),character,characters,search,codes,data,enka,player:enka.player});
}
module.exports={createZenlessZoneZero};
