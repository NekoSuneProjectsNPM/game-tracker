'use strict';
const SOURCES=Object.freeze([
  {id:'avtr-icu',name:'avtr.icu',url:'https://avtr.icu/search'},
  {id:'worldbalancer',name:'WorldBalancer VRCX',url:'https://avatarwbvrcxsearch.worldbalancer.com/vrcx_search'},
  {id:'fumikoecho',name:'Fumikoecho VRCX',url:'https://avtr.fumikoecho.net/api/integrations/avatars/vrcx'},
  {id:'vrcdb',name:'VRCDB VRCX',url:'https://vrcx.vrcdb.com/avatars/Avatar/VRCX'},
  {id:'paw',name:'Paw VRCX',url:'https://paw-api.amelia.fun/vrcx_search'},
  {id:'nekosune',name:'NekoSune VRCX',url:'https://vrcavatarsearch.nekosunevr.co.uk/vrcx_search'},
  {id:'avtr-zip',name:'avtr.zip VRCX',url:'https://vrcx.avtr.zip/'},
  {id:'avtrdb',name:'AVTRDB v3',url:'https://api.avtrdb.com/v3/avatar/search/vrcx'}
]);
const BROWSER_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
function sources(){return SOURCES.map(({id,name,url})=>({id,name,url}));}
function searchUrl(source,query){
  const url=new URL(source.url);url.searchParams.set('search',query);return url.toString();
}
function extractRecords(body){
  if(Array.isArray(body))return body;
  if(!body||typeof body!=='object')return null;
  for(const value of [body.avatars,body.results,body.items,body.data,body.payload,body.result]){
    if(Array.isArray(value))return value;
    if(value&&typeof value==='object'){
      for(const list of [value.avatars,value.results,value.items,value.data])if(Array.isArray(list))return list;
    }
  }
  return null;
}
function previewText(body){
  return String(body).replace(/\s+/g,' ').slice(0,160);
}
function createAvatarSearch({fetchImpl=globalThis.fetch,timeoutMs=12000,userAgent=BROWSER_UA}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('fetch is required');
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000)throw new RangeError('timeoutMs must be 100-60000');
  function select(ids){
    if(ids===undefined)return SOURCES;
    if(!Array.isArray(ids)||!ids.length)throw new TypeError('providers must be a nonempty array');
    return ids.map(id=>{
      const source=SOURCES.find(s=>s.id===id);
      if(!source)throw new RangeError('Unknown avatar search provider: '+id);
      return source;
    });
  }
  async function probe(source,query,{signal,includeRaw=false}={}){
    const url=searchUrl(source,query);
    const started=Date.now();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    let abortListener;
    if(signal){
      abortListener=()=>controller.abort();
      if(signal.aborted)controller.abort();
      else signal.addEventListener('abort',abortListener,{once:true});
    }
    try{
      const response=await fetchImpl(url,{method:'GET',headers:{'User-Agent':userAgent,'Accept':'application/json, text/plain, */*'},signal:controller.signal,redirect:'follow'});
      const status=response.status;
      const contentType=response.headers?.get?.('content-type')||'';
      const base={provider:source.id,name:source.name,url,status,ok:response.ok,latencyMs:Date.now()-started};
      if(!response.ok)return {...base,state:'http_error',message:'HTTP '+status,avatars:[]};
      const text=await response.text();
      if(text.length>5*1024*1024)return {...base,ok:false,state:'invalid_response',message:'Response exceeds 5 MiB',avatars:[]};
      let body;
      try{body=JSON.parse(text);}
      catch{return {...base,ok:false,state:'unsupported_response',message:'Non-JSON response ('+(contentType||'unknown content type')+'): '+previewText(text),avatars:[]};}
      const avatars=extractRecords(body);
      if(!avatars)return {...base,ok:false,state:'unsupported_schema',message:'JSON returned, but avatar list schema is unrecognised',avatars:[],...(includeRaw?{raw:body}:{})};
      return {...base,state:'ok',count:avatars.length,avatars,...(includeRaw?{raw:body}:{})};
    }catch(error){
      return {provider:source.id,name:source.name,url,status:null,ok:false,latencyMs:Date.now()-started,state:controller.signal.aborted?'timeout_or_aborted':'network_error',message:String(error?.message||error).slice(0,300),avatars:[]};
    }finally{clearTimeout(timer);if(signal&&abortListener)signal.removeEventListener('abort',abortListener);}
  }
  async function search(query,{providers,signal,includeRaw=false}={}){
    if(typeof query!=='string'||!query.trim())throw new TypeError('Nonempty avatar search query required');
    if(query.length>200)throw new RangeError('Avatar search query too long');
    const chosen=select(providers);
    const results=await Promise.all(chosen.map(s=>probe(s,query.trim(),{signal,includeRaw})));
    return {query:query.trim(),providers:results,total:results.reduce((n,p)=>n+p.avatars.length,0),successful:results.filter(p=>p.ok).length,failed:results.filter(p=>!p.ok).length};
  }
  return Object.freeze({sources,search,check:(options={})=>search(options.query||'Rindo',options)});
}
module.exports={createAvatarSearch,sources,BROWSER_UA};
