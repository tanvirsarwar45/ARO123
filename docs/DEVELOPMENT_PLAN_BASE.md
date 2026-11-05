# Crane Training Lab v2 — Development and validation plan

## 1. Product boundary

This release is an advanced interactive 3D training prototype with four selectable crane-family scenes. It is not an industry-certified simulator, manufacturer digital twin, lift-planning tool, or substitute for an operator qualification program. The current scene geometry is procedural. The application intentionally does not calculate rated capacity, tipping reserve, outrigger reactions, allowable ground pressure, or an operator pass/fail score.

## 2. Architecture target

Use a plug-in architecture. The shell owns rendering, input routing, training sessions, scenario orchestration and audit logs. Each crane family implements its own kinematics, configuration schema, control mapping, motion limits and validation suite.

```text
Web application shell
  ├── 3D renderer / camera / scene graph
  ├── Input adapter (keyboard, mouse, joystick, virtual controls)
  ├── Simulation clock + deterministic fixed-step scheduler
  ├── Training scenario + instructor tools
  ├── Session recorder / replay / analytics
  ├── Data registry (source, revision, approval, applicability)
  └── Crane family plug-ins
       ├── Mobile hydraulic
       ├── Tower
       ├── Crawler lattice
       └── Overhead / gantry
            Each plug-in: kinematics, dynamics, controls,
            constraints, sensors, safety-device adapter, tests
```

Recommended production separation:
- **Presentation:** Three.js / React Three Fiber; visual meshes must not be the source of engineering truth.
- **Kinematics:** typed, deterministic family-specific state update; fixed time step and unit tests.
- **Dynamics:** separate solver for suspended loads, rope constraints, trolley/bridge motion and contact.
- **Engineering:** independent calculation services consuming approved model data; fail closed when required inputs are absent.
- **Safety logic:** manufacturer-specific state machines, distinct from warning presentation.
- **Data:** PostgreSQL model registry plus immutable revisioned technical documents and chart data in object storage.
- **Training:** scenario definitions, instructor events, assessment rubric and immutable session event stream.

## 3. Family-specific implementation modules

### Mobile hydraulic
- Carrier/chassis, axle and tire geometry; upperworks slew; telescopic boom section sequence; luffing cylinder geometry; hook/winch/reeving; outriggers and mats; counterweight variants; permitted lifting sectors and support modes.
- Add model-specific chart keying by boom length, radius, boom/jib configuration, counterweight, outrigger extension, sector, reeving and other chart conditions.

### Tower
- Mast sections, foundation/tie configuration, jib and counter-jib, trolley rail, trolley drive, hoist, slewing ring, climbing configuration, tower height and out-of-service weather configuration.
- Add tower structural configuration and multiple-crane/obstacle envelope training.

### Crawler lattice
- Track contact geometry, carbody and counterweights, lattice boom section topology, pendant/derrick/superlift configurations, hoist systems, travel constraints and ground interaction.
- Separate lifting-on-tracks and travel-with-load rules by exact manufacturer configuration.

### Overhead / gantry
- Bridge span/girders, end carriages, wheels/rails, trolley, hoist, end stops, runway geometry, skew and wheel-load behavior, duty class and brake models.
- Model bridge travel, cross travel and hoist as independent axes with collision envelopes.

## 4. Missing engineering modules (not implemented in v2)

1. **Manufacturer configuration registry:** serial applicability, market/year, options, dimensions, mass properties, configuration dependencies, source citations, revision history, engineering approval.
2. **Rated capacity engine:** exact chart lookup, chart-condition validation, chart row/column semantics, manufacturer-prescribed deductions, no unsupported extrapolation, explicit `UNKNOWN` result when chart coverage is missing.
3. **Stability and support solver:** machine-specific support polygon, center of gravity, load moment, support reactions, outrigger geometry, track/wheel reactions, level tolerance, dynamic load cases and ground bearing methodology.
4. **Structural model:** boom/girder stress, deflection, buckling, fatigue/duty cycle and load combinations, using a validated beam/FE model or manufacturer-supplied envelopes.
5. **Hydraulic system:** pump/valve/cylinder models, pressure/flow, piston/annular areas, relief settings, leakage/failure modes and temperature/viscosity effects as required by fidelity.
6. **Hoist and rope system:** rope construction and MBL/WLL source, reeving topology, sheave efficiency, drum layers, fleet angle, rope mass, brake and line-pull model, hook block and attachment masses.
7. **Load/rigging dynamics:** nonlinear pendulum, multi-leg sling load sharing, spreader beams, flexible ropes, damping, wind loading and tandem-lift coordination.
8. **Safety-device emulation:** LMI/RCL, anti-two-block, boom/trolley/hoist limits, overload logic, outrigger sensing, level sensors, alarms and motion-inhibiting interlocks, all from approved device/model documentation.
9. **Collision and hazard engine:** boom/load/rigging envelopes, building/powerline exclusion zones, multiple cranes, operator visibility and signal-person communications.
10. **Instructor/assessment backend:** roles, lesson plans, scenario editor, events, rubrics, audit trail, replay, report export and accessibility support.

## 5. Data model required before engineering claims

Every technical datum must carry:
- manufacturer, exact model, variant, serial-number applicability, market and production year;
- units and coordinate convention;
- value/table/file and source document/page/section;
- source revision, retrieval date, rights/licence status;
- engineering reviewer, approval status and effective date;
- uncertainty/tolerance and operating assumptions where applicable.

Load charts must be stored as structured, traceable source data, not transcribed from screenshots without independent checking. Preserve original source files and checksums. A model is not selectable for engineering mode until required data are complete and approved.

## 6. Validation requirements and release gates

### Gate A — geometry and kinematics
- Compare all pivot points, dimensions, motion ranges and configuration combinations against manufacturer drawings/manuals.
- Test end stops, telescoping sequence, trolley travel, slew range, hook path and collision envelopes.
- Pass criteria: tolerances approved by the responsible engineering reviewer; no guessed dimensions.

### Gate B — physics
- Unit-test force, moment, coordinate transforms, rope lengths, pendulum response and contact constraints with independently calculated reference cases.
- Test convergence across fixed-step sizes and frame-rate variation; simulation must be deterministic for replay.
- Compare dynamic response with accepted reference data or a separately validated solver.

### Gate C — rated capacity and stability
- Test every chart breakpoint and all chart conditions/configurations against the source chart.
- No extrapolation beyond source coverage. Missing, stale or mismatched chart data must return `NOT_CONFIGURED`, never a numeric capacity.
- Independently verify support reactions, stability and ground bearing against approved calculation examples and qualified engineer review.

### Gate D — safety devices
- Build state-transition tests for each alarm, limit and interlock, including sensor fault, stale input, conflicting input, emergency stop and reset behavior.
- Confirm warning vs motion inhibition behavior against the exact machine/device documentation.

### Gate E — training product
- Have qualified operators/instructors review control mapping, scenarios, feedback, failure events and assessment rubric.
- Separate training completion from any legally recognized certification. Obtain formal approval from relevant bodies if certification claims are intended.

### Gate F — software quality
- Unit, integration, regression, browser, accessibility, load/performance, security and recovery tests.
- Record software version, model-data revision and solver version with every session.

## 7. Recommended work breakdown

### Workstream 1 — simulation platform
- Refactor current single HTML module into TypeScript packages.
- Add fixed-step simulation clock, event bus, deterministic state snapshots and replay.
- Add typed `CraneFamilyPlugin` interface and per-family state/control schemas.

### Workstream 2 — four family plug-ins in parallel
- Assign one mechanical/controls engineer and one 3D/real-time developer per family.
- First deliver kinematics and geometry only; do not expose capacity claims.
- Build family-specific controls and motion-envelope tests.

### Workstream 3 — approved model data
- Obtain licensed technical documents and exact 3D/dimensional data.
- Build data ingestion, validation, revision and approval workflow.
- Do not use a generic or interpolated chart as a manufacturer chart.

### Workstream 4 — engineering solvers
- Implement and independently verify chart lookup, support/stability, structural, hydraulic, rope and load-dynamics modules.
- Require reviewer sign-off before a solver output is exposed in a training assessment.

### Workstream 5 — training and deployment
- Scenario authoring, instructor console, trainee accounts, event logging, replay, report generation and LMS integration if required.
- Pilot with qualified trainers; log defects and corrective actions.

## 8. Acceptance criteria for the next release

- User can switch among all four crane families without page reload.
- Each family exposes only its relevant motion controls.
- Crane mechanisms, trolley/bridge travel, hook and suspended load visibly respond to controls.
- Camera orbit, pan, zoom, pause and reset work.
- Training scenarios update payload/environment and show a clear objective.
- Session summary identifies family, inputs and duration.
- Rated capacity, stability, ground pressure and certification remain explicitly unavailable until validated model data and solvers pass the release gates.
