import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGCS, formatGCSResult } from '../assets/js/calculators.js';

test('GCS calculates the minimum total', () => {
  const result = calculateGCS({ eye:1, verbal:1, motor:1 });
  assert.equal(result.status,'complete');
  assert.equal(result.total,3);
  assert.equal(result.notation,'E1 V1 M1');
});
test('GCS calculates the maximum total', () => {
  const result = calculateGCS({ eye:4, verbal:5, motor:6 });
  assert.equal(result.status,'complete');
  assert.equal(result.total,15);
  assert.equal(formatGCSResult(result),'ШКГ 15/15 (E4 V5 M6)');
});
test('GCS calculates a middle-range score', () => {
  const result = calculateGCS({ eye:3, verbal:4, motor:5 });
  assert.equal(result.total,12);
  assert.equal(result.notation,'E3 V4 M5');
});
test('GCS does not calculate a total while a component is missing', () => {
  const result = calculateGCS({ eye:4, verbal:5 });
  assert.equal(result.status,'incomplete');
  assert.equal(result.total,null);
});
test('GCS does not calculate a total when a component is not testable', () => {
  const result = calculateGCS({ eye:4, verbal:'NT', motor:6 });
  assert.equal(result.status,'not-testable');
  assert.equal(result.total,null);
  assert.deepEqual(result.notTestable,['verbal']);
});
test('GCS refuses out-of-range and fractional values', () => {
  assert.equal(calculateGCS({ eye:5, verbal:5, motor:6 }).status,'invalid');
  assert.equal(calculateGCS({ eye:3.5, verbal:5, motor:6 }).status,'invalid');
  assert.equal(calculateGCS({ eye:4, verbal:0, motor:6 }).status,'invalid');
});
test('GCS accepts numeric strings from form controls', () => {
  const result = calculateGCS({ eye:'4', verbal:'5', motor:'6' });
  assert.equal(result.total,15);
});

import {calculateMRS,calculateGOS,calculateRASS,MRS_OPTIONS,GOS_OPTIONS,RASS_OPTIONS} from '../assets/js/calculators.js';
test('mRS accepts all defined grades and rejects invalid values',()=>{for(const o of MRS_OPTIONS)assert.equal(calculateMRS(o.value).score,o.value);assert.equal(calculateMRS(7).status,'invalid');assert.equal(calculateMRS(2.5).status,'invalid');assert.equal(calculateMRS(null).status,'incomplete');});
test('GOS accepts all five outcome categories and rejects invalid values',()=>{for(const o of GOS_OPTIONS)assert.equal(calculateGOS(o.value).score,o.value);assert.equal(calculateGOS(0).status,'invalid');assert.equal(calculateGOS(6).status,'invalid');});
test('RASS covers the complete +4 to -5 range',()=>{assert.equal(RASS_OPTIONS.length,10);for(const o of RASS_OPTIONS)assert.equal(calculateRASS(o.value).score,o.value);assert.equal(calculateRASS(-6).status,'invalid');assert.equal(calculateRASS(4.5).status,'invalid');assert.equal(calculateRASS(undefined).status,'incomplete');});


import { calculateBMI, calculateBSA, calculateMAP, calculateABCD2 } from '../assets/js/calculators.js';

test('BMI uses kg and centimetres and rejects impossible input', () => {
  const result = calculateBMI(70, 175);
  assert.equal(result.status, 'complete');
  assert.ok(Math.abs(result.value - 22.8571428571) < 1e-9);
  assert.equal(calculateBMI(70, 0).status, 'invalid');
  assert.equal(calculateBMI(70, 251).status, 'invalid');
});
test('Mosteller BSA returns square metres', () => {
  const result = calculateBSA(70, 175);
  assert.equal(result.status, 'complete');
  assert.ok(Math.abs(result.value - Math.sqrt(175 * 70 / 3600)) < 1e-12);
  assert.equal(result.formula, 'Mosteller');
  assert.equal(calculateBSA(0, 175).status, 'invalid');
});
test('MAP computes the conventional approximation and validates pressure order', () => {
  const result = calculateMAP(120, 80);
  assert.equal(result.status, 'complete');
  assert.ok(Math.abs(result.value - 93.3333333333) < 1e-9);
  assert.equal(calculateMAP(80, 120).status, 'invalid');
  assert.equal(calculateMAP(120, '').status, 'invalid');
});
test('ABCD2 minimum score is zero', () => {
  const result = calculateABCD2({age:59,systolic:139,diastolic:89,features:'other',duration:'lt10',diabetes:'no'});
  assert.equal(result.status, 'complete');
  assert.equal(result.total, 0);
  assert.deepEqual(result.components, {age:0,bloodPressure:0,clinicalFeatures:0,duration:0,diabetes:0});
});
test('ABCD2 maximum score is seven', () => {
  const result = calculateABCD2({age:60,systolic:140,diastolic:90,features:'unilateral_weakness',duration:'ge60',diabetes:'yes'});
  assert.equal(result.status, 'complete');
  assert.equal(result.total, 7);
  assert.deepEqual(result.components, {age:1,bloodPressure:1,clinicalFeatures:2,duration:2,diabetes:1});
});
test('ABCD2 awards one point for speech disturbance without weakness', () => {
  const result = calculateABCD2({age:30,systolic:120,diastolic:80,features:'speech_without_weakness',duration:'10to59',diabetes:'no'});
  assert.equal(result.total, 2);
  assert.equal(result.components.clinicalFeatures, 1);
  assert.equal(result.components.duration, 1);
});
test('ABCD2 treats either systolic or diastolic threshold as elevated blood pressure', () => {
  assert.equal(calculateABCD2({age:30,systolic:140,diastolic:80,features:'other',duration:'lt10',diabetes:'no'}).components.bloodPressure, 1);
  assert.equal(calculateABCD2({age:30,systolic:130,diastolic:90,features:'other',duration:'lt10',diabetes:'no'}).components.bloodPressure, 1);
});
test('ABCD2 requires every field and rejects unsupported categories or invalid pressure', () => {
  assert.equal(calculateABCD2({}).status, 'incomplete');
  assert.equal(calculateABCD2({age:30,systolic:120,diastolic:80,features:'unknown',duration:'lt10',diabetes:'no'}).status, 'invalid');
  assert.equal(calculateABCD2({age:30,systolic:120,diastolic:80,features:'other',duration:'lt10',diabetes:'maybe'}).status, 'invalid');
  assert.equal(calculateABCD2({age:30,systolic:80,diastolic:90,features:'other',duration:'lt10',diabetes:'no'}).status, 'invalid');
});

test('ABCD2 rejects inherited object property names as unsupported options', () => {
  assert.equal(calculateABCD2({age:30,systolic:120,diastolic:80,features:'toString',duration:'lt10',diabetes:'no'}).status, 'invalid');
  assert.equal(calculateABCD2({age:30,systolic:120,diastolic:80,features:'other',duration:'constructor',diabetes:'no'}).status, 'invalid');
});

import { calculateEGFRCKDEPI2021, calculateCorrectedSodium, calculateOsmolarity, calculateAnionGap } from '../assets/js/calculators.js';

test('CKD-EPI 2021 gives expected adult eGFR for reference examples', () => {
  const female = calculateEGFRCKDEPI2021(60, 88.4, 'female');
  const male = calculateEGFRCKDEPI2021(60, 88.4, 'male');
  assert.equal(female.status, 'complete');
  assert.ok(Math.abs(female.value - 64.5) < 0.2);
  assert.ok(Math.abs(male.value - 86.2) < 0.2);
  assert.equal(calculateEGFRCKDEPI2021(17, 80, 'female').status, 'invalid');
  assert.equal(calculateEGFRCKDEPI2021(60, 80, 'other').status, 'invalid');
});
test('Corrected sodium exposes both Katz and Hillier coefficients', () => {
  assert.ok(Math.abs(calculateCorrectedSodium(130, 16.7, 1.6).value - 133.1714) < 0.01);
  assert.ok(Math.abs(calculateCorrectedSodium(130, 16.7, 2.4).value - 134.7571) < 0.01);
  assert.equal(calculateCorrectedSodium(130, 5.6, 1.6).value, 130);
  assert.equal(calculateCorrectedSodium(130, 3, 2.4).value, 130);
  assert.equal(calculateCorrectedSodium(130, 16, 2).status, 'invalid');
});
test('Calculated osmolarity uses SI mmol/L values', () => {
  const result = calculateOsmolarity(140, 5, 7);
  assert.equal(result.status, 'complete');
  assert.equal(result.value, 292);
  assert.equal(calculateOsmolarity(70, 5, 7).status, 'invalid');
});
test('Anion gap includes both measured and albumin-corrected values', () => {
  const result = calculateAnionGap(140, 104, 24, 20);
  assert.equal(result.status, 'complete');
  assert.equal(result.value, 12);
  assert.equal(result.albuminCorrected, 17);
  assert.equal(calculateAnionGap(140, 104, 24, 0).status, 'invalid');
});

import { calculateCPP } from '../assets/js/calculators.js';
test('CPP is calculated as MAP minus ICP without applying a treatment threshold', () => {
  assert.equal(calculateCPP(90, 20).value, 70);
  assert.equal(calculateCPP(65, 75).value, -10);
  assert.equal(calculateCPP(0, 10).status, 'invalid');
  assert.equal(calculateCPP(90, 151).status, 'invalid');
});
