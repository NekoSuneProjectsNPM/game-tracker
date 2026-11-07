'use strict';
const BASE='https://enka.network/api/ef/uid/';
const USER_AGENT='NekoSuneProjects-arknightsendfield-api/1.0 (+https://github.com/NekoSuneProjectsNPM/game-tracker)';
class EnkaError extends Error {
  constructor(message,{code='ENKA_ERROR',status=null,uid=null,retryAfter=null,cause}={}){
    super(message,{cause});this.name='EnkaError';Object.assign(this,{code,status,uid,retryAfter});
  }
}
function normaliseUID(input){
  const uid=String(input??'').trim();
  if(!/^[1-9][0-9]{8,11}$/.test(uid))throw new TypeError('Endfield UID must be 9–12 decimal digits');
  return uid;
}
function createEnka({fetchImpl=globalThis.fetch,timeoutMs=12000,userAgent=USER_AGENT,clock=()=>Date.now()}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetchImpl must be a function');
  if(typeof clock!=='function')throw new TypeError('clock must be a function');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new RangeError('timeoutMs must be 100–60000');
  if(typeof userAgent!=='string'||!userAgent.trim())throw new TypeError('userAgent required');
  const cache=new Map(),inflight=new Map();
  function clearCache(uid){
    if(uid===undefined){cache.clear();return;}
    cache.delete(normaliseUID(uid));
  }
  async function player(value,{refresh=false,signal}={}){
    const uid=normaliseUID(value);
    if(typeof refresh!=='boolean')throw new TypeError('refresh must be boolean');
    if(signal?.aborted)throw new EnkaError('Request aborted',{code:'ABORTED',uid});
    const item=cache.get(uid);
    if(!refresh&&item&&item.expires>clock())return item.value;
    if(!refresh&&inflight.has(uid))return inflight.get(uid);
    const controller=new AbortController();
    const onAbort=()=>controller.abort();
    if(signal)signal.addEventListener('abort',onAbort,{once:true});
    const timer=setTimeout(onAbort,timeoutMs);
    const task=(async()=>{
      try{
        let response;
        try{
          response=await fetchImpl(BASE+uid,{
            method:'GET',headers:{Accept:'application/json','User-Agent':userAgent},signal:controller.signal
          });
        }catch(cause){
          throw new EnkaError('Enka request failed',{code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',uid,cause});
        }
        if(!response||typeof response.ok!=='boolean'||!Number.isInteger(response.status))
          throw new EnkaError('Invalid HTTP response',{code:'INVALID_RESPONSE',uid});
        if(!response.ok){
          const codes={400:'INVALID_UID',404:'PLAYER_NOT_FOUND',424:'GAME_MAINTENANCE',429:'RATE_LIMITED',500:'SERVER_ERROR',503:'SERVICE_UNAVAILABLE'};
          const value=response.headers?.get?.('retry-after');
          const retryAfter=value&&/^[0-9]+$/.test(value)?Number(value):null;
          throw new EnkaError('Enka HTTP '+response.status,{code:codes[response.status]||'HTTP_ERROR',status:response.status,retryAfter,uid});
        }
        let result;
        try{result=await response.json();}
        catch(cause){throw new EnkaError('Enka returned invalid JSON',{code:'INVALID_JSON',uid,status:response.status,cause});}
        if(!result||typeof result!=='object'||Array.isArray(result)||
          !result.playerInfo||typeof result.playerInfo!=='object'||Array.isArray(result.playerInfo))
          throw new EnkaError('Enka Endfield response lacks playerInfo',{code:'INVALID_RESPONSE',uid,status:response.status});
        const ttl=Number(result.ttl);
        if(Number.isFinite(ttl)&&ttl>0)cache.set(uid,{value:result,expires:clock()+Math.min(ttl,3600)*1000});
        else cache.delete(uid);
        return result;
      }finally{
        clearTimeout(timer);
        if(signal)signal.removeEventListener('abort',onAbort);
      }
    })();
    inflight.set(uid,task);
    try{return await task;}
    finally{if(inflight.get(uid)===task)inflight.delete(uid);}
  }
  async function businessCard(uid,options={}){return (await player(uid,options)).playerInfo.businessCard??null;}
  async function profile(uid,options={}){return (await player(uid,options)).playerInfo;}
  async function operators(uid,options={}){
    const info=(await player(uid,options)).playerInfo;
    const list=info.businessCard?.charList??info.charData;
    return Array.isArray(list)?list:[];
  }
  async function achievements(uid,options={}){return (await businessCard(uid,options))?.achievement??null;}
  async function domains(uid,options={}){
    const card=await businessCard(uid,options);
    const values=card?.domainDev?.domains;
    return Array.isArray(values)?values:[];
  }
  async function statistics(uid,options={}){return (await businessCard(uid,options))?.statistic??null;}
  return Object.freeze({player,get:player,profile,businessCard,operators,characters:operators,achievements,domains,statistics,clearCache,endpoint:BASE});
}
module.exports={createEnka,EnkaError,normaliseUID};
