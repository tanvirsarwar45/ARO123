# Crane Training Lab 0.4.0 — architecture

## Runtime flow

1. The dashboard reads the selected crane family before constructing the scene.
2. `FAMILY_CONFIG` defines the family-specific control schema; `ENVIRONMENT_SPECS` defines shared load/environment controls.
3. Every control row renders a range slider, numeric entry and explicit step buttons from the same schema.
4. Control events update one shared simulation state. The Three.js simulation consumes that state on the next animation frame.
5. `createCrane` builds the selected family geometry; `updateCrane` applies that family's kinematics.
6. The simulation computes training-only wind, pendulum, support and moment indicators, then updates the suspended load, wind field and training event telemetry.

## Family modules

- Mobile hydraulic: carrier chassis, wheels, outriggers, pads, rotating upper, counterweight, cab, telescopic boom and visual hydraulic ram.
- Tower: foundation pad, braced mast, rotating upper, main jib, counter-jib ballast and trolley.
- Crawler: track groups, rotating upper, counterweight, lattice boom and travel position.
- Overhead/gantry: runway columns, runway girders, bridge, trolley and hoist.

## Physics boundaries

The simulation currently includes:

- Simplified aerodynamic force estimate: `F = 0.5 * rho * Cd * A * V^2`.
- Two-axis damped simple pendulum integration.
- Generic moment-balance model for visual tip-over training events.
- Average support-footprint pressure estimate.
- Idealized symmetric two-leg sling tension estimate.
- Training event effects for wind gust, support settlement, overload and boom/girder faults.

These are explicitly educational models. They do not represent certified engineering calculations, actual LMI/RCL behavior, manufacturer limits, a complete multibody solver, structural FEA or a validated hydraulic system.

Additional adjustable training variables include gust multiplier, load center-of-gravity offset, ground slope direction and pendulum damping. The cargo body is prevented from passing through the virtual ground plane; a ground-contact event is logged. A COG offset beyond the configured illustrative sling span triggers a rigging warning.
