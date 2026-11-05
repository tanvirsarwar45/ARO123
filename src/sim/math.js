export const G = 9.80665;
export const AIR_DENSITY = 1.225;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const deg = d => d * Math.PI / 180;
export const lerp = (a, b, t) => a + (b - a) * t;

// Educational aerodynamic estimate only; not a design wind load or operating limit.
export function estimateWindForce({ speed, area, drag = 1.2, airDensity = AIR_DENSITY }) {
  return 0.5 * airDensity * drag * Math.max(0, area) * Math.max(0, speed) ** 2;
}

// Semi-implicit Euler integration of a damped, two-axis simple pendulum.
// This is a training visual model, not a wire-rope / reeving dynamics solver.
export function stepPendulum(state, dt, { length, windAccel = 0, supportAccel = 0, crosswindAccel = 0, crossSupportAccel = 0, damping = 0.18 }) {
  if (!(dt > 0)) return state;
  const L = Math.max(0.5, length);
  const ax = -(G / L) * Math.sin(state.angleX) - damping * state.velocityX + (windAccel - supportAccel) / L;
  const az = -(G / L) * Math.sin(state.angleZ) - damping * state.velocityZ + (crosswindAccel - crossSupportAccel) / L;
  state.velocityX += ax * dt;
  state.velocityZ += az * dt;
  state.angleX += state.velocityX * dt;
  state.angleZ += state.velocityZ * dt;
  return state;
}

// Transparent training-only moment model using generic masses and support geometry.
// Never interpret this as an approved stability or rated-capacity calculation.
export function calculateTrainingMoment({
  payloadTonnes, riggingTonnes, hookTonnes = 0.3, radiusM,
  windForceN = 0, windHeightM = 0, baseMassTonnes,
  counterweightTonnes = 0, supportEdgeM, counterweightArmM = 2.2,
  supportLoss = 1
}) {
  const support = Math.max(0.25, supportEdgeM * clamp(supportLoss, 0.1, 1));
  const liftedMass = Math.max(0, payloadTonnes + riggingTonnes + hookTonnes);
  const overturningNm = liftedMass * 1000 * G * Math.max(0, radiusM - support)
    + Math.max(0, windForceN) * Math.max(0, windHeightM);
  const restoringNm = Math.max(0, baseMassTonnes) * 1000 * G * support
    + Math.max(0, counterweightTonnes) * 1000 * G * (support + counterweightArmM);
  const ratio = restoringNm > 0 ? overturningNm / restoringNm : Infinity;
  return { supportEdgeM: support, liftedMassTonnes: liftedMass, overturningNm, restoringNm, ratio, netOverturningNm: overturningNm - restoringNm };
}

// Old generic ratio retained only for compatibility with earlier unit tests.
export function trainingRiskIndex({ loadTonnes, riggingTonnes, radius, windForceN, baseMassTonnes, supportHalfWidth, counterweightTonnes = 0 }) {
  const result = calculateTrainingMoment({
    payloadTonnes: loadTonnes, riggingTonnes, radiusM: radius, windForceN,
    windHeightM: 5, baseMassTonnes, supportEdgeM: supportHalfWidth,
    counterweightTonnes
  });
  return result.ratio;
}
