import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {CLINICAL_NEXT_VASCULAR} from '../assets/js/clinical-next-vascular.js';
import {CLINICAL_NEXT_NEUROMUSCULAR} from '../assets/js/clinical-next-neuromuscular.js';
import {CLINICAL_NEXT_NEUROIMMUNE} from '../assets/js/clinical-next-neuroimmune.js';
import {CLINICAL_NEXT_MOVEMENT_COGNITION} from '../assets/js/clinical-next-movement-cognition.js';
import {CLINICAL_NEXT_HEADACHE_CHILD} from '../assets/js/clinical-next-headache-child.js';
import {CLINICAL_NEXT_VESTIBULAR_SLEEP} from '../assets/js/clinical-next-vestibular-sleep.js';
import {CLINICAL_NEW_ARTICLES} from '../assets/js/clinical-content.js';
import {RUS_ARTICLE_SOURCES,RUS_CLINICAL_DOCUMENTS,RUS_CLINICAL_REGISTRY} from '../assets/js/clinical-evidence.js';

const app=await readFile(new URL('../assets/js/app.js',import.meta.url),'utf8');
const base=runInNewContext(app.slice(app.indexOf('const CLINICAL_LIBRARY='),app.indexOf('function renderClinical()'))+'\nCLINICAL_LIBRARY;');
const new24=[...CLINICAL_NEXT_VASCULAR,...CLINICAL_NEXT_NEUROMUSCULAR,...CLINICAL_NEXT_NEUROIMMUNE,...CLINICAL_NEXT_MOVEMENT_COGNITION,...CLINICAL_NEXT_HEADACHE_CHILD,...CLINICAL_NEXT_VESTIBULAR_SLEEP];
const all=[...base,...CLINICAL_NEW_ARTICLES];

test('clinical editorial plan is fully implemented: 31 original + 20 + 24 = 75',()=>{
 assert.deepEqual([CLINICAL_NEXT_VASCULAR.length,CLINICAL_NEXT_NEUROMUSCULAR.length,CLINICAL_NEXT_NEUROIMMUNE.length,CLINICAL_NEXT_MOVEMENT_COGNITION.length,CLINICAL_NEXT_HEADACHE_CHILD.length,CLINICAL_NEXT_VESTIBULAR_SLEEP.length],[4,5,4,5,4,2]);
 assert.equal(base.length,31);
 assert.equal(new24.length,24);
 assert.equal(CLINICAL_NEW_ARTICLES.length,44);
 assert.equal(all.length,75);
 assert.equal(new Set(all.map(x=>x.id)).size,75,'Duplicate article ID');
 assert.equal(new Set(all.map(x=>x.title)).size,75,'Duplicate title');
 assert.equal(Object.keys(RUS_ARTICLE_SOURCES).length,75);
 assert.deepEqual(new Set(all.map(a=>a.id)),new Set(Object.keys(RUS_ARTICLE_SOURCES)));
});
test('all 24 second-phase clinical articles contain distinct substantive clinical sections',()=>{
 let paragraphs=0;
 const seenText=new Set();
 for(const article of new24){
  assert.match(article.id,/^[a-z][a-z0-9-]+$/,article.id);
  assert.ok(article.summary.length>=65,article.id+' summary should explain scope');
  assert.ok(article.tags.length>=3,article.id+' terms');
  assert.ok(article.sections.length>=4,article.id+' sections');
  const headings=new Set();
  for(const section of article.sections){
   assert.ok(section.title.length>=10,article.id+' section heading');
   assert.ok(!headings.has(section.title),'Repeated heading '+article.id);
   headings.add(section.title);
   assert.ok(section.items.length>=4,article.id+' section needs detail');
   for(const sentence of section.items){
    assert.ok(sentence.length>=65,article.id+' has superficial content: '+sentence);
    assert.ok(!seenText.has(sentence),'Repeated paragraph across article modules: '+article.id);
    seenText.add(sentence);paragraphs++;
   }
  }
 }
 assert.ok(paragraphs>=384,'24 articles must include at least four 4-point sections');
});
test('pediatric cerebral palsy guideline is properly identified and still does not link to a known 404 page',()=>{
 const cp=RUS_CLINICAL_DOCUMENTS.cerebralPalsy;
 assert.equal(cp.id,'1087_1');
 assert.equal(cp.year,2026);
 assert.match(cp.age,/Дети/);
 assert.equal(cp.url,RUS_CLINICAL_REGISTRY);
 assert.equal(cp.verifiedLink,false);
 assert.equal(RUS_ARTICLE_SOURCES['cerebral-palsy'][0].kind,'по заболеванию');
 assert.equal(RUS_ARTICLE_SOURCES['tick-encephalitis-rf'][0].doc,'tickEncephalitis');
 assert.equal(RUS_ARTICLE_SOURCES.nmosd[0].kind,'смежная');
 assert.deepEqual(RUS_ARTICLE_SOURCES.narcolepsy,[]);
 assert.deepEqual(RUS_ARTICLE_SOURCES.mogad.map(x=>x.kind),['смежная']);
});
test('clinical-only lazy imports and metadata are integrated without modifying unrelated model calculations',async()=>{
 const content=await readFile(new URL('../assets/js/clinical-content.js',import.meta.url),'utf8');
 for(const name of ['CLINICAL_NEXT_VASCULAR','CLINICAL_NEXT_NEUROMUSCULAR','CLINICAL_NEXT_NEUROIMMUNE','CLINICAL_NEXT_MOVEMENT_COGNITION','CLINICAL_NEXT_HEADACHE_CHILD','CLINICAL_NEXT_VESTIBULAR_SLEEP']){
  assert.ok(content.includes(name),'Clinical lazy module missing '+name);
 }
 assert.match(app,/75 клинических статей/);
 const index=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(index,/75 клинических статей/);
 const plan=await readFile(new URL('../docs/CLINICAL_CATALOG_PLAN.md',import.meta.url),'utf8');
 assert.match(plan,/75/);
});
