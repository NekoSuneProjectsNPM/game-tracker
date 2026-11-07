'use strict';

const BASE_URL = 'https://enka.network/api/zzz/uid/';
const DEFAULT_AGENT = 'NekoSuneProjects-zenlesszonezero-api/1.0 (https://github.com/NekoSuneProjectsNPM/game-tracker)';
const ERROR_CODES = Object.freeze({
  400: 'INVALID_UID',
  404: 'PLAYER_NOT_FOUND',
  424: 'GAME_MAINTENANCE',
  429: 'RATE_LIMITED',
  500: 'SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE'
});

class EnkaError extends Error {
  constructor(message, {code = 'ENKA_ERROR', status = null, uid = null, retryAfter = null, cause} = {}) {
    super(message, {cause});
    this.name = 'EnkaError';
    Object.assign(this, {code, status, uid, retryAfter});
  }
}

function normalizeUID(value) {
  const uid = String(value ?? '').trim();
  // ZZZ UIDs may be 9 or 10 digits, unlike fixed-length Genshin UIDs.
  if (!/^[1-9][0-9]{8,9}$/.test(uid)) throw new TypeError('ZZZ UID must contain 9 or 10 decimal digits');
  return uid;
}

function createEnka({fetchImpl = globalThis.fetch, userAgent = DEFAULT_AGENT, timeoutMs = 12000, clock = () => Date.now()} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  if (typeof clock !== 'function') throw new TypeError('clock must be a function');
  if (typeof userAgent !== 'string' || !userAgent.trim()) throw new TypeError('userAgent must be nonempty');
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000) throw new RangeError('timeoutMs must be between 100 and 60000');
  const cached = new Map();
  const inflight = new Map();

  function clearCache(value) {
    if (value === undefined) { cached.clear(); return; }
    cached.delete(normalizeUID(value));
  }

  async function player(value, {refresh = false, signal} = {}) {
    const uid = normalizeUID(value);
    if (typeof refresh !== 'boolean') throw new TypeError('refresh must be a boolean');
    if (signal?.aborted) throw new EnkaError('Enka request cancelled', {code:'ABORTED',uid});

    const hit = cached.get(uid);
    if (!refresh && hit && hit.expiresAt > clock()) return hit.response;
    if (!refresh && inflight.has(uid)) return inflight.get(uid);

    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal) signal.addEventListener('abort',abort,{once:true});
    const timeout = setTimeout(abort, timeoutMs);
    const job = (async () => {
      try {
        let response;
        try {
          response = await fetchImpl(BASE_URL + uid, {
            method: 'GET',
            headers: {'Accept':'application/json', 'User-Agent':userAgent},
            signal:controller.signal
          });
        } catch (cause) {
          throw new EnkaError('Enka request failed', {uid,code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',cause});
        }
        if (!response || typeof response.ok !== 'boolean' || !Number.isInteger(response.status))
          throw new EnkaError('Invalid Enka HTTP response',{uid,code:'INVALID_RESPONSE'});
        if (!response.ok) {
          const raw = response.headers?.get?.('retry-after');
          const retryAfter = raw && /^[0-9]+$/.test(raw) ? Number(raw) : null;
          throw new EnkaError('Enka HTTP ' + response.status,{
            uid,status:response.status,retryAfter,code:ERROR_CODES[response.status] || 'HTTP_ERROR'
          });
        }
        let payload;
        try { payload = await response.json(); }
        catch (cause) { throw new EnkaError('Enka returned invalid JSON',{uid,status:response.status,code:'INVALID_JSON',cause}); }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
            !payload.PlayerInfo || typeof payload.PlayerInfo !== 'object' || Array.isArray(payload.PlayerInfo))
          throw new EnkaError('Missing ZZZ PlayerInfo',{uid,status:response.status,code:'INVALID_RESPONSE'});

        const ttl = Number(payload.ttl);
        if (Number.isFinite(ttl) && ttl > 0) {
          cached.set(uid,{response:payload,expiresAt:clock() + Math.min(ttl,3600)*1000});
        } else {
          cached.delete(uid);
        }
        return payload; // Preserve original Enka capitalisation, ID and numeric property values.
      } finally {
        clearTimeout(timeout);
        if (signal) signal.removeEventListener('abort',abort);
      }
    })();
    inflight.set(uid,job);
    try { return await job; }
    finally { if (inflight.get(uid) === job) inflight.delete(uid); }
  }

  async function info(uid,options={}) {
    const data = await player(uid,options);
    return data.PlayerInfo?.SocialDetail?.ProfileDetail ?? null;
  }
  async function social(uid,options={}) {
    const data = await player(uid,options);
    return data.PlayerInfo?.SocialDetail ?? null;
  }
  async function agents(uid,options={}) {
    const data = await player(uid,options);
    const avatars = data.PlayerInfo?.ShowcaseDetail?.AvatarList;
    return Array.isArray(avatars) ? avatars : [];
  }
  return Object.freeze({
    get:player,player,info,social,agents,avatars:agents,clearCache,
    endpoint:BASE_URL
  });
}

module.exports = {createEnka,EnkaError,normalizeUID};
