import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {CLINICAL_EXPANSIONS_A} from '../assets/js/clinical-expansions-a.js';
import {CLINICAL_EXPANSIONS_B} from '../assets/js/clinical-expansions-b.js';
import {CLINICAL_EXPANSIONS_C} from '../assets/js/clinical-expansions-c.js';
import {RUS_ARTICLE_SOURCES,RUS_CLINICAL_DOCUMENTS,RUS_CLINICAL_REGISTRY} from '../assets/js/clinical-evidence.js';

const app=await readFile(new URL('../assets/js/app.js',import.meta.url),'utf8');
const start=app.indexOf('const CLINICAL_LIBRARY='),stop=app.indexOf('function renderClinical()',start);
const original=runInNewContext(app.slice(start,stop)+'\nCLINICAL_LIBRARY;');
const extension={...CLINICAL_EXPANSIONS_A,...CLINICAL_EXPANSIONS_B,...CLINICAL_EXPANSIONS_C};
const ids=new Set(original.map(x=>x.id));

test('all 31 original articles are extended without renaming or deleting them',()=>{
 assert.equal(original.length,31);
 assert.equal(Object.keys(extension).length,31);
 assert.deepEqual(new Set(Object.keys(extension)),ids);
 assert.deepEqual(new Set(Object.keys(RUS_ARTICLE_SOURCES)),ids);
});
test('each clinical article has at least three substantial unique new sections',()=>{
 const titles=new Set();
 let paragraphs=0;
 for(const item of original){
  const more=extension[item.id];
  assert.ok(more.length>=3,item.id);
  const ownTitles=new Set(item.sections.map(section=>section.title));
  for(const section of more){
   assert.ok(section.title.length>=10,item.id);
   assert.ok(!ownTitles.has(section.title),'Duplicate heading in '+item.id);
   ownTitles.add(section.title);
   assert.ok(section.items.length>=4,item.id+' '+section.title);
   for(const p of section.items){
    assert.ok(p.length>=70,'Short fragment '+item.id+' '+p);
    assert.ok(!titles.has(p),'Repeated content across articles: '+p);
    titles.add(p);
    paragraphs++;
   }
  }
 }
 assert.ok(paragraphs>=370,'Should be substantial, not decorative');
});
test('every listed reference maps only to Russian official medical documents or registry',()=>{
 const documents=Object.values(RUS_CLINICAL_DOCUMENTS);
 assert.ok(documents.length>=15);
 for(const d of documents){
  assert.match(d.id,/^\d+_\d+$/);
  assert.ok(d.year>=2022&&d.year<=2026);
  assert.ok(d.name.length>10);
  assert.ok(d.age.length>3);
  assert.match(d.url,/^https:\/\/cr\.minzdrav\.gov\.ru\//);
  if(!d.verifiedLink)assert.equal(d.url,RUS_CLINICAL_REGISTRY);
 }
 for(const [article,links] of Object.entries(RUS_ARTICLE_SOURCES)){
  assert.ok(ids.has(article));
  for(const link of links){
   assert.ok(RUS_CLINICAL_DOCUMENTS[link.doc],article+': unknown source '+link.doc);
   assert.ok(['по заболеванию','смежная'].includes(link.kind));
   assert.ok(link.scope.length>=15);
  }
 }
});
test('age and limited applicability are stated instead of inventing a generic Russian recommendation',()=>{
 assert.equal(RUS_ARTICLE_SOURCES.mnd.length,0);
 assert.equal(RUS_ARTICLE_SOURCES.syncope.length,0);
 const infection=RUS_ARTICLE_SOURCES.meningitis;
 assert.ok(infection.every(link=>link.kind==='смежная'));
 assert.match(infection[0].scope,/Только клещевой вирусный энцефалит/);
 assert.equal(RUS_CLINICAL_DOCUMENTS.inflammatory.age,'Дети');
 assert.equal(RUS_CLINICAL_DOCUMENTS.tickEncephalitis.age,'Взрослые');
 assert.ok(RUS_ARTICLE_SOURCES.stroke.some(link=>link.doc==='hemorrhage'));
});
test('article reader renders expanded content, direct official links and source scope',()=>{
 assert.match(app,/CLINICAL_EXPANSIONS\[item\.id\]/);
 assert.match(app,/RUS_ARTICLE_SOURCES\[item\.id\]/);
 assert.match(app,/nd-article-source-entry/);
 assert.match(app,/nd-article-source-scope/);
 assert.match(app,/Смежная КР — не весь синдром/);
 assert.match(app,/Открыть карточку официальной КР/);
 assert.match(app,/Открыть Рубрикатор и найти по ID/);
 assert.match(app,/Зарубежные источники не используются/);
});
