# Changelog 0.4.0

## User-reported defects addressed

1. The crane selector could display a restored family while the 3D scene remained initialized as a mobile crane. Initialization now reads the actual selected family and constructs the matching model, title and controls.
2. The operator console could be blank or mismatched. Control lookup now uses an explicit `activeKind` state and family configuration map. Rendering errors surface in a visible boot-error panel.
3. The requested operator variables are restored as defaults for mobile crane training: boom angle 48°, boom length 18 m, slew 0°, hoist payout 7 m, payload 16.0 t, rigging 1.9 t, wind 25.0 m/s, load projected area 23.0 m² and wind direction 90°.
4. Slider, numeric input and minus/plus buttons are generated for every visible parameter.

## Added

- Press-and-hold jog buttons with speed-command-driven movement rates.
- Family-specific quick actions and keyboard mappings.
- Mobile outrigger and counterweight controls.
- Tower trolley and slew controls.
- Crawler boom, counterweight, track travel and track-width controls.
- Overhead bridge and trolley controls.
- Adjustable support pad/foundation width for each family.
- Wind vector particle streaks, direction-aware pendulum input and gust pulse.
- Generic moment-balance tip-over training response for mobile, crawler and tower cranes.
- Ground support pressure estimate and training ground settlement response.
- Overhead girder deflection visualization for overload/boom-fault training events.
- Sling angle and idealized two-leg sling tension estimate.
- Virtual obstacle/clearance zones and training warnings.
- Industrial site geometry: warehouses, container yard, road markings, fence, lights, utility-line zone, trees and sky/cloud layers.

## Fixed

- Family-specific crane geometry is rebuilt when the selected family changes.
- Model title and machine control set update together.
- Family defaults are applied before the new model's first physics update.
- Crane tip transform pivots around the modeled support edge rather than rotating only around the crane origin.
- Wind direction is decomposed consistently into two horizontal pendulum axes.
- Reset clears ground settlement, boom fault, tip rotation and lowered outrigger pads.
- Crawler lattice boom length and crawler travel position affect the model.

## Validation

- Node syntax checks: pass for application, simulation, crane geometry, config and tests.
- Node test suite: 12/12 pass.
- Vite production build: not run; package installation timed out in the build environment.
- Browser visual QA: not run in this environment. User should verify all four family switches after `npm install` and `npm run dev`.

## Known limits

All physics and failure thresholds remain generic training assumptions. No manufacturer-approved dimensions, mass properties, load charts, safety device logic or certified calculations are provided.
- Added wind gust multiplier, load center-of-gravity offset, ground slope direction, swing damping, two-leg sling tension estimate and a virtual ground-contact boundary for the suspended load.

- Expanded environment controls: gust multiplier, load COG offset, ground slope direction and swing damping.
- Added load-to-ground contact clamp and event logging.
