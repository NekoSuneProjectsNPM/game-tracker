'use strict';
const fs=require('node:fs');
const p=require('../package.json'),lock=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/arknightsendfield-api'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('Unexpected package identity');
if(lock.name!==p.name||lock.version!==p.version||lock.packages?.['']?.version!==p.version)throw Error('Version mismatch');
for(const f of ['index.js','src/tracker.js','src/codes.js','src/enka.js','src/catalog.js','src/data-store.js','data/meta.json','data/characters/akekuri.json','data/codes/arknights-endfield.json'])if(!fs.existsSync(f))throw Error('Missing '+f);
