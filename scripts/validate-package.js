'use strict';
const fs=require('node:fs'),pkg=require('../package.json'),lock=require('../package-lock.json');
if(pkg.name!=='@nekosuneprojects/wutheringwaves-api'||!/^\d+\.\d+\.\d+$/.test(pkg.version)||lock.version!==pkg.version||lock.packages?.['']?.version!==pkg.version)throw Error('Package version mismatch');
for(const filename of ['index.js','src/tracker.js','src/codes.js','src/catalog.js','src/data-store.js','data/meta.json','data/characters/hsin.json','data/codes/wuthering-waves.json'])if(!fs.existsSync(filename))throw Error('Missing '+filename);
