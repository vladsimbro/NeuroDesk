import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {CLINICAL_NEW_ARTICLES_A} from '../assets/js/clinical-new-a.js';
import {CLINICAL_NEW_ARTICLES_B} from '../assets/js/clinical-new-b.js';
import {CLINICAL_NEW_ARTICLES_C} from '../assets/js/clinical-new-c.js';
import {CLINICAL_NEW_ARTICLES_D} from '../assets/js/clinical-new-d.js';
import {RUS_ARTICLE_SOURCES,RUS_CLINICAL_DOCUMENTS,RUS_CLINICAL_REGISTRY,RUS_CLINICAL_PORTAL} from '../assets/js/clinical-evidence.js';
const app=await readFile(new URL('../assets/js/app.js',import.meta.url),'utf8');
const start=app.indexOf('const CLINICAL_LIBRARY='),end=app.indexOf('function renderClinical()',start);
const baseline=runInNewContext(app.slice(start,end)+'\nCLINICAL_LIBRARY;');
const added=[...CLINICAL_NEW_ARTICLES_A,...CLINICAL_NEW_ARTICLES_B,...CLINICAL_NEW_ARTICLES_C,...CLINICAL_NEW_ARTICLES_D];
const all=[...baseline,...added];
test('20 new original reviews extend 31 unchanged articles to 51 unique entries',()=>{
 assert.equal(baseline.length,31);
 assert.equal(added.length,20);
 assert.equal(all.length,51);
 assert.equal(new Set(all.map(x=>x.id)).size,51);
 assert.equal(new Set(all.map(x=>x.title)).size,51);
 assert.equal(new Set(Object.keys(RUS_ARTICLE_SOURCES)).size,51);
 for(const article of all)assert.ok(Object.hasOwn(RUS_ARTICLE_SOURCES,article.id),article.id+' source scope not mapped');
});
test('every new article contains specific clinical navigation, differential and safety content',()=>{
 const text=new Set();
 let paragraphs=0;
 for(const article of added){
  assert.match(article.id,/^[a-z][a-z0-9-]+$/);
  assert.ok(article.summary.length>=75,article.id+' summary');
  assert.ok(['Заболевания','Синдромы','Симптомы','Неотложные состояния'].includes(article.category));
  assert.ok(article.tags.length>=3);
  assert.ok(article.sections.length>=4,article.id+' sections');
  const headingNames=new Set();
  for(const section of article.sections){
   assert.ok(section.title.length>=12,article.id);
   assert.ok(!headingNames.has(section.title),'duplicate heading in '+article.id);
   headingNames.add(section.title);
   assert.ok(section.items.length>=4,article.id+' details');
   for(const paragraph of section.items){
    assert.ok(paragraph.length>=95,article.id+' short paragraph '+paragraph);
    assert.ok(!text.has(paragraph),'duplicate paragraph '+article.id);
    text.add(paragraph);
    paragraphs++;
   }
  }
 }
 assert.ok(paragraphs>=320);
});
test('official guideline links do not use unavailable /clin-rec /view-cr /preview-cr routes',async()=>{
 assert.equal(RUS_CLINICAL_REGISTRY,'https://minzdrav.gov.ru/special/smartphone_apps_rubrikator_kr');
 assert.equal(RUS_CLINICAL_PORTAL,'https://cr.minzdrav.gov.ru/');
 for(const doc of Object.values(RUS_CLINICAL_DOCUMENTS)){
  assert.equal(doc.url,RUS_CLINICAL_REGISTRY,doc.id);
  assert.equal(doc.verifiedLink,false,doc.id);
 }
 const evidence=await readFile(new URL('../assets/js/clinical-evidence.js',import.meta.url),'utf8');
 assert.doesNotMatch(evidence,/url:'https:\/\/cr\.minzdrav\.gov\.ru\/(?:view-cr|preview-cr|clin-rec)\/?/);
 assert.match(app,/Скопировать ID /);
 assert.match(app,/data-clinical-copy-id/);
 assert.match(app,/Официальная страница Минздрава о Рубрикаторе/);
});
test('the clinical module is lazy-loaded, while ICD and calculator logic stay independent',async()=>{
 const content=await readFile(new URL('../assets/js/clinical-content.js',import.meta.url),'utf8');
 assert.match(content,/CLINICAL_NEW_ARTICLES_A/);
 assert.match(content,/CLINICAL_NEW_ARTICLES_D/);
 assert.match(app,/for\(const article of data\.CLINICAL_NEW_ARTICLES\)/);
 assert.match(app,/loadClinicalContent\(\)/);
 const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(index,/51 клиническая статья/);
 assert.match(app,/51 клиническая статья/);
});
