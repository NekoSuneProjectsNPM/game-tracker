'use strict';

/**
 * REPLACE THESE VALUES IN EACH GAME BRANCH USING VERIFIED PROVIDER DOCUMENTATION.
 * No caller-supplied API URL. Do NOT invent URLs or endpoints.
 *
 * Examples of authentication:
 * auth: { type: 'none' }
 * auth: { type: 'bearer', required: true }
 * auth: { type: 'header', header: 'x-api-key', required: true }
 * auth: { type: 'query', parameter: 'api_key', required: true }
 */
module.exports = Object.freeze({
  baseUrl: null, // Replace with the real, verified provider API base URL.
  auth: Object.freeze({ type: 'none' }),
  routes: Object.freeze({
    // playerStats: playerId => ({ path: `players/${encodeURIComponent(playerId)}` })
  }),
});
