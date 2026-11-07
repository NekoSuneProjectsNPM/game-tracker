'use strict';
const fs=require('node:fs');
const p=require('../package.json');
const lock=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/genshinimpact-api'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('Invalid package identity');
if(lock.name!==p.name||lock.version!==p.version||lock.packages?.['']?.version!==p.version)throw Error('Lockfile mismatch');
for(const file of ['index.js','src/tracker.js','src/codes.js','src/data-store.js','src/catalog.js','data/meta.json','data/characters/amber.json','data/codes/genshin-impact.json','README.md'])if(!fs.existsSync(file))throw Error('Missing '+file);
