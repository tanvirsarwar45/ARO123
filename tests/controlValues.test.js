import test from 'node:test';
import assert from 'node:assert/strict';
import { clampControlValue, stepControlValue } from '../src/sim/controlValues.js';

test('numeric control clamps values to its configured range', () => {
  assert.equal(clampControlValue(99, 0, 10, 0.5), 10);
  assert.equal(clampControlValue(-2, 0, 10, 0.5), 0);
});

test('numeric control snaps values to the configured step', () => {
  assert.equal(clampControlValue(1.26, 0, 10, 0.1), 1.3);
  assert.equal(clampControlValue(1.24, 0, 10, 0.1), 1.2);
});

test('plus and minus controls move by exactly one step', () => {
  assert.equal(stepControlValue(2, 1, 0, 5, 0.5), 2.5);
  assert.equal(stepControlValue(2, -1, 0, 5, 0.5), 1.5);
});

test('plus and minus controls stop at their boundaries', () => {
  assert.equal(stepControlValue(5, 1, 0, 5, 1), 5);
  assert.equal(stepControlValue(0, -1, 0, 5, 1), 0);
});
