'use strict';

class TrackerError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'TrackerError';
    if (status !== undefined) this.status = status;
  }
}

function createClient(provider, { apiKey, timeoutMs = 10000, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required (Node.js 18+)');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('timeoutMs must be positive');
  const auth = provider.auth || { type: 'none' };
  if (auth.required && (typeof apiKey !== 'string' || !apiKey.trim())) {
    throw new TrackerError('This tracker requires an API key. Set apiKey using a server-side environment variable or config.');
  }

  return async function request(route, { signal } = {}) {
    if (!provider.baseUrl) throw new TrackerError('Provider API is not configured in src/provider.js. Implement the real game API before release.');
    const root = new URL(provider.baseUrl);
    if (!['https:', 'http:'].includes(root.protocol) || root.username || root.password || root.search || root.hash) {
      throw new TrackerError('Invalid built-in provider URL');
    }
    if (!route || typeof route.path !== 'string' || !route.path ||
        route.path.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(route.path)) {
      throw new TypeError('Provider route must be a relative API path');
    }
    const url = new URL(route.path.replace(/^\//, ''), root.href.replace(/\/?$/, '/'));
    if (url.origin !== root.origin) throw new TrackerError('Cross-origin provider route blocked');
    if (route.query) {
      for (const [key, value] of Object.entries(route.query)) {
        if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    const headers = { Accept: 'application/json' };
    if (auth.type === 'bearer' && apiKey) headers.Authorization = `Bearer ${apiKey}`;
    if (auth.type === 'header' && apiKey) headers[auth.header] = apiKey;
    if (auth.type === 'query' && apiKey) url.searchParams.set(auth.parameter, apiKey);
    if (!['none', 'bearer', 'header', 'query'].includes(auth.type)) throw new TrackerError('Unsupported provider auth configuration');
    if (route.body !== undefined) headers['Content-Type'] = 'application/json';

    const timeout = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([timeout, signal]) : timeout;
    try {
      const response = await fetchImpl(url, {
        method: route.method || 'GET', headers,
        ...(route.body === undefined ? {} : { body: JSON.stringify(route.body) }),
        signal: combined,
      });
      if (!response.ok) throw new TrackerError(`Provider API returned HTTP ${response.status}`, { status: response.status });
      if (response.status === 204) return null;
      return await response.json();
    } catch (cause) {
      if (cause instanceof TrackerError) throw cause;
      throw new TrackerError('Provider request failed', { cause });
    }
  };
}

module.exports = { createClient, TrackerError };
