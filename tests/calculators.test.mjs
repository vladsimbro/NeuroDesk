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
