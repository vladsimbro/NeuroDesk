import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createICDIndex,getICDByCode} from '../assets/js/icd-core.js';
import {getICDTreeRoots,getICDTreeChildren,getICDTreeLineage,getICDSearchHints,suggestICDQueries,limitedDistance,readCodeList,writeCodeList,ICD_FAVORITES_KEY} from '../assets/js/icd-enhancements.js';
const json=JSON.parse(await readFile(new URL('../assets/data/icd10-v2.27.json',import.meta.url),'utf8'));
const db=createICDIndex(json);

test('chapter tree opens from database parent IDs, never guessing code hierarchy',()=>{
 const roots=getICDTreeRoots(db,'G00-G99');
 assert.ok(roots.length>0);
 assert.ok(roots.every(root=>!getICDTreeRoots(db,'G00-G99').some(other=>other.id===root.parentId)));
 const migraine=getICDByCode(db,'G43'),subtype=getICDByCode(db,'G43.1');
 assert.ok(migraine&&subtype);
 const lineage=getICDTreeLineage(db,subtype,'G00-G99');
 assert.ok(lineage.includes(migraine.id));
 assert.ok(getICDTreeChildren(db,migraine).some(item=>item.id===subtype.id));
 assert.equal(getICDTreeLineage(db,subtype,'I00-I99').length,0);
});
test('search hints show descriptive rubrics only and do not pretend to assign diagnosis',()=>{
 const hints=getICDSearchHints(db,'ишемический инсульт');
 assert.ok(hints.some(h=>h.item.code==='I63'));
 assert.equal(hints.some(h=>h.item.code==='I63.9'),false);
 assert.equal(getICDSearchHints(db,'ишемический инсульт',{chapterRange:'G00-G99'}).length,0);
 assert.equal(getICDSearchHints(db,'см').length,0);
 assert.ok(getICDSearchHints(db,'тиа').some(h=>h.item.code==='G45'));
});
test('typo proposals are separate, do not silently change the entered term',()=>{
 assert.equal(limitedDistance('мигрень','мигренъ'),1);
 assert.equal(limitedDistance('алкоголь','алккоголь'),1);
 assert.ok(suggestICDQueries(db,'мигренъ').includes('мигрень'));
 assert.deepEqual(suggestICDQueries(db,'а'),[]);
});
test('browser code lists keep only valid code strings, dedupe, cap size, reject corrupt storage',()=>{
 const memory=new Map();
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 assert.deepEqual(readCodeList(storage,ICD_FAVORITES_KEY),[]);
 assert.equal(writeCodeList(storage,ICD_FAVORITES_KEY,['G43','G43','I63.9','<script>','G43.1']),true);
 assert.deepEqual(readCodeList(storage,ICD_FAVORITES_KEY),['G43','I63.9','G43.1']);
 memory.set(ICD_FAVORITES_KEY,'not-json');
 assert.deepEqual(readCodeList(storage,ICD_FAVORITES_KEY),[]);
 assert.deepEqual(readCodeList(null,ICD_FAVORITES_KEY),[]);
});
test('service worker pre-caches only the ICD page assets, never clinical or calculator modules',async()=>{
 const worker=await readFile(new URL('../sw-icd.js',import.meta.url),'utf8');
 assert.match(worker,/icd10-v2\.27\.json/);
 assert.match(worker,/icd-enhancements\.js/);
 assert.match(worker,/CACHE_NAME/);
 assert.doesNotMatch(worker,/'\.\/clinical\.html'|'\.\/calculators\.html'|calculator-models\.js/);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/manifest\.webmanifest/);
});
