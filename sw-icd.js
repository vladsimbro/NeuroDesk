// Offline-only cache for NeuroDesk's ICD-10 workspace.
// Do not intercept or persist clinical forms, calculator requests, or patient data.
const CACHE_NAME='neurodesk-icd-v20261110-3';
const CACHE_PREFIX='neurodesk-icd-';
const FILES=[
 './index.html',
 './assets/favicon.svg',
 './assets/css/styles.css',
 './assets/css/experience.css',
 './assets/css/icd.css',
 './assets/js/app.js',
 './assets/js/icd-core.js',
 './assets/js/icd-enhancements.js',
 './assets/js/icd.js',
 './assets/data/icd10-v2.27.json',
 './manifest.webmanifest'
];
const scope=self.registration.scope;
const paths=new Set(FILES.map(file=>new URL(file,scope).pathname));
const entry=new URL('./index.html',scope).pathname;
const directory=new URL('./',scope).pathname;
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(FILES.map(file=>new Request(new URL(file,scope),{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 const path=url.pathname===directory?entry:url.pathname;
 if(!paths.has(path))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const canonical=new URL(path,self.location.origin);
  const cached=await cache.match(canonical.href);
  if(cached)return cached;
  try{
   const response=await fetch(request);
   if(response.ok)await cache.put(canonical.href,response.clone());
   return response;
  }catch(error){
   return Response.error();
  }
 })());
});
