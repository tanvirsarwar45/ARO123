# Changelog 0.3.1 - visible adjustable controls

## Fixed
- Added visible minus and plus step buttons to every displayed operating parameter.
- Added editable numeric inputs alongside each range slider.
- Kept slider, numeric input and simulation state synchronized.
- Added bounds checking and step snapping to prevent invalid values.
- Fixed numeric-entry behavior for negative values such as slew angle by applying typed values on change/Enter rather than clamping each keystroke.
- Added mobile crane outrigger spread and counterweight controls.
- Added crawler crane counterweight control and corresponding generic visual mass adjustment.
- Synchronized controls after family changes, scenarios, injected faults, recovery and reset.

## Validation
- `npm test`: 7 tests passed.
- `node --check` on main, simulation, crane, utility and test JavaScript files: passed.
- Vite production build and browser visual test remain pending because dependency installation timed out in the build environment.

## Engineering scope warning
All crane geometry and physics remain generic training approximations. No manufacturer load charts, certified stability results, approved operating limits or safety-device logic are supplied.
