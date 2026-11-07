'use strict';
const path=require('node:path');
const {createDataStore}=require('./data-store');
const {createCatalog}=require('./catalog');
const {createAvatarSearch}=require('./avatar-providers');
const {createGroupSearch}=require('./group-search');
const {createWorldSearch}=require('./world-search');
const categories=Object.freeze(['players','groups','worlds','avatars']);
function createTracker({cacheDir,githubToken,fetchImpl}={}){
  const data=createDataStore({gameId:'vrchat',github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/vrchat'},bundledDir:path.join(__dirname,'..','data'),cacheDir,githubToken,fetchImpl});
  const catalog=createCatalog(data);
  const avatarSearch=createAvatarSearch({fetchImpl});
  const onlineGroups=createGroupSearch({fetchImpl});
  const onlineWorlds=createWorldSearch({fetchImpl});
  async function record(category,id,options={}){
    if(!categories.includes(category))throw new RangeError('Unsupported VRChat category: '+category);
    try{return await catalog.get(category,id);}
    catch(e){if(e.code!=='NOT_FOUND'||options.refresh===false)throw e;await data.sync({signal:options.signal});return catalog.get(category,id);}
  }
  async function search(query,options={}){if(options.refresh===true)await data.sync({signal:options.signal});return catalog.search(query,options);}
  function namespace(category){return Object.freeze({
    list:async()=>Promise.all((await data.list()).filter(f=>f.startsWith(category+'/')&&f.endsWith('.json')).map(f=>data.get(f))),
    search:(query,options={})=>search(query,{...options,category}),
    get:(id,options={})=>record(category,id,options)
  });}
  const groupNamespace=Object.freeze({...namespace('groups'),searchOnline:onlineGroups.search});
  const worldNamespace=Object.freeze({...namespace('worlds'),searchOnline:onlineWorlds.search});
  const avatarNamespace=Object.freeze({...namespace('avatars'),searchOnline:avatarSearch.search,checkProviders:avatarSearch.check,providers:avatarSearch.sources});
  return Object.freeze({About:()=>data.get('meta.json'),search,record,data,avatarSearch:avatarSearch.search,
    players:namespace('players'),groups:groupNamespace,worlds:worldNamespace,avatars:avatarNamespace,
    player:(id,o)=>record('players',id,o),group:(id,o)=>record('groups',id,o),world:(id,o)=>record('worlds',id,o),avatar:(id,o)=>record('avatars',id,o)});
}
module.exports={createTracker,categories};
