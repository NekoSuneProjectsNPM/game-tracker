'use strict';
const path = require('node:path');
// CUSTOMISE per game branch. Null means local-only until the game owner supplies a source.
// Example Warframe source (do not activate for unrelated tracker branches):
// github: { owner: 'NekoSuneProjectsNPM', repo: 'gaming-infos', branch: 'main', directory: 'data/warframe' }
module.exports = Object.freeze({
  gameId: 'template',
  bundledDir: path.join(__dirname, '..', 'data'),
  github: null,
});
