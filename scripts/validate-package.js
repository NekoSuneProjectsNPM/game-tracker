'use strict';
const fs=require('node:fs');
const p=require('../package.json'),lock=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/zenlesszonezero-api'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('Package name/version mismatch');
if(lock.name!==p.name||lock.version!==p.version||lock.packages?.['']?.version!==p.version)throw Error('Lockfile mismatch');
for(const f of ['index.js','src/tracker.js','src/codes.js','src/catalog.js','src/data-store.js','data/meta.json','data/characters/phoenixreffaella.json','data/codes/zenless-zone-zero.json'])if(!fs.existsSync(f))throw Error('Missing '+f);
