'use strict';
const BASE = 'https://api.warframestat.us/';
const PLATFORMS = Object.freeze(['pc','ps4','psn','xb1','swi','ns']);
const WORLDSTATE_FIELDS = Object.freeze([
  'alerts','arbitration','archonHunt','cambionCycle','cetusCycle','conclaveChallenges',
  'constructionProgress','dailyDeals','darvo','earthCycle','events','fissures',
  'flashSales','globalUpgrades','invasions','kuva','news','nightwave','persistentEnemies',
  'sentientOutposts','simaris','sortie','steelPath','syndicateMissions','thermia',
  'vallisCycle','voidTrader','weeklyChallenges'
]);
const STATIC_KEYS = Object.freeze([
  'arcanes','synthTargets','solNodes','conclave','events','operationTypes',
  'persistentEnemy','sortie','upgradeTypes','fissureModifiers','archonShards',
  'factions','missionTypes','languages','locales','mods','weapons','warframes','items'
]);
module.exports = Object.freeze({
  baseUrl: BASE,
  auth: Object.freeze({type:'none'}),
  platforms: PLATFORMS,
  worldstateFields: WORLDSTATE_FIELDS,
  staticKeys: STATIC_KEYS
});
