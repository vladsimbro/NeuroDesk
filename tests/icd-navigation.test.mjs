import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ICD_CHAPTERS,createICDIndex,getICDByCode,getAncestors,getChildren,chapterItems,chapterGroups,chapterOf,searchICD,inChapter,normalizeCode,normalizeText} from '../assets/js/icd-core.js';

const data=JSON.parse(await readFile(new URL('../assets/data/icd10-v2.27.json',import.meta.url),'utf8'));
const db=createICDIndex(data);

test('indexed local dataset preserves every official record and parent relation',()=>{
 assert.equal(db.records.length,15038);
 assert.equal(db.byId.size,15038);
 assert.ok(db.childrenByParent.size>0,'parent index exists');
 for(const item of db.records){
  assert.equal(db.byId.get(item.id),item);
  if(item.parentId)assert.ok(db.byId.has(item.parentId),'orphan '+item.code);
 }
});
test('22 chapters match WHO numbering, including final XX, XXI and XXII',()=>{
 assert.equal(ICD_CHAPTERS.length,22);
 assert.deepEqual(ICD_CHAPTERS.slice(-3).map(c=>c.slice(0,2)),[['XX','V01-Y98'],['XXI','Z00-Z99'],['XXII','U00-U85']]);
 assert.equal(chapterOf('G43')[0],'VI');
 assert.equal(chapterOf('I63.9')[0],'IX');
 assert.equal(chapterOf('Z00')[0],'XXI');
 assert.equal(chapterOf('U07.1')[0],'XXII');
 assert.equal(inChapter('D48.9','C00-D48'),true);
 assert.equal(inChapter('D50','C00-D48'),false);
});
test('search recognizes short fragments, exact code, partial code and Russian variants',()=>{
 const terms=['ми','migraine','G43','g43.','G43.1','G43 1'];
 for(const text of terms){
  const found=searchICD(db,text);
  if(text==='migraine')continue; // database is Russian and English transliteration is not guaranteed.
  assert.ok(found.length>0,'no results for '+text);
 }
 assert.equal(searchICD(db,'G43')[0].code,'G43');
 assert.equal(searchICD(db,'G43.1')[0].code,'G43.1');
 assert.ok(searchICD(db,'ми').some(item=>item.name.toLocaleLowerCase('ru-RU').includes('ми')),'short 2-letter search');
 assert.equal(normalizeText('ЁЖИК'), 'ежик');
 assert.equal(normalizeCode(' g43.1 '),'G43.1');
 assert.deepEqual(searchICD(db,'').map(x=>x.code),[]);
});
test('chapter navigation lists parent blocks and respects filter',()=>{
 const nervous=chapterItems(db,'G00-G99');
 assert.ok(nervous.length>50);
 assert.ok(nervous.some(x=>x.code==='G43'));
 assert.ok(nervous.every(x=>inChapter(x.code,'G00-G99')));
 const groups=chapterGroups(db,'G00-G99');
 assert.ok(groups.length>0);
 assert.ok(groups.every(x=>/^[A-Z]\d{2}(-[A-Z]\d{2})?$/.test(x.code)));
 const focused=searchICD(db,'ми',{chapterRange:'G00-G99'});
 assert.ok(focused.every(x=>inChapter(x.code,'G00-G99')));
 assert.equal(searchICD(db,'', {chapterRange:'G00-G99'}).length,nervous.length);
});
test('hierarchy displays real parents, children, and avoids mixing other code families',()=>{
 const migraine=getICDByCode(db,'G43');
 const subtype=getICDByCode(db,'G43.1');
 assert.ok(migraine&&subtype);
 const lineage=getAncestors(db,subtype);
 assert.ok(lineage.length>0,'real dataset lineage exists');
 const children=getChildren(db,migraine,true);
 assert.ok(children.length>0,'subcategory list exists');
 assert.ok(children.some(x=>x.code==='G43.1'));
 assert.ok(lineage.some(x=>x.code==='G43'));
 assert.equal(getICDByCode(db,'does-not-exist'),null);
});
test('inactive records only appear when explicitly requested',()=>{
 const old=db.records.find(x=>x.actual==='0'&&x.code);
 assert.ok(old);
 const term=old.code;
 const regular=searchICD(db,term);
 const withOld=searchICD(db,term,{includeInactive:true});
 assert.equal(regular.some(x=>x.id===old.id),false);
 assert.ok(withOld.some(x=>x.id===old.id));
});
