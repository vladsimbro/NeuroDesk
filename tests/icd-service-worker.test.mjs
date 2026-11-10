import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const script=await readFile(new URL('../sw-icd.js',import.meta.url),'utf8');
const scope='https://example.test/NeuroDesk/';
function setup(){
 const handlers={},stored=new Map(),allCaches=new Map(),deleted=[];
 const fakeCaches={
  async open(name){
   if(!allCaches.has(name))allCaches.set(name,{
    async addAll(requests){
     for(const request of requests)stored.set(request.url,new Response('cached:'+request.url));
    },
    async match(url){return stored.get(url)||undefined;},
    async put(url,response){stored.set(url,response);}
   });
   return allCaches.get(name);
  },
  async keys(){return [...allCaches.keys()];},
  async delete(name){deleted.push(name);return allCaches.delete(name);}
 };
 const self={
  registration:{scope},
  location:{origin:'https://example.test'},
  addEventListener:(name,fn)=>{handlers[name]=fn;},
  skipWaiting:async()=>{},
  clients:{claim:async()=>{}}
 };
 runInNewContext(script,{self,caches:fakeCaches,Request,Response,URL,fetch:async()=>{throw Error('offline network blocked');}});
 return {handlers,stored,allCaches,deleted};
}
function trigger(handler,request){
 let pending;
 handler(request?{request,respondWith:p=>{pending=p;}}:{waitUntil:p=>{pending=p;}});
 return pending;
}
test('SW install caches ICD dataset, core, CSS and entry page, without clinical/calculator pages',async()=>{
 const env=setup();
 await trigger(env.handlers.install);
 const keys=[...env.stored.keys()];
 assert.ok(keys.some(k=>k.endsWith('/assets/data/icd10-v2.27.json')));
 assert.ok(keys.some(k=>k.endsWith('/assets/js/icd-enhancements.js')));
 assert.ok(keys.some(k=>k.endsWith('/index.html')));
 assert.equal(keys.some(k=>/clinical\.html|calculators\.html|calculator-models/.test(k)),false);
});
test('SW serves full ICD dataset URL and deep-link entry from cache when network is offline',async()=>{
 const env=setup();
 await trigger(env.handlers.install);
 const data=await trigger(env.handlers.fetch,new Request(scope+'assets/data/icd10-v2.27.json'));
 assert.equal(data.status,200);
 assert.match(await data.text(),/cached:/);
 const entry=await trigger(env.handlers.fetch,new Request(scope+'index.html?code=G43.1'));
 assert.equal(entry.status,200);
 assert.match(await entry.text(),/index\.html/);
 const root=await trigger(env.handlers.fetch,new Request(scope+'?code=I63'));
 assert.equal(root.status,200);
 const outside=trigger(env.handlers.fetch,new Request(scope+'clinical.html'));
 assert.equal(outside,undefined);
});
test('SW activation removes only old ICD cache versions',async()=>{
 const env=setup();
 await env.allCaches.set('neurodesk-icd-old',{});
 await env.allCaches.set('unrelated-app-cache',{});
 await trigger(env.handlers.install);
 await trigger(env.handlers.activate);
 assert.ok(env.deleted.includes('neurodesk-icd-old'));
 assert.equal(env.deleted.includes('unrelated-app-cache'),false);
});
