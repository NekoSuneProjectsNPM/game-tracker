'use strict';

const ENDPOINT = 'https://vrcavatarsearch.nekosunevr.co.uk/api/v1/worlds/search';
const USER_AGENT = 'NekoSuneVRChatAPI/1.0 (+https://github.com/NekoSuneProjectsNPM/game-tracker)';

class WorldSearchError extends Error {
  constructor(message, {code='WORLD_SEARCH_ERROR',status=null,url=null,cause}={}) {
    super(message,{cause});
    this.name='WorldSearchError'; this.code=code; this.status=status; this.url=url;
  }
}

function createWorldSearch({fetchImpl=globalThis.fetch,timeoutMs=12000,userAgent=USER_AGENT}={}) {
  if(typeof fetchImpl!=='function') throw new TypeError('fetch is required');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000) throw new RangeError('timeoutMs must be 100 to 60000');
  if(typeof userAgent!=='string'||!userAgent.trim()) throw new TypeError('userAgent must be a nonempty string');

  async function search(query,{platform='pc',signal}={}) {
    if(typeof query!=='string'||!query.trim()) throw new TypeError('Nonempty world search query required');
    if(query.length>200) throw new RangeError('World search query cannot exceed 200 characters');
    if(typeof platform!=='string'||!/^[a-z][a-z0-9_-]{0,31}$/i.test(platform)) throw new TypeError('Invalid world platform');
    const url=new URL(ENDPOINT);
    url.searchParams.set('search',query.trim());
    url.searchParams.set('platform',platform.toLowerCase());
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const onAbort=()=>controller.abort();
    if(signal) {
      if(signal.aborted) controller.abort();
      else signal.addEventListener('abort',onAbort,{once:true});
    }
    try {
      let response;
      try {
        response=await fetchImpl(url.toString(), {
          method:'GET',headers:{Accept:'application/json','User-Agent':userAgent},
          signal:controller.signal
        });
      } catch(error) {
        throw new WorldSearchError(controller.signal.aborted?'World search timed out or was cancelled':'World search network failure',{
          code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',url:url.toString(),cause:error
        });
      }
      if(!response.ok) throw new WorldSearchError('World search HTTP '+response.status,{
        code:'HTTP_ERROR',status:response.status,url:url.toString()
      });
      let body;
      try { body=await response.json(); }
      catch(error) {
        throw new WorldSearchError('World search response was not valid JSON',{
          code:'INVALID_JSON',status:response.status,url:url.toString(),cause:error
        });
      }
      if(!body||!Array.isArray(body.data)||!body.meta||typeof body.meta!=='object'||
         !Number.isInteger(body.meta.count)||body.meta.count<0||
         (body.meta.page!==undefined&&(!Number.isInteger(body.meta.page)||body.meta.page<1))||
         (body.meta.totalPages!==undefined&&(!Number.isInteger(body.meta.totalPages)||body.meta.totalPages<0))) {
        throw new WorldSearchError('World search JSON does not match {data,meta} format',{
          code:'INVALID_RESPONSE',status:response.status,url:url.toString()
        });
      }
      return body; // Preserve all world fields, meta, and any new properties.
    } finally {
      clearTimeout(timer);
      if(signal) signal.removeEventListener('abort',onAbort);
    }
  }

  const SORT_OPTIONS=Object.freeze(['updated','newest','oldest','popular']);
  async function browse({sort='popular',page=1,signal}={}) {
    if(!SORT_OPTIONS.includes(sort)) throw new RangeError('sort must be one of: '+SORT_OPTIONS.join(', '));
    if(!Number.isSafeInteger(page)||page<1) throw new RangeError('page must be a positive integer');
    const url=new URL('https://vrcavatarsearch.nekosunevr.co.uk/api/v1/worlds/browse');
    url.searchParams.set('sort',sort);
    url.searchParams.set('page',String(page));
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const onAbort=()=>controller.abort();
    if(signal){
      if(signal.aborted)controller.abort();
      else signal.addEventListener('abort',onAbort,{once:true});
    }
    try{
      let response;
      try{
        response=await fetchImpl(url.toString(),{
          method:'GET',
          headers:{Accept:'application/json','User-Agent':userAgent},
          signal:controller.signal
        });
      }catch(error){
        throw new WorldSearchError(controller.signal.aborted?'World browsing timed out or was cancelled':'World browsing network failure',{
          code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',url:url.toString(),cause:error
        });
      }
      if(!response.ok)throw new WorldSearchError('World browsing HTTP '+response.status,{
        code:'HTTP_ERROR',status:response.status,url:url.toString()
      });
      let body;
      try{body=await response.json();}
      catch(error){
        throw new WorldSearchError('World browse response was not valid JSON',{
          code:'INVALID_JSON',status:response.status,url:url.toString(),cause:error
        });
      }
      if(!body||!Array.isArray(body.data)||!body.meta||typeof body.meta!=='object'||
        !Number.isInteger(body.meta.count)||body.meta.count<0||
        !Number.isInteger(body.meta.page)||body.meta.page<1||
        !Number.isInteger(body.meta.totalPages)||body.meta.totalPages<0||
        !Number.isInteger(body.meta.totalCount)||body.meta.totalCount<0){
        throw new WorldSearchError('World browse response does not match {data,meta:{count,page,totalPages,totalCount}}',{
          code:'INVALID_RESPONSE',status:response.status,url:url.toString()
        });
      }
      // Server owns sorting and page size (24). Return all original fields.
      return body;
    }finally{
      clearTimeout(timer);
      if(signal)signal.removeEventListener('abort',onAbort);
    }
  }
  return Object.freeze({search,browse,sortOptions:SORT_OPTIONS,endpoint:ENDPOINT,browseEndpoint:'https://vrcavatarsearch.nekosunevr.co.uk/api/v1/worlds/browse'});
}

module.exports={createWorldSearch,WorldSearchError,ENDPOINT};
