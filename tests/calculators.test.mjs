import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SCALE_DEFS,calcScore2,calcGCS,calcABCD2,calcICH,calculate} from '../assets/js/calculator-models.js';

const root=new URL('../',import.meta.url);
const html=await readFile(new URL('calculators.html',root),'utf8');
const home=await readFile(new URL('index.html',root),'utf8');
const clinical=await readFile(new URL('clinical.html',root),'utf8');
const js=await readFile(new URL('assets/js/app.js',root),'utf8');

test('calculator page is discoverable from all three entry points',()=>{
 for(const source of [home,clinical,js])assert.match(source,/calculators\.html/);
 assert.match(html, /id="calc-search"/);
 assert.match(html, /id="calc-detail"/);
 assert.match(html, /id="calc-items"/);
 assert.match(html, /assets\/js\/calculators\.js/);
});

test('all scale cards have a working implementation, fields, warning and source',()=>{
 assert.equal(SCALE_DEFS.length,9);
 assert.equal(new Set(SCALE_DEFS.map(x=>x.id)).size,9);
 for(const scale of SCALE_DEFS){
  assert.ok(scale.title&&scale.subtitle&&scale.fields.length&&scale.sources.length&&scale.note,scale.id);
  assert.ok(scale.fields.every(field=>field.key&&field.label),scale.id);
  assert.ok(scale.sources.every(s=>/^https:\/\//.test(s[1])),scale.id);
 }
});

const base={age:60,sex:'male',smoker:false,sbp:120,total:6,hdl:1.3,region:'moderate',diabetes:false,ascvd:false,ckd:false};
test('SCORE2 calculates a finite calibrated 10-year probability',()=>{
 for(const sex of ['male','female'])for(const region of ['low','moderate','high','very_high']){
  const value=calcScore2({...base,sex,region});
  assert.equal(value.model,'SCORE2');
  assert.ok(value.percent>0&&value.percent<100);
  assert.ok(Number.isFinite(value.lp));
 }
});
test('SCORE2 regional risk ordering behaves coherently for a typical example',()=>{
 const low=calcScore2({...base,region:'low'}).percent;
 const moderate=calcScore2({...base,region:'moderate'}).percent;
 const high=calcScore2({...base,region:'high'}).percent;
 const veryHigh=calcScore2({...base,region:'very_high'}).percent;
 assert.ok(low<moderate&&moderate<high&&high<veryHigh,JSON.stringify({low,moderate,high,veryHigh}));
});
test('SCORE2 and SCORE2-OP automatically switch at 70 and use different coefficient sets',()=>{
 const sixtyNine=calcScore2({...base,age:69});
 const seventy=calcScore2({...base,age:70});
 assert.equal(sixtyNine.model,'SCORE2');
 assert.equal(seventy.model,'SCORE2-OP');
 assert.ok(seventy.percent>0&&seventy.percent<100);
});
test('SCORE2-OP gives finite probabilities by sex and region',()=>{
 for(const sex of ['male','female'])for(const region of ['low','moderate','high','very_high']){
  const outcome=calcScore2({...base,sex,region,age:80});
  assert.equal(outcome.model,'SCORE2-OP');
  assert.ok(outcome.percent>0&&outcome.percent<100,outcome.percent);
 }
});
test('SCORE2 rejects missing, invalid, incompatible or inapplicable inputs',()=>{
 for(const input of [
  {age:39},{age:90},{age:60.5},{sbp:NaN},{sbp:999},
  {total:4,hdl:5},{region:'invalid'},{sex:'invalid'},
  {smoker:undefined},{ascvd:true},{diabetes:true},{ckd:true}
 ])assert.throws(()=>calcScore2({...base,...input}));
});
test('GCS correctly sums the three components and subtracts pupil score',()=>{
 assert.deepEqual(calcGCS({eye:'4',verbal:'5',motor:'6',pupils:'0'}),{total:15,gcsp:15,components:'E4 V5 M6',pupils:0});
 assert.equal(calcGCS({eye:'1',verbal:'1',motor:'1',pupils:'2'}).gcsp,1);
 assert.equal(calcGCS({eye:'4',verbal:'NT',motor:'6',pupils:'0'}).total,null);
 assert.throws(()=>calcGCS({eye:'7',verbal:'5',motor:'6',pupils:'0'}));
});
test('ABCD2 combines each criterion and has correct endpoints',()=>{
 assert.equal(calcABCD2({age:59,pressure:false,weakness:false,speech:false,duration:0,diabetes:false}),0);
 assert.equal(calcABCD2({age:60,pressure:true,weakness:true,speech:true,duration:60,diabetes:true}),7);
 assert.equal(calcABCD2({age:60,pressure:false,weakness:false,speech:true,duration:10,diabetes:false}),3);
});
test('ICH scores extreme values correctly',()=>{
 assert.equal(calcICH({gcs:15,age:50,volume:0,ivh:false,infratentorial:false}),0);
 assert.equal(calcICH({gcs:3,age:90,volume:40,ivh:true,infratentorial:true}),6);
 assert.equal(calcICH({gcs:9,age:70,volume:20,ivh:false,infratentorial:false}),1);
});
test('simple score results are validated and explanatory',()=>{
 assert.match(calculate('mrs',{grade:'6'}).label,/Смерть/);
 assert.match(calculate('nrs',{value:'7',period:'Сейчас'}).value,/7 \/ 10/);
 assert.match(calculate('map',{sbp:'120',dbp:'80'}).value,/93\.3/);
 assert.match(calculate('bmi',{height:'180',weight:'81'}).value,/25\.0/);
 const mrc=Object.fromEntries(Array.from({length:12},(_,i)=>['m'+i,'5']));
 assert.match(calculate('mrc',mrc).value,/60 \/ 60/);
 assert.throws(()=>calculate('map',{sbp:'100',dbp:'120'}));
 assert.throws(()=>calculate('bmi',{height:'0',weight:'81'}));
});
