import test from 'node:test';
import assert from 'node:assert/strict';
import {SCALE_DEFS,calculate} from '../assets/js/calculator-models.js';
import {CALCULATOR_GUIDES} from '../assets/js/calculator-guides.js';
import {CHOICE_FIELDS,FIELD_SECTIONS,renderCalculatorFields,completionState,missingField,displayScoreProgress} from '../assets/js/calculator-workspace.js';

const escapeHtml=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const find=id=>SCALE_DEFS.find(x=>x.id===id);
function fakeForm(tool,values){
 return {querySelector(selector){
  if(selector.startsWith('input[type="radio"]')){
   const found=selector.match(/\[name="([^"]+)"\]/)?.[1];
   if(!found)return null;
   if(!CHOICE_FIELDS[tool.id]?.includes(found))return null;
   if(selector.includes(':checked'))return values[found]===undefined?null:{value:values[found]};
   return {value:values[found]??''};
  }
  return null;
 },elements:{namedItem(key){return {value:values[key]??''};}}};
}
test('all 11 instruments have a complete accessible input presentation',()=>{
 for(const tool of SCALE_DEFS){
  const html=renderCalculatorFields(tool,CALCULATOR_GUIDES[tool.id],escapeHtml);
  assert.ok(html.includes('calc-input-section'),tool.id);
  for(const field of tool.fields)assert.match(html,new RegExp('name="'+field.key+'"'),'Missing '+tool.id+' '+field.key);
  assert.ok(!html.includes('https://cr.minzdrav.gov.ru/view-cr/'),'No broken official source');
 }
});
test('RASS uses all ten directly selectable behavioural states',()=>{
 const tool=find('rass'),html=renderCalculatorFields(tool,CALCULATOR_GUIDES.rass,escapeHtml);
 const radios=[...html.matchAll(/type="radio" name="grade"[^>]+value="(-?\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(radios,[4,3,2,1,0,-1,-2,-3,-4,-5]);
 assert.match(html,/calc-choice-group--long/);
});
test('GCS, 4AT, ABCD2 and ICH show real selectable categories',()=>{
 for(const id of ['gcs','fourat','abcd2','ich']){
  const tool=find(id),html=renderCalculatorFields(tool,CALCULATOR_GUIDES[id],escapeHtml);
  for(const key of CHOICE_FIELDS[id]){
   assert.ok(html.includes('type="radio" name="'+key+'"'),id+' '+key);
   assert.ok(html.includes('<legend class="calc-field-title">'),id+' legend');
  }
  assert.ok(html.includes('role="group"'),id+' aria group');
 }
});
test('NRS has 11 rating choices 0 through 10 plus the time-period selector',()=>{
 const html=renderCalculatorFields(find('nrs'),CALCULATOR_GUIDES.nrs,escapeHtml);
 const values=[...html.matchAll(/type="radio" name="value"[^>]+value="(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(values,Array.from({length:11},(_,n)=>n));
 assert.match(html,/name="period"/);
});
test('MRC clinically retains 12 inputs grouped in six right/left rows',()=>{
 const html=renderCalculatorFields(find('mrc'),CALCULATOR_GUIDES.mrc,escapeHtml);
 assert.equal((html.match(/class="calc-mrc-group"/g)||[]).length,6);
 assert.equal((html.match(/<select id="calc-m/g)||[]).length,12);
 assert.equal((html.match(/Правая сторона/g)||[]).length,6);
 assert.equal((html.match(/Левая сторона/g)||[]).length,6);
});
test('choice fields completion does not treat missing values as zero',()=>{
 const tool=find('gcs');
 let form=fakeForm(tool,{});
 assert.deepEqual(completionState(form,tool),{complete:0,total:4,percent:0});
 assert.equal(missingField(form,tool).key,'eye');
 form=fakeForm(tool,{eye:'1',verbal:'1',motor:'1'});
 assert.deepEqual(completionState(form,tool),{complete:3,total:4,percent:75});
 assert.equal(missingField(form,tool).key,'pupils');
 form=fakeForm(tool,{eye:'1',verbal:'1',motor:'1',pupils:'0'});
 assert.deepEqual(completionState(form,tool),{complete:4,total:4,percent:100});
 assert.equal(missingField(form,tool),null);
});
test('SCORE2 and mRS remain native accessible selectors and numerics',()=>{
 for(const tool of [find('score2'),find('mrs')]){
  const html=renderCalculatorFields(tool,CALCULATOR_GUIDES[tool.id],escapeHtml);
  assert.doesNotMatch(html,/type="radio"/);
  assert.ok(html.includes('<select'));
 }
});
test('neutral score-position display does not fabricate individual prognoses',()=>{
 assert.match(displayScoreProgress(find('nrs'),calculate('nrs',{value:'7',period:'Сейчас'}),escapeHtml),/width:70.0%/);
 assert.match(displayScoreProgress(find('mrc'),calculate('mrc',Object.fromEntries(Array.from({length:12},(_,n)=>['m'+n,'5']))),escapeHtml),/width:100.0%/);
 assert.equal(displayScoreProgress(find('score2'),calculate('score2',{age:'60',sex:'male',smoker:'no',region:'moderate',sbp:'120',total:'6',hdl:'1.3',diabetes:'no',ascvd:'no',ckd:'no'}),escapeHtml),'');
 assert.equal(displayScoreProgress(find('gcs'),calculate('gcs',{eye:'NT',verbal:'5',motor:'6',pupils:'0'}),escapeHtml),'');
});
test('source for Russian 4AT adaptation does not open broken specific clinical recommendation path',()=>{
 const tool=find('fourat');
 assert.ok(tool.sources.some(([label,url])=>label.includes('742_2')&&url==='https://minzdrav.gov.ru/special/smartphone_apps_rubrikator_kr'));
});
