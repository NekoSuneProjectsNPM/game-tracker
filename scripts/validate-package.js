'use strict';
const fs=require('node:fs');
const p=require('../package.json'),l=require('../package-lock.json');
if(p.name!=='@nekosuneprojects/vrchat-api'||!/^\d+\.\d+\.\d+$/.test(p.version))throw Error('Invalid package identity');
if(l.name!==p.name||l.version!==p.version||l.packages?.['']?.version!==p.version)throw Error('Lockfile mismatch');
for(const f of ['index.js','src/tracker.js','src/catalog.js','src/data-store.js','data/meta.json','README.md'])if(!fs.existsSync(f))throw Error('Missing '+f);
