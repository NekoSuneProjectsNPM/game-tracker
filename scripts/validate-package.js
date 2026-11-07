'use strict';
const fs=require('node:fs'),p=require('../package.json'),l=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/nte-api'||!/^\d+\.\d+\.\d+$/.test(p.version)||l.version!==p.version||l.packages?.['']?.version!==p.version)throw Error('Package version mismatch');
for(const file of ['index.js','src/tracker.js','src/codes.js','src/catalog.js','src/data-store.js','data/meta.json','data/characters/adler.json','data/codes/neverness-to-everness.json','data/codes/reported-codes.json'])if(!fs.existsSync(file))throw Error('Missing '+file);
