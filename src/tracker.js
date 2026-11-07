'use strict';

/** HTTP transport only. Add game-specific methods in your own branch. */
class TrackerError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'TrackerError';
    if (status !== undefined) this.status = status;
  }
}

function createTracker({ baseUrl, apiKey, headers = {}, timeoutMs = 10000, fetchImpl = globalThis.fetch } = {}) {
  if (!baseUrl || !/^https?:\/\//i.test(baseUrl)) throw new TypeError('baseUrl must be a valid HTTP(S) URL');
  if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new TypeError('timeoutMs must be positive');
  const root = new URL(baseUrl);
  if (root.username || root.password) throw new TypeError('Do not include credentials in baseUrl');
  return {
    async request(path, { method = 'GET', query, body, signal } = {}) {
      if (typeof path !== 'string' || !path || path.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(path)) {
        throw new TypeError('path must be a relative API path');
      }
      const url = new URL(path.replace(/^\//, ''), root.href.replace(/\/?$/, '/'));
      if (url.origin !== root.origin) throw new TrackerError('Cross-origin requests are blocked');
      if (query) for (const [key, val] of Object.entries(query)) if (val !== undefined && val !== null) url.searchParams.set(key, String(val));
      const requestHeaders = { Accept: 'application/json', ...headers };
      if (apiKey) requestHeaders.Authorization = `Bearer ${apiKey}`;
      if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
      try {
        const response = await fetchImpl(url, {
          method, headers: requestHeaders,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.any ? AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(signal ? [signal] : [])]) : signal,
        });
        if (!response.ok) throw new TrackerError(`API returned HTTP ${response.status}`, { status: response.status });
        if (response.status === 204) return null;
        return await response.json();
      } catch (cause) {
        if (cause instanceof TrackerError) throw cause;
        throw new TrackerError('Tracker request failed', { cause });
      }
    },
  };
}
module.exports = { createTracker, TrackerError };
