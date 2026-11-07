'use strict';
const BASE='https://enka.network/api/hsr/uid/';
class EnkaError extends Error {
 constructor(message,{code='ENKA_ERROR',status=null,uid=null,retryAfter=null,cause}={}){
   super(message,{cause});this.name='EnkaError';Object.assign(this,{code,status,uid,retryAfter});
 }
}
function validUid(input){
 const uid=String(input??'').trim();
 if(!/^[1-9][0-9]{8}$/.test(uid))throw new TypeError('HSR UID must be a nine-digit number');
 return uid;
}
function createEnka({fetchImpl=globalThis.fetch,timeoutMs=12000,userAgent='NekoSuneProjects-honkaistarrail-api/1.0 (https://github.com/NekoSuneProjectsNPM/game-tracker)',clock=()=>Date.now()}={}){
 if(typeof fetchImpl!=='function')throw new TypeError('fetch required');
 if(typeof clock!=='function')throw new TypeError('clock must be a function');
 if(typeof userAgent!=='string'||!userAgent.trim())throw new TypeError('userAgent required');
 if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new RangeError('timeoutMs must be 100–60000');
 const cache=new Map(),inflight=new Map();
 function clearCache(uid){if(uid===undefined){cache.clear();return;}cache.delete(validUid(uid));}
 async function player(input,{refresh=false,signal}={}){
   const uid=validUid(input);
   if(typeof refresh!=='boolean')throw new TypeError('refresh must be boolean');
   if(signal?.aborted)throw new EnkaError('Aborted',{code:'ABORTED',uid});
   const cached=cache.get(uid);
   if(!refresh&&cached&&cached.expires>clock())return cached.value;
   if(!refresh&&inflight.has(uid))return inflight.get(uid);
   const ctrl=new AbortController();
   const abort=()=>ctrl.abort();
   if(signal)signal.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(abort,timeoutMs);
   const job=(async()=>{
     try{
       let res;
       try{res=await fetchImpl(BASE+uid,{method:'GET',headers:{Accept:'application/json','User-Agent':userAgent},signal:ctrl.signal});}
       catch(cause){throw new EnkaError('Enka fetch failed',{code:ctrl.signal.aborted?'ABORTED':'NETWORK_ERROR',uid,cause});}
       if(!res||typeof res.ok!=='boolean'||!Number.isInteger(res.status))throw new EnkaError('Invalid HTTP response',{code:'INVALID_RESPONSE',uid});
       if(!res.ok){
         const codes={400:'INVALID_UID',404:'PLAYER_NOT_FOUND',424:'GAME_MAINTENANCE',429:'RATE_LIMITED',500:'SERVER_ERROR',503:'SERVICE_UNAVAILABLE'};
         const retry=res.headers?.get?.('retry-after');
         throw new EnkaError('Enka HTTP '+res.status,{code:codes[res.status]||'HTTP_ERROR',status:res.status,uid,retryAfter:retry&&/^\d+$/.test(retry)?Number(retry):null});
       }
       let json;
       try{json=await res.json();}catch(cause){throw new EnkaError('Invalid Enka JSON',{code:'INVALID_JSON',status:res.status,uid,cause});}
       if(!json||typeof json!=='object'||Array.isArray(json)||!json.detailInfo||typeof json.detailInfo!=='object'||Array.isArray(json.detailInfo))throw new EnkaError('Missing HSR detailInfo',{code:'INVALID_RESPONSE',status:res.status,uid});
       const ttl=Number(json.ttl);
       if(Number.isFinite(ttl)&&ttl>0)cache.set(uid,{value:json,expires:clock()+Math.min(ttl,3600)*1000});
       else cache.delete(uid);
       return json;
     }finally{clearTimeout(timer);if(signal)signal.removeEventListener('abort',abort);}
   })();
   inflight.set(uid,job);
   try{return await job;}finally{if(inflight.get(uid)===job)inflight.delete(uid);}
 }
 async function avatars(uid,options={}){const result=await player(uid,options);return Array.isArray(result.detailInfo.avatarDetailList)?result.detailInfo.avatarDetailList:[];}
 async function info(uid,options={}){return (await player(uid,options)).detailInfo;}
 return Object.freeze({get:player,player,info,avatars,clearCache,endpoint:BASE});
}
module.exports={createEnka,EnkaError};
