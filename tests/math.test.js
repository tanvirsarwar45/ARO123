import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateWindForce, stepPendulum, trainingRiskIndex } from '../src/sim/math.js';

test('wind force estimate is zero at zero wind and increases quadratically',()=>{
  assert.equal(estimateWindForce({speed:0,area:10}),0);
  const a=estimateWindForce({speed:5,area:10});
  const b=estimateWindForce({speed:10,area:10});
  assert.ok(Math.abs(b/a-4)<1e-9);
});

test('pendulum integration remains finite and responds to wind acceleration',()=>{
  const p={angleX:0,angleZ:0,velocityX:0,velocityZ:0};
  for(let i=0;i<600;i++)stepPendulum(p,1/60,{length:3,windAccel:1,damping:.24});
  for(const v of Object.values(p))assert.ok(Number.isFinite(v));
  assert.ok(Math.abs(p.angleX)>0.01);
});

test('training risk indicator is positive and increases with load',()=>{
  const base={riggingTonnes:1,radius:10,windForceN:100,baseMassTonnes:50,supportHalfWidth:3,counterweightTonnes:10};
  const low=trainingRiskIndex({...base,loadTonnes:2});
  const high=trainingRiskIndex({...base,loadTonnes:8});
  assert.ok(low>0 && high>low);
});

test('training moment ratio increases with payload and decreases with support width', async () => {
  const { calculateTrainingMoment } = await import('../src/sim/math.js');
  const base = { riggingTonnes: 1, radiusM: 12, windForceN: 1000, windHeightM: 10, baseMassTonnes: 48, counterweightTonnes: 25, supportEdgeM: 2.5 };
  const low = calculateTrainingMoment({ ...base, payloadTonnes: 8 });
  const high = calculateTrainingMoment({ ...base, payloadTonnes: 25 });
  const wide = calculateTrainingMoment({ ...base, payloadTonnes: 8, supportEdgeM: 3.5 });
  assert.ok(high.ratio > low.ratio);
  assert.ok(wide.ratio < low.ratio);
});
