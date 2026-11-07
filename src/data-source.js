'use strict';
const path = require('node:path');

// On each game package branch, change gameId to the game slug.
// All JSON comes from JsonData in THIS repository, never gaming-infos.
// "template" has no production JSON. Example gameId: "warframe".
const gameId = 'template';
module.exports = Object.freeze({
  gameId,
  bundledDir: path.join(__dirname, '..', 'data'),
  github: {
    owner: 'NekoSuneProjectsNPM',
    repo: 'game-tracker',
    branch: 'JsonData',
    directory: 'games/' + gameId
  },
});
