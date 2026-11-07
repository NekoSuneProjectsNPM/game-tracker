'use strict';
const fs=require('node:fs');
const p=require('../package.json'),lock=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/honkaistarrail-api'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('Invalid package');
if(lock.version!==p.version||lock.packages?.['']?.version!==p.version)throw Error('Lock mismatch');
for(const file of ['index.js','src/tracker.js','src/enka.js','src/codes.js','src/data-store.js','src/catalog.js','data/meta.json','data/characters/acheron.json','data/codes/honkai-star-rail.json'])if(!fs.existsSync(file))throw Error('Missing '+file);
