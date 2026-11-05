import test from 'node:test';
import assert from 'node:assert/strict';
import { FAMILY_CONFIG, DEFAULT_CONTROLS, ENVIRONMENT_SPECS } from '../src/sim/config.js';

test('all four crane families have a dedicated scene and non-empty machine controls', () => {
  assert.deepEqual(Object.keys(FAMILY_CONFIG).sort(), ['crawler', 'mobile', 'overhead', 'tower']);
  for (const [kind, config] of Object.entries(FAMILY_CONFIG)) {
    assert.ok(config.title.length > 5, `${kind} title`);
    assert.ok(config.scene.length > 5, `${kind} scene title`);
    assert.ok(config.machine.length >= 3, `${kind} machine controls`);
    for (const [key, label, unit, min, max, step] of config.machine) {
      assert.ok(key && label && unit);
      assert.ok(Number.isFinite(min) && Number.isFinite(max) && min < max);
      assert.ok(Number.isFinite(step) && step > 0);
    }
  }
});

test('requested operator variables are present with the requested initial values', () => {
  assert.equal(DEFAULT_CONTROLS.boomAngle, 48);
  assert.equal(DEFAULT_CONTROLS.boomLength, 18);
  assert.equal(DEFAULT_CONTROLS.slew, 0);
  assert.equal(DEFAULT_CONTROLS.hookHeight, 7);
  assert.equal(DEFAULT_CONTROLS.load, 16);
  assert.equal(DEFAULT_CONTROLS.rigging, 1.9);
  assert.equal(DEFAULT_CONTROLS.wind, 25);
  assert.equal(DEFAULT_CONTROLS.area, 23);
  assert.equal(DEFAULT_CONTROLS.windDir, 90);
});

test('environment controls include ground, mat, level, sling angle and simulation speed', () => {
  const keys = ENVIRONMENT_SPECS.map(spec => spec[0]);
  for (const key of ['load', 'rigging', 'wind', 'windDir', 'gustMultiplier', 'area', 'loadCoGOffset', 'ground', 'mat', 'outOfLevel', 'slingAngle', 'slopeDirection', 'swingDamping', 'simulationSpeed']) {
    assert.ok(keys.includes(key), `missing ${key}`);
  }
});

test('each crane family exposes its characteristic motion controls', () => {
  const keys = Object.fromEntries(Object.entries(FAMILY_CONFIG).map(([kind, config]) => [kind, config.machine.map(spec => spec[0])]));
  for (const key of ['boomAngle', 'boomLength', 'slew', 'hookHeight']) assert.ok(keys.mobile.includes(key));
  for (const key of ['trolley', 'slew', 'hookHeight']) assert.ok(keys.tower.includes(key));
  for (const key of ['boomAngle', 'boomLength', 'slew', 'travelX']) assert.ok(keys.crawler.includes(key));
  for (const key of ['bridgeX', 'trolley', 'hookHeight']) assert.ok(keys.overhead.includes(key));
});
