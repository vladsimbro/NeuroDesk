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
 assert.equal(SCALE_DEFS.length,11);
 assert.equal(new Set(SCALE_DEFS.map(x=>x.id)).size,11);
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

test('4AT sums all four components and handles untestable attention/orientation',()=>{
 assert.equal(calculate('fourat',{alertness:'0',orientation:'0',attention:'0',change:'0'}).value,'0 / 12');
 assert.equal(calculate('fourat',{alertness:'4',orientation:'2',attention:'2',change:'4'}).value,'12 / 12');
 assert.match(calculate('fourat',{alertness:'0',orientation:'2',attention:'2',change:'0'}).label,/делирий/);
 assert.throws(()=>calculate('fourat',{alertness:'0',orientation:'0',attention:'0',change:''}));
});
test('RASS preserves positive, neutral and negative scale signs',()=>{
 assert.equal(calculate('rass',{grade:'4'}).value,'+4');
 assert.equal(calculate('rass',{grade:'0'}).value,'0');
 assert.equal(calculate('rass',{grade:'-5'}).value,'-5');
});
test('4AT attribution and adaptation disclosures are included',()=>{
 const instrument=SCALE_DEFS.find(x=>x.id==='fourat');
 assert.match(instrument.note,/CC BY 4\.0/);
 assert.match(instrument.note,/адаптаци/);
 assert.ok(instrument.sources.some(x=>x[1].includes('the4at.com/attribution')));
});


test('all seven modified Rankin grades explain functional dependence',()=>{
 const expected=[
  ['Симптомы отсутствуют','Нет ограничений'],
  ['Нет значимых ограничений','Полная самостоятельность'],
  ['Лёгкое нарушение','собственными делами'],
  ['Умеренное нарушение','ходить без помощи'],
  ['Умеренно тяжёлое','не способен ходить'],
  ['Тяжёлое нарушение','постоянного'],
  ['Смерть','оценке исхода']
 ];
 expected.forEach(([title,meaning],grade)=>{
  const outcome=calculate('mrs',{grade:String(grade)});
  assert.equal(outcome.value,grade+' / 6');
  assert.ok(outcome.label.includes(title),'grade '+grade+': '+outcome.label);
  const report=outcome.summary+' '+outcome.breakdown.map(x=>x.value).join(' ')+' '+outcome.interpretation;
  assert.ok(report.toLocaleLowerCase('ru-RU').includes(meaning.toLocaleLowerCase('ru-RU')),'grade '+grade+': '+meaning);
  assert.equal(outcome.breakdown.length,3);
 });
});

test('all scales provide complete result explanations and traceable components',()=>{
 const fixtures={
  score2:{age:'60',sex:'male',region:'moderate',smoker:'no',sbp:'120',total:'6',hdl:'1.3',ascvd:'no',diabetes:'no',ckd:'no'},
  gcs:{eye:'4',verbal:'5',motor:'6',pupils:'0'},
  mrs:{grade:'3'},
  abcd2:{age:'60',pressure:'yes',symptom:'weakness',duration:'60',diabetes:'yes'},
  ich:{gcs:'3',age:'80',volume:'30',ivh:'yes',infratentorial:'yes'},
  fourat:{alertness:'4',orientation:'2',attention:'2',change:'4'},
  rass:{grade:'-1'},
  nrs:{value:'7',period:'Сейчас'},
  mrc:Object.fromEntries(Array.from({length:12},(_,i)=>['m'+i,'5'])),
  map:{sbp:'120',dbp:'80'},
  bmi:{weight:'81',height:'180'}
 };
 for(const scale of SCALE_DEFS){
  const data=fixtures[scale.id];
  assert.ok(data,'No sample input for '+scale.id);
  const outcome=calculate(scale.id,data);
  assert.ok(typeof outcome.value==='string'&&outcome.value.length,scale.id+': value');
  for(const property of ['label','summary','note','interpretation'])assert.ok(typeof outcome[property]==='string'&&outcome[property].length>=(property==='label'?1:13),scale.id+': '+property);
  assert.ok(outcome.breakdown.length>=1,scale.id+': breakdown');
  assert.ok(outcome.breakdown.every(row=>row.label&&row.value),scale.id+': missing breakdown row');
 }
});
test('selection tampering is rejected rather than accepted as 0 or false',()=>{
 assert.throws(()=>calculate('mrs',{grade:'7'}),/Недопустимое/);
 assert.throws(()=>calculate('rass',{grade:'-7'}),/Недопустимое/);
 assert.throws(()=>calculate('fourat',{alertness:'0',orientation:'0',attention:'3',change:'4'}),/Недопустимое/);
 assert.throws(()=>calculate('abcd2',{age:'60',pressure:'bogus',symptom:'weakness',duration:'60',diabetes:'yes'}),/Недопустимое/);
 assert.throws(()=>calculate('nrs',{value:' ',period:'Сейчас'}),/Заполни/);
});
test('GCS-P is withheld when pupils are untestable while component GCS stays available',()=>{
 const outcome=calcGCS({eye:'4',verbal:'5',motor:'6',pupils:'NT'});
 assert.equal(outcome.total,15);
 assert.equal(outcome.gcsp,null);
 const report=calculate('gcs',{eye:'4',verbal:'5',motor:'6',pupils:'NT'});
 assert.equal(report.value,'15 / 15');
 assert.match(report.breakdown.at(-1).value,/не вычисляется/);
 assert.match(report.breakdown.at(-1).value,/реакцию зрачков/);
});
test('Score2 category reflects actual age-group thresholds and selected region',()=>{
 const inputs={age:'49',sex:'female',region:'very_high',smoker:'no',sbp:'120',total:'5.0',hdl:'1.5',ascvd:'no',diabetes:'no',ckd:'no'};
 for(const [age,phrase] of [['49','<2,5'],['50','<5'],['70','<7,5']]){
  const o=calculate('score2',{...inputs,age});
  assert.ok(o.breakdown.some(x=>x.value.includes(phrase)),'Threshold '+age+' -> '+phrase);
  assert.ok(o.breakdown.some(x=>x.value.includes('очень высокого')));
 }
 assert.throws(()=>calculate('score2',{...inputs,diabetes:'yes'}),/диабет/);
});
test('decimal comma and numeric bounds are both validated',()=>{
 assert.match(calculate('bmi',{weight:'81,0',height:'180'}).value,/25\.0/);
 assert.match(calculate('map',{sbp:'120',dbp:'80,0'}).value,/93\.3/);
 assert.throws(()=>calculate('map',{sbp:'abc',dbp:'80'}),/диапазон/);
 assert.throws(()=>calculate('bmi',{weight:'81',height:'0'}),/диапазон/);
});
test('calculation guide and evidence disclosure cover all instruments',async()=>{
 const {CALCULATOR_GUIDES}=await import('../assets/js/calculator-guides.js');
 for(const scale of SCALE_DEFS)assert.ok(CALCULATOR_GUIDES[scale.id]?.steps?.length>=3,scale.id);
 const ui=await readFile(new URL('assets/js/calculators.js',root),'utf8');
 assert.match(ui,/Что означает результат/);
 assert.match(ui,/Как получено/);
 assert.match(ui,/Как интерпретировать/);
 assert.match(ui,/Важные ограничения/);
 assert.match(ui,/Параметры изменены/);
 assert.match(ui,/Скопировать результат и расшифровку/);
});
