import test from 'node:test';
import assert from 'node:assert/strict';
import {calcScore2,calcGCS,calcABCD2,calcICH,calculate,SCALE_DEFS} from '../assets/js/calculator-models.js';

/**
 * Independent reference calculation, frozen 2026-11-10:
 * original authors' Stata source: https://github.com/skkceu/stata
 * score2risk.ado and score2oprisk.ado, unrounded full-precision coefficients
 * European recalibration. Reference values generated separately from the
 * application algorithm. No claim that Stata itself was executed in CI.
 * Coefficient formula includes the SCORE2-OP sex-specific lp_mean subtraction.
 */
const scoreCases=[
  {age:40,sex:'male',region:'low',smoker:false,sbp:110,total:4.2,hdl:1.7,expected:0.7857795504},
  {age:49,sex:'female',region:'moderate',smoker:true,sbp:140,total:6.5,hdl:1.1,expected:6.0722782735},
  {age:50,sex:'male',region:'high',smoker:true,sbp:170,total:7.1,hdl:1.2,expected:17.6647833224},
  {age:59,sex:'female',region:'very_high',smoker:false,sbp:130,total:5.3,hdl:1.8,expected:8.2954127296},
  {age:60,sex:'male',region:'moderate',smoker:false,sbp:120,total:6,hdl:1.3,expected:6.3237736551},
  {age:65,sex:'male',region:'very_high',smoker:true,sbp:160,total:6.4,hdl:1.0,expected:37.2646652096},
  {age:69,sex:'female',region:'high',smoker:true,sbp:150,total:6.8,hdl:1.4,expected:24.5879864133},
  {age:69,sex:'male',region:'low',smoker:false,sbp:125,total:4.8,hdl:1.6,expected:7.1870285246},
  {age:70,sex:'male',region:'high',smoker:false,sbp:150,total:6,hdl:1.4,expected:16.4223635885},
  {age:70,sex:'female',region:'low',smoker:false,sbp:130,total:5.4,hdl:1.7,expected:5.2554234999},
  {age:73,sex:'female',region:'moderate',smoker:true,sbp:155,total:6.2,hdl:1.0,expected:23.6640228494},
  {age:75,sex:'male',region:'low',smoker:true,sbp:150,total:5.9,hdl:1.4,expected:20.3094217524},
  {age:75,sex:'male',region:'very_high',smoker:true,sbp:150,total:5.9,hdl:1.4,expected:41.4190435278},
  {age:77,sex:'female',region:'high',smoker:false,sbp:120,total:5.5,hdl:1.5,expected:19.1724266082},
  {age:80,sex:'male',region:'moderate',smoker:true,sbp:175,total:7.0,hdl:0.9,expected:49.1668370133},
  {age:80,sex:'female',region:'very_high',smoker:true,sbp:180,total:6.5,hdl:1.2,expected:61.1382093150},
  {age:85,sex:'female',region:'low',smoker:false,sbp:110,total:4.3,hdl:1.9,expected:16.7949777387},
  {age:89,sex:'male',region:'very_high',smoker:false,sbp:145,total:5.8,hdl:1.3,expected:54.9045407989}
];
for(const x of scoreCases){
 test('SCORE2 original-equation fixture '+x.age+' '+x.sex+' '+x.region+' smoker '+x.smoker,()=>{
  const {expected,...data}=x;
  const result=calcScore2(data);
  assert.ok(Math.abs(result.percent-expected)<.000001,'actual '+result.percent+'; author-equation reference '+expected);
  assert.equal(result.model,x.age<70?'SCORE2':'SCORE2-OP');
 });
}
test('published SCORE2 authors equation contains the OP centering correction (example check)',()=>{
 const sample=scoreCases.find(c=>c.age===75&&c.region==='low');
 const value=calcScore2(sample);
 assert.ok(Math.abs(value.percent-20.3094217524)<.000001);
 // A third-party demonstration omits the lp_mean adjustment and gives ~22.5%.
 // That value differs from the author source score2oprisk.ado: it is not a
 // reference target for this implementation.
});
test('mRS exactly matches published 0–6 category boundaries',()=>{
 const phrases=['Симптомы отсутствуют','Нет значимых ограничений','Лёгкое нарушение','Умеренное нарушение','Умеренно тяжёлое','Тяжёлое нарушение','Смерть'];
 for(let grade=0;grade<=6;grade++){
  const result=calculate('mrs',{grade:String(grade)});
  assert.ok(result.label.includes(phrases[grade]));
  assert.equal(result.value,grade+' / 6');
 }
 const grade3=calculate('mrs',{grade:'3'}).breakdown;
 const grade4=calculate('mrs',{grade:'4'}).breakdown;
 assert.match(grade3[0].value,/ходить|передвигаться/);
 assert.match(grade4[0].value,/помощ/);
});
test('RASS includes exactly ten discrete observation categories',()=>{
 const opt=SCALE_DEFS.find(s=>s.id==='rass').fields[0].options.filter(o=>o[0]!=='');
 assert.deepEqual(opt.map(o=>Number(o[0])).sort((a,b)=>a-b),[-5,-4,-3,-2,-1,0,1,2,3,4]);
 for(const o of opt)assert.equal(Number(calculate('rass',{grade:o[0]}).value),Number(o[0]));
});
test('4AT four-domain boundary values and interpretation match the original online instrument',()=>{
 const base={alertness:'0',orientation:'0',attention:'0',change:'0'};
 assert.equal(calculate('fourat',base).value,'0 / 12');
 assert.equal(calculate('fourat',{...base,orientation:'1'}).value,'1 / 12');
 assert.equal(calculate('fourat',{...base,orientation:'2',attention:'1'}).value,'3 / 12');
 assert.match(calculate('fourat',{...base,change:'4'}).label,/делирий/);
 assert.equal(calculate('fourat',{alertness:'4',orientation:'2',attention:'2',change:'4'}).value,'12 / 12');
});
test('ABCD2 source thresholds do not add isolated speech on top of weakness',()=>{
 assert.equal(calcABCD2({age:60,pressure:true,weakness:true,speech:true,duration:60,diabetes:true}),7);
 assert.equal(calcABCD2({age:60,pressure:true,weakness:false,speech:true,duration:60,diabetes:true}),6);
 assert.equal(calcABCD2({age:59,pressure:false,weakness:false,speech:false,duration:9,diabetes:false}),0);
 assert.equal(calcABCD2({age:59,pressure:false,weakness:false,speech:false,duration:10,diabetes:false}),1);
 assert.equal(calcABCD2({age:59,pressure:false,weakness:false,speech:false,duration:60,diabetes:false}),2);
});
test('ICH original published cutoffs, GCS and GCS-P boundaries',()=>{
 const base={gcs:15,age:79,volume:29.9,ivh:false,infratentorial:false};
 assert.equal(calcICH(base),0);
 assert.equal(calcICH({...base,gcs:12}),1);
 assert.equal(calcICH({...base,gcs:4}),2);
 assert.equal(calcICH({...base,age:80}),1);
 assert.equal(calcICH({...base,volume:30}),1);
 assert.equal(calcICH({...base,ivh:true}),1);
 assert.equal(calcICH({...base,infratentorial:true}),1);
 assert.equal(calcGCS({eye:1,verbal:1,motor:1,pupils:2}).gcsp,1);
 assert.equal(calcGCS({eye:4,verbal:5,motor:6,pupils:0}).gcsp,15);
});
test('MRC and RASS sources cover all valid integer choices',()=>{
 const mrc=SCALE_DEFS.find(s=>s.id==='mrc');
 assert.equal(mrc.fields.length,12);
 for(const f of mrc.fields)assert.deepEqual(f.options.filter(p=>p[0]!=='').map(p=>Number(p[0])),[0,1,2,3,4,5]);
 for(let n=0;n<=5;n++){
  const fields=Object.fromEntries(mrc.fields.map(f=>[f.key,String(n)]));
  assert.equal(calculate('mrc',fields).value,(12*n)+' / 60');
 }
});
test('MAP and BMI formula examples agree with public source definitions',()=>{
 assert.equal(calculate('map',{sbp:'120',dbp:'80'}).value,'93.3 мм рт. ст.');
 assert.equal(calculate('map',{sbp:'100',dbp:'70'}).value,'80.0 мм рт. ст.');
 assert.equal(calculate('bmi',{weight:'81',height:'180'}).value,'25.0 кг/м²');
 assert.equal(calculate('nrs',{value:'0',period:'Сейчас'}).value,'0 / 10');
 assert.equal(calculate('nrs',{value:'10',period:'Сейчас'}).value,'10 / 10');
});
