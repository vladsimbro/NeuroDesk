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
