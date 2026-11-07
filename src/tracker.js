'use strict';
const provider = require('./provider');
const dataSource = require('./data-source');
const { createDataStore } = require('./data-store');
const { createCatalog } = require('./catalog');
const { createClient, TrackerError } = require('./client');

function createTracker({ apiKey, timeoutMs, fetchImpl, cacheDir } = {}) {
  const request = createClient(provider, { apiKey, timeoutMs, fetchImpl });
  const data = createDataStore({ ...dataSource, fetchImpl, cacheDir });
  const catalog = createCatalog(data);
  async function character(id, options = {}) {
    try { return await catalog.character(id); }
    catch (error) {
      if (error.code !== 'NOT_FOUND' || options.refresh === false) throw error;
      await data.sync({ signal: options.signal });
      return catalog.character(id);
    }
  }
  async function search(query, options = {}) {
    if (options.refresh === true) await data.sync({ signal: options.signal });
    return catalog.search(query, options);
  }
  return Object.freeze({
    data,
    search,
    About: () => data.get('meta.json'),
    character,
    item: catalog.item,
    code: catalog.code,
    map: catalog.map,
    record: catalog.get,
    async getPlayerStats(playerId, options) {
      if (typeof playerId !== 'string' || !playerId.trim()) throw new TypeError('playerId must be a non-empty string');
      if (typeof provider.routes.playerStats !== 'function') {
        throw new TrackerError('getPlayerStats is not implemented for this provider. Define it in src/provider.js.');
      }
      return request(provider.routes.playerStats(playerId), options);
    },
  });
}
module.exports = { createTracker, TrackerError };
