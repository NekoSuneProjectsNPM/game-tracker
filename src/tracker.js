'use strict';

const provider = require('./provider');
const { createClient, TrackerError } = require('./client');

/**
 * Game-specific public API. No baseUrl or custom endpoint option.
 * Implement provider.routes.playerStats in each game branch and add
 * any further game-specific methods here.
 */
function createTracker({ apiKey, timeoutMs, fetchImpl } = {}) {
  const request = createClient(provider, { apiKey, timeoutMs, fetchImpl });
  return Object.freeze({
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
