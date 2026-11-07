'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const {createCatalog}=require('./catalog');
const {createCodes}=require('./codes');
const {createEnka}=require('./enka');
function createHonkaiStarRail({cacheDir,codesCacheDir,githubToken,fetchImpl,enkaOptions}={}){
 const data=createDataStore({gameId:'honkaistarrail',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/honkaistarrail'}});
 const catalog=createCatalog(data);
 const codes=createCodes({cacheDir:codesCacheDir,githubToken,fetchImpl});
 const enka=createEnka({fetchImpl,...enkaOptions});
 async function character(id,{refresh=false,signal}={}){
   try{return await catalog.get('characters',id);}
   catch(err){if(err.code!=='NOT_FOUND'||!refresh)throw err;await data.sync({signal});return catalog.get('characters',id);}
 }
 async function search(query,{refresh=false,signal,...opts}={}){if(refresh)await data.sync({signal});return catalog.search(query,opts);}
 const characters=Object.freeze({get:character,list:async()=>Promise.all((await data.list()).filter(f=>f.startsWith('characters/')&&f.endsWith('.json')).map(f=>data.get(f))),search:(q,opts={})=>search(q,{...opts,category:'characters'})});
 return Object.freeze({About:()=>data.get('meta.json'),character,characters,search,codes,data,enka,player:enka.player});
}
module.exports={createHonkaiStarRail};
