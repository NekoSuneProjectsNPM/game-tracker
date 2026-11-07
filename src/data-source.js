'use strict';
const path=require('node:path');
module.exports=Object.freeze({
  gameId:'warframe',
  bundledDir:path.join(__dirname,'..','data'),
  github:{owner:'NekoSuneProjectsNPM',repo:'game-tracker',branch:'JsonData',directory:'games/warframe'}
});
