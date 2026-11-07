'use strict';

const ENDPOINT='https://vrcavatarsearch.nekosunevr.co.uk/api/v1/groups/search';
const USER_AGENT='NekoSuneVRChatAPI/1.0 (+https://github.com/NekoSuneProjectsNPM/game-tracker)';
class GroupSearchError extends Error{
  constructor(message,{code='GROUP_SEARCH_ERROR',status=null,url=null,cause}={}){
    super(message,{cause});this.name='GroupSearchError';this.code=code;this.status=status;this.url=url;
  }
}
function createGroupSearch({fetchImpl=globalThis.fetch,timeoutMs=12000,userAgent=USER_AGENT}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch is required');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new RangeError('timeoutMs must be an integer from 100 to 60000');
  if(typeof userAgent!=='string'||!userAgent.trim())throw new TypeError('userAgent must be a nonempty string');
  async function search(query,{page=1,signal}={}){
    if(typeof query!=='string'||!query.trim())throw new TypeError('Nonempty group search query required');
    if(query.length>200)throw new RangeError('Group search query cannot exceed 200 characters');
    if(!Number.isSafeInteger(page)||page<1||page>10000)throw new RangeError('page must be an integer between 1 and 10000');
    const url=new URL(ENDPOINT);
    url.searchParams.set('search',query.trim());
    url.searchParams.set('page',String(page));
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    const onAbort=()=>controller.abort();
    if(signal){if(signal.aborted)controller.abort();else signal.addEventListener('abort',onAbort,{once:true});}
    try{
      let response;
      try{
        response=await fetchImpl(url.toString(),{method:'GET',headers:{Accept:'application/json','User-Agent':userAgent},signal:controller.signal});
      }catch(error){
        throw new GroupSearchError(controller.signal.aborted?'Group search timed out or was cancelled':'Group search network failure',{code:controller.signal.aborted?'ABORTED':'NETWORK_ERROR',url:url.toString(),cause:error});
      }
      if(!response.ok)throw new GroupSearchError('Group search HTTP '+response.status,{code:'HTTP_ERROR',status:response.status,url:url.toString()});
      let result;
      try{result=await response.json();}
      catch(error){throw new GroupSearchError('Group search response was not valid JSON',{code:'INVALID_JSON',status:response.status,url:url.toString(),cause:error});}
      if(!result||!Array.isArray(result.data)||!result.meta||typeof result.meta!=='object'||!Number.isInteger(result.meta.page)||!Number.isInteger(result.meta.totalPages)||!Number.isInteger(result.meta.count)){
        throw new GroupSearchError('Group search JSON does not match {data,meta} format',{code:'INVALID_RESPONSE',status:response.status,url:url.toString()});
      }
      // Preserve the API response exactly; do not rename IDs or drop fields.
      return result;
    }finally{clearTimeout(timer);if(signal)signal.removeEventListener('abort',onAbort);}
  }
  return Object.freeze({search,endpoint:ENDPOINT});
}
module.exports={createGroupSearch,GroupSearchError,ENDPOINT};
