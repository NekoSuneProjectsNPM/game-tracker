'use strict';
const ROOT='https://enka.network';
const ROUTES={gi:'/api/gi/uid/',legacy:'/api/uid/'};
const USER_AGENT='NekoSuneProjects-genshinimpact-api/1.0 (https://github.com/NekoSuneProjectsNPM/game-tracker)';
class EnkaError extends Error {
  constructor(message,{code='ENKA_ERROR',status=null,uid=null,retryAfter=null,cause}={}){
    super(message,{cause});this.name='EnkaError';Object.assign(this,{code,status,uid,retryAfter});
  }
}
function uidValue(input){
  const uid=String(input??'').trim();
  if(!/^[1-9][0-9]{8}$/.test(uid))throw new TypeError('Genshin UID must contain 9 digits');
  return uid;
}
function createEnka({fetchImpl=globalThis.fetch,endpoint='gi',timeoutMs=12000,userAgent=USER_AGENT,clock=()=>Date.now()}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch is required');
  if(typeof clock!=='function')throw new TypeError('clock must be a function');
  if(!Object.hasOwn(ROUTES,endpoint))throw new RangeError('endpoint must be gi or legacy');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new RangeError('timeoutMs must be 100–60000');
  if(typeof userAgent!=='string'||!userAgent.trim())throw new TypeError('userAgent is required');
  const cache=new Map(),inflight=new Map();
  const key=(uid,infoOnly)=>uid+':'+(infoOnly?'info':'full');
  function clearCache(uid){
    if(uid===undefined){cache.clear();return;}
    uid=uidValue(uid);cache.delete(key(uid,true));cache.delete(key(uid,false));
  }
  async function request(input,{infoOnly=false,refresh=false,signal}={}){
    const uid=uidValue(input);
    if(typeof infoOnly!=='boolean'||typeof refresh!=='boolean')throw new TypeError('infoOnly and refresh must be booleans');
    if(signal?.aborted)throw new EnkaError('Enka lookup cancelled',{code:'ABORTED',uid});
    const k=key(uid,infoOnly);
    if(!refresh){
      const item=cache.get(k);
      if(item&&item.expires>clock())return item.value;
      if(inflight.has(k))return inflight.get(k);
    }
    const url=new URL(ROUTES[endpoint]+uid+'/',ROOT);
    if(infoOnly)url.search='?info';
    const controller=new AbortController();
    const abort=()=>controller.abort();
    if(signal)signal.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,timeoutMs);
    const pending=(async()=>{
      try{
        let response;
        try{
          response=await fetchImpl(url.toString(),{
            method:'GET',headers:{Accept:'application/json','User-Agent':userAgent},
            signal:controller.signal
          });
        }catch(cause){
          throw new EnkaError('Enka network request failed',{code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',uid,cause});
        }
        if(!response||typeof response.ok!=='boolean'||!Number.isInteger(response.status))
          throw new EnkaError('Invalid HTTP response',{code:'INVALID_RESPONSE',uid});
        if(!response.ok){
          const codes={400:'INVALID_UID',404:'PLAYER_NOT_FOUND',424:'GAME_MAINTENANCE',429:'RATE_LIMITED',500:'SERVER_ERROR',503:'SERVICE_UNAVAILABLE'};
          const raw=response.headers?.get?.('retry-after');
          throw new EnkaError('Enka HTTP '+response.status,{code:codes[response.status]||'HTTP_ERROR',status:response.status,uid,retryAfter:raw&&/^\d+$/.test(raw)?Number(raw):null});
        }
        let value;
        try{value=await response.json();}
        catch(cause){throw new EnkaError('Invalid Enka JSON',{code:'INVALID_JSON',status:response.status,uid,cause});}
        if(!value||typeof value!=='object'||Array.isArray(value)||!value.playerInfo||typeof value.playerInfo!=='object')
          throw new EnkaError('Missing Enka playerInfo',{code:'INVALID_RESPONSE',status:response.status,uid});
        const ttl=Number(value.ttl);
        if(Number.isFinite(ttl)&&ttl>0)cache.set(k,{value,expires:clock()+Math.min(ttl,3600)*1000});
        else cache.delete(k);
        return value;
      }finally{clearTimeout(timer);if(signal)signal.removeEventListener('abort',abort);}
    })();
    inflight.set(k,pending);
    try{return await pending;}finally{if(inflight.get(k)===pending)inflight.delete(k);}
  }
  const player=(uid,options={})=>request(uid,{...options,infoOnly:false});
  const info=(uid,options={})=>request(uid,{...options,infoOnly:true});
  const avatars=async(uid,options={})=>{
    const result=await player(uid,options);
    return Array.isArray(result.avatarInfoList)?result.avatarInfoList:[];
  };
  return Object.freeze({player,get:player,info,avatars,clearCache,endpoint:ROUTES[endpoint]});
}
module.exports={createEnka,EnkaError};
