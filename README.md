# Crane Training Lab 0.4.0

A modular browser-based 3D crane operator training prototype built with Vite, Three.js and TypeScript-friendly JavaScript modules.

## What changed in 0.4.0

- Fixed crane-family initialization: the selected dropdown value now determines the initial 3D model, model title and matching controls.
- Fixed the blank operator console by rendering controls from the active family configuration rather than re-reading a potentially stale DOM selection.
- Restored the requested mobile-crane starting variables: boom angle 48°, boom length 18 m, slew 0°, hoist rope payout 7 m, payload 16.0 t, rigging 1.9 t, wind 25.0 m/s, projected load area 23.0 m² and wind direction 90°.
- Every visible variable has a slider, editable numeric field, and explicit minus/plus buttons.
- Added press-and-hold operator jog controls. Hoist, slew, boom, telescope, trolley, bridge and crawler travel jog rates use their respective speed-command variables.
- Added dedicated crane-family controls for mobile, tower, crawler and overhead/gantry cranes.
- Added wind-direction-correct particle flow and two-axis pendulum response, transient gusts, obstacle/clearance zones, ground-support training response, support-mat geometry and sling-tension estimate.
- Added distinct family geometry: mobile carrier with outriggers and telescopic boom; braced tower mast and jib with trolley; crawler tracks and lattice boom; overhead bridge, runway, trolley and hoist.
- Added reset behavior that restores the selected crane family and its defaults.

## Requirements

- Node.js 20 LTS or newer (Node 22 recommended)
- npm 10+
- Current Chrome or Edge with WebGL 2
- Network access during `npm install` to fetch Vite and Three.js packages

## Run on Windows PowerShell

Open PowerShell in the folder that contains `package.json`. Do not `cd crane_training_lab` if the prompt already ends in that folder.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Tests and production build

```powershell
npm test
npm run build
npm run preview
```

`npm test` uses Node's built-in test runner and can run without installing frontend dependencies. `npm run build` requires `npm install` to complete successfully.

## Operator controls

### Mobile hydraulic
- Boom angle, boom length, slew angle, hoist rope payout
- Outrigger extension, counterweight
- Hoist, slew, boom-luffing and telescope speed commands

### Tower
- Trolley radius/travel, hoist rope payout, slew angle
- Hoist, slew and trolley speed commands

### Crawler
- Boom angle, lattice-boom length, slew angle, hoist rope payout
- Counterweight, crawler travel position
- Hoist, slew, travel, boom and telescope speed commands

### Overhead / gantry
- Bridge travel, trolley travel, hoist rope payout
- Hoist, bridge and trolley speed commands

### Shared environment and load inputs
- Payload and rigging mass
- Wind speed, wind direction, gust multiplier and projected load area
- Load center-of-gravity offset
- Training ground strength index, support pad/foundation width, out-of-level input and ground slope direction
- Sling angle, swing damping and simulation speed

Every control is synchronized across its slider, numeric field and minus/plus buttons. Press and hold the operator jog buttons for continuous motion; click once for a single step. Keyboard: mobile/crawler `W/S` boom angle, `Q/E` boom extension, `A/D` slew, arrows hoist; tower `Q/E` trolley, `A/D` slew, arrows hoist; overhead `A/D` bridge, `Q/E` trolley, arrows hoist.

## Architecture

- `src/main.js`: dashboard, family selection, dynamic control rendering, jog actions, events and training UI.
- `src/sim/Simulation.js`: Three.js world, environment, wind particles, pendulum, generic training moment response, fault animations and telemetry.
- `src/sim/cranes.js`: procedural geometry and family-specific kinematics.
- `src/sim/config.js`: family control schema and requested default values.
- `src/sim/math.js`: isolated educational physics functions.
- `src/sim/controlValues.js`: numeric clamping and step logic.
- `tests/`: automated unit and configuration tests.
- `docs/`: architecture, changelog and audit record.

## Important engineering boundary

This project is an advanced interactive training prototype. Crane dimensions and masses are generic assumptions. The wind force is a simplified drag estimate; load swing is a damped two-axis pendulum; tipping is a generic moment-balance training model; ground pressure is an average-footprint estimate; sling tension assumes a symmetric two-leg sling. These are not manufacturer-approved calculations.

No manufacturer load charts, certified rated-capacity limiter (RCL/LMI), approved stability solver, verified outrigger reaction solver, hydraulic circuit model, structural finite-element model, wire-rope fatigue model or regulatory operator certification is included. Do not use this software for real lifting decisions, lift plans, crane selection, rated capacity, safety-device validation or operator certification.
