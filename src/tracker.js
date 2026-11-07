'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const {createCatalog}=require('./catalog');
const {createCodes}=require('./codes');
function createNTE({cacheDir,codesCacheDir,githubToken,fetchImpl}={}){
 const data=createDataStore({gameId:'nte',cacheDir,githubToken,fetchImpl,bundledDir:path.join(__dirname,'..','data'),github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/nte'}});
 const catalog=createCatalog(data),codes=createCodes({cacheDir:codesCacheDir,githubToken,fetchImpl});
 async function character(id,{refresh=false,signal}={}){try{return await catalog.get('characters',id);}catch(e){if(e.code!=='NOT_FOUND'||!refresh)throw e;await data.sync({signal});return catalog.get('characters',id);}}
 async function search(query,{refresh=false,signal,...options}={}){if(refresh)await data.sync({signal});return catalog.search(query,options);}
 const characters=Object.freeze({get:character,list:async()=>Promise.all((await data.list()).filter(f=>f.startsWith('characters/')&&f.endsWith('.json')).map(f=>data.get(f))),search:(q,options={})=>search(q,{...options,category:'characters'})});
 return Object.freeze({About:()=>data.get('meta.json'),character,characters,search,codes,data});
}
module.exports={createNTE};
