# Final audit — Crane Training Lab 0.3.1

Audit date: 2026-11-06
Scope: source-level inspection, Node syntax checks, unit tests and dependency/build availability.

## Audit outcome
**Status: prototype package passes source syntax and included unit tests; production build and visual browser QA are pending.**

### Checks performed
- Node.js runtime available in audit environment: v22.16.0.
- JavaScript syntax check (`node --check`) completed for `src/main.js` and all `src/sim/*.js` files: PASS.
- Built-in Node test suite: 7/7 PASS.
- Numeric control clamp/step tests (4 cases): PASS
- Wind force estimate: zero wind produces zero force; doubling wind speed produces four times the estimate: PASS.
- Pendulum integrator: finite state and non-zero response under wind acceleration: PASS.
- Training risk indicator: positive and monotonic with payload for fixed other inputs: PASS.

### Adjustable controls added in 0.3.1
- All visible crane and environment parameters have synchronized range sliders, editable numeric fields, and explicit minus/plus buttons.
- Numeric values are clamped to each control range and snapped to its configured increment.
- Scenario changes, fault injection, recovery and reset synchronize the displayed controls.
- Mobile crane controls include outrigger spread and counterweight; crawler controls include counterweight.

### Build limitation
`npm install --no-audit --no-fund` timed out in the build environment, so Vite bundling and an automated browser smoke test could not be completed here. The project includes Vite and Three.js dependencies in `package.json`; install them on a network-enabled Windows machine using `npm install`, then run `npm run build`.

### Known issues / limitations
- No manufacturer-authorized CAD assets or real crane model datasets are included.
- Generic geometry is procedural and not a dimensionally verified crane replica.
- Four crane family scenes exist, but their motion models are simplified; they are not complete machine simulations.
- Wind particles are a visual field. Wind-force calculation is a simplified training estimate, not an approved wind load calculation.
- Load swing is a damped pendulum training model; cable elasticity, reeving, sheave losses and full multibody coupling are not modeled.
- Tipping/fault animations are training-event logic, not real crane failure prediction. The training risk indicator is not a rated-capacity or stability result.
- Hydraulic circuit, structural analysis, fatigue, certified ground reaction, manufacturer LMI/RCL behavior and regulatory certification are not implemented.
- No backend, account system, session database or multiplayer service is included in this frontend prototype.

### Release recommendation
Suitable for internal visual review and early operator-training interaction feedback only. Not suitable for real lift planning, crane selection, safe working load determination, safety device validation, operator certification or commercial claims of standards compliance.

### Required sign-offs before industry release
- Manufacturer data and asset rights review.
- Crane mechanical and structural engineering review.
- Hydraulic and hoisting specialist review.
- Crane operator / instructor validation.
- Safety professional review.
- Independent verification of load chart, stability, ground support and safety-device logic.
- Browser performance, accessibility, security and regression test reports.
