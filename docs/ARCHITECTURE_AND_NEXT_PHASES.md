# Architecture and implementation roadmap — Crane Training Lab 0.3

## Product boundary
This release is an advanced interactive operator-training prototype. It is not a certified simulator, lift-planning tool, manufacturer digital twin, rated-capacity system, or operator qualification system.

## Runtime architecture
- Vite serves a modular ES-module application in development and creates a static production bundle.
- Three.js owns rendering, lighting, shadows, scene graph, procedural crane geometry and camera controls.
- `CraneSimulation` owns the fixed scene lifecycle, animation loop, environmental particles, simplified load dynamics, training event injection and telemetry.
- `cranes.js` provides separate kinematic scene builders for mobile hydraulic, tower, crawler and overhead/gantry crane families.
- `math.js` isolates the explicitly training-only wind-force estimate, damped pendulum integrator and heuristic risk indicator.
- `main.js` owns dashboard controls, scenarios, session event log and visible validation disclosures.

## What changed from the prior screenshot/prototype
1. Replaced the bare grid-only backdrop with an industrial jobsite: warehouse bays, glazing, container stacks, site road, safety cones, lighting and trees.
2. Added a moving wind-particle field and directional arrow tied to wind speed and direction inputs.
3. Added a suspended hook block, cable and two sling legs as separate moving objects.
4. Added wind- and support-acceleration-driven pendulum training motion.
5. Added instructor fault injection: gust, ground failure, overload and boom fault. The event thresholds are deliberately labeled as training triggers, not real failure limits.
6. Reworked the dashboard with a dark slate / amber / mint palette, live telemetry, event log, family-specific controls, scenarios and an audit panel.
7. Split code into modules and added automated unit tests.

## Crane-family model scope in this release
- Mobile hydraulic: carrier, axles/wheels, outriggers/pads, rotating upper, counterweight, cabin, telescopic boom sections and hoist line.
- Tower: mast lattice, rotating machinery deck, jib, counter-jib, trolley and hoist line.
- Crawler: crawler base, track assemblies, upper structure and lattice boom.
- Overhead/gantry: runway legs, bridge girders, bridge travel, trolley and hoist line.

These are generic procedural training assets, not dimensionally faithful replicas of a manufacturer's model. The crane-family scenes share the renderer and training shell but do not share a universal load chart or certified stability method.

## Next engineering modules
### 1. Asset pipeline
- Acquire licensed CAD/BIM or manufacturer-authorized 3D assets.
- Convert to GLB/GLTF with correct units, origin, pivot locations, hierarchy, PBR materials and collision proxies.
- Add asset metadata: manufacturer, model, variant, serial applicability, source, revision, unit system, review status and rights status.
- Add automated mesh checks: watertightness where required, normals, scale, pivot checks, LOD and triangle budgets.

### 2. Kinematics and motion
- Replace generic control mappings with per-model control maps.
- Implement joint constraints, telescoping sequence, reeving topology, travel envelopes, slew/trolley limits and brake states.
- Add actuator speed, acceleration, jerk and deadman behavior from verified training source data.
- Add state-machine-based start, run, stop, hold, emergency-stop and recovery states.

### 3. Dynamics
- Add a validated multibody dynamics approach for each family.
- Model load pendulum in 3D, rope length changes, damping, support-point acceleration, wind drag, contact and collision.
- Model track/wheel contact, outrigger contact, bridge/trolley travel and tower crane motion separately.
- Implement tipping and structural failure only as scenario-specific training events until validated models and data exist.

### 4. Hydraulics and hoisting
- Hydraulic pump/valve/cylinder circuit models, chamber pressures, flow, rod-side area, relief valves, leakage and hose-failure events.
- Hoist drum, reeving topology, sheave efficiency, rope elasticity, line pull, brake holding and overspeed events.
- Rope strength/fatigue/inspection state only from validated component data; otherwise keep as instructor-set defect scenarios.

### 5. Engineering calculation services (disabled until approved)
- Manufacturer load-chart parser with configuration dimensions and applicability constraints.
- Exact configuration resolver: boom/jib, counterweight, outrigger extension, sector, reeving, hook block, tires/tracks, support mode and serial range.
- Ground support reactions and soil/mat assessment based on approved method and actual geometry.
- Stability, structural load combinations, boom deflection and wind limits based on manufacturer and applicable standard requirements.
- Calculation provenance on every result: input snapshot, source revision, method revision, software version, reviewer and timestamp.
- Fail-closed behavior: missing, ambiguous, stale or unsupported configurations produce `NOT AVAILABLE`, never a guessed capacity.

### 6. Safety device emulation
- LMI/RCL, anti-two-block, boom angle/length/radius, slew/trolley limits, wind instrument, level indicator, outrigger sensors and interlocks.
- Model-specific state logic, alarm priorities, motion cut-outs, bypass/override rules and fault states.
- Validate each emulation against the exact device/manual revision. A generic warning is not a manufacturer safety device.

### 7. Training system
- Instructor authoring, lesson objectives, trainee profiles, scenario versioning, observation checklist, rubric, replay and event timeline.
- Scoring rubric is configurable and reviewed by training specialists; no claim of statutory certification.
- Add signaller/rigger role, radio/hand signal drills, blind lifts, tandem lifts and multi-crane coordination.

## Data model requirements
Core entities: Manufacturer, Model, Variant, SerialApplicability, CraneAsset, Configuration, Component, ControlMap, LoadChart, LoadChartCell, TechnicalDocument, SafetyDevice, SafetyRule, Scenario, ScenarioRevision, Trainee, Instructor, Session, StateSample, Event, Assessment, ValidationCase, Approval and AuditLog.

Every engineering document and data row must record source, revision, effective date, applicable market, serial range, units, permission/licence, reviewer and approval status.

## Validation gates
1. Asset gate: geometry dimensions, mass properties, coordinate system and joints checked against approved technical drawings.
2. Kinematics gate: independent reference poses and motion limits checked for each supported configuration.
3. Dynamics gate: convergence, timestep sensitivity, energy behavior, damping and collision response checked against analytic/reference cases.
4. Wind gate: force estimate units, direction, exposed area, drag assumptions and wind field behavior tested; no operating limit inferred from this alone.
5. Load chart gate: all chart breakpoints, configuration branches and forbidden regions tested; no extrapolation beyond approved source data.
6. Stability gate: support reactions and overturning calculations independently reviewed and compared with approved reference cases.
7. Safety gate: alarm/interlock truth tables tested against device-specific manuals.
8. Training gate: crane operators and instructors review scenarios and scoring.
9. Release gate: traceability, regression suite, performance, accessibility, security, recovery and documentation signed off.

## Performance targets to validate
- 60 FPS target on defined desktop GPU at 1080p with one crane and moderate scene density.
- Simulation update target 60 Hz with fixed-step integration and bounded catch-up.
- No UI blocking during simulation.
- Session events and instructor interventions timestamped.
- Responsive desktop-first operator layout; tablet layout as secondary.
- Browser compatibility matrix recorded per release.

These are targets, not measured results for this release.


## Version 0.3.1 control UX correction
All operating inputs are now rendered as a slider plus numeric input and explicit -/+ step buttons. The browser event handlers delegate from stable control containers so they continue working when a crane-family switch rebuilds the controls. The same state is used by the simulation engine and displayed input widgets.
