'use strict';
const { TrackerError } = require('./client-error');
const provider = require('./provider');

function parameter(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(name + ' must be nonempty text');
  return encodeURIComponent(value.trim());
}
function optionsQuery(options, allowed) {
  if (options === undefined || options === null) return undefined;
  if (typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object');
  const params = {};
  for (const [key,value] of Object.entries(options)) {
    if (!allowed.includes(key)) throw new TypeError('Unsupported query option: ' + key);
    if (value !== undefined && value !== null) {
      if (!['string','number','boolean'].includes(typeof value)) throw new TypeError('Invalid query option: ' + key);
      params[key]=String(value);
    }
  }
  return params;
}
function createWarframeClient({ timeoutMs = 15000, fetchImpl = globalThis.fetch, language = 'en' } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Node.js 18+ fetch is required');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('timeoutMs must be a positive integer');
  if (typeof language !== 'string' || !/^[a-z]{2}$/.test(language)) throw new TypeError('language must be a 2-letter code');
  async function request(route, query, { signal } = {}) {
    if (typeof route !== 'string' || !/^[a-zA-Z0-9_/%.-]+$/.test(route) || route.startsWith('/'))
      throw new TypeError('Invalid internal API route');
    const url = new URL(route, provider.baseUrl);
    if (url.origin !== new URL(provider.baseUrl).origin) throw new TypeError('API origin mismatch');
    for (const [k,v] of Object.entries(query || {})) url.searchParams.set(k,String(v));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),timeoutMs);
    const onAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener('abort',onAbort,{once:true});
    }
    try {
      const response = await fetchImpl(url,{
        headers:{Accept:'application/json','Accept-Language':language,'User-Agent':'nekosuneprojects-warframe-api'},
        signal:controller.signal
      });
      if (!response.ok) throw new TrackerError('WarframeStat.us HTTP '+response.status,{status:response.status});
      if (response.status===204) return null;
      return await response.json();
    } catch (cause) {
      if (cause instanceof TrackerError) throw cause;
      throw new TrackerError('WarframeStat.us request failed',{cause});
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort',onAbort);
    }
  }
  return Object.freeze({request,parameter,optionsQuery});
}
module.exports={createWarframeClient,parameter,optionsQuery};
