export const FAMILY_CONFIG = {
  mobile: {
    title: 'Generic mobile hydraulic crane',
    scene: 'Mobile hydraulic crane · lift practice',
    machine: [
      ['boomAngle', 'Boom angle', '°', 20, 80, 0.5],
      ['boomLength', 'Boom length', 'm', 8, 35, 0.1],
      ['slew', 'Slew angle', '°', -180, 180, 1],
      ['hookHeight', 'Hoist height / rope payout', 'm', 0.8, 16, 0.1],
      ['outriggerSpread', 'Outrigger extension', '%', 60, 135, 1],
      ['counterweight', 'Counterweight', 't', 0, 30, 0.5],
      ['hoistSpeed', 'Hoist speed command', 'm/s', 0, 1.5, 0.05],
      ['slewSpeed', 'Slew speed command', 'rpm', 0, 2.5, 0.05],
      ['boomSpeed', 'Boom luffing speed', '°/s', 0, 12, 0.5],
      ['telescopeSpeed', 'Boom extension speed', 'm/s', 0, 1.5, 0.05]
    ]
  },
  tower: {
    title: 'Generic tower crane',
    scene: 'Tower crane · trolley and hoist practice',
    machine: [
      ['trolley', 'Trolley radius / travel', 'm', 0, 24, 0.1],
      ['hookHeight', 'Hoist height / rope payout', 'm', 0.8, 25, 0.1],
      ['slew', 'Slew angle', '°', -180, 180, 1],
      ['hoistSpeed', 'Hoist speed command', 'm/s', 0, 2, 0.05],
      ['slewSpeed', 'Slew speed command', 'rpm', 0, 1.5, 0.05],
      ['trolleySpeed', 'Trolley speed command', 'm/s', 0, 1.5, 0.05]
    ]
  },
  crawler: {
    title: 'Generic crawler lattice-boom crane',
    scene: 'Crawler crane · lattice boom practice',
    machine: [
      ['boomAngle', 'Boom angle', '°', 20, 80, 0.5],
      ['boomLength', 'Lattice boom length', 'm', 10, 32, 0.1],
      ['slew', 'Slew angle', '°', -180, 180, 1],
      ['hookHeight', 'Hoist height / rope payout', 'm', 0.8, 20, 0.1],
      ['counterweight', 'Counterweight', 't', 0, 35, 0.5],
      ['hoistSpeed', 'Hoist speed command', 'm/s', 0, 1.5, 0.05],
      ['slewSpeed', 'Slew speed command', 'rpm', 0, 2, 0.05],
      ['travelX', 'Crawler travel position', 'm', -10, 10, 0.1],
      ['travelSpeed', 'Crawler travel command', 'm/s', 0, 1.2, 0.05],
      ['boomSpeed', 'Boom luffing speed', '°/s', 0, 12, 0.5],
      ['telescopeSpeed', 'Boom extension speed', 'm/s', 0, 1.5, 0.05]
    ]
  },
  overhead: {
    title: 'Generic overhead / gantry crane',
    scene: 'Overhead crane · bridge and trolley practice',
    machine: [
      ['bridgeX', 'Bridge travel', 'm', -9, 9, 0.1],
      ['trolley', 'Trolley travel', 'm', -2.5, 2.5, 0.1],
      ['hookHeight', 'Hoist height / rope payout', 'm', 0.8, 8, 0.1],
      ['hoistSpeed', 'Hoist speed command', 'm/s', 0, 1.2, 0.05],
      ['bridgeSpeed', 'Bridge speed command', 'm/s', 0, 1.2, 0.05],
      ['trolleySpeed', 'Trolley speed command', 'm/s', 0, 1.2, 0.05]
    ]
  }
};

export const ENVIRONMENT_SPECS = [
  ['load', 'Payload mass', 't', 0.1, 40, 0.1],
  ['rigging', 'Rigging mass', 't', 0, 5, 0.1],
  ['wind', 'Wind speed', 'm/s', 0, 35, 0.5],
  ['windDir', 'Wind direction', '°', 0, 359, 1],
  ['gustMultiplier', 'Wind gust multiplier', '×', 1, 3, 0.05],
  ['area', 'Load projected area', 'm²', 0.5, 35, 0.5],
  ['loadCoGOffset', 'Load COG offset from hook', 'm', -1.5, 1.5, 0.05],
  ['ground', 'Training ground strength index', 'kPa*', 10, 300, 5],
  ['mat', 'Support pad / foundation width', 'm', 0.5, 3, 0.1],
  ['outOfLevel', 'Crane out-of-level input', '°', 0, 5, 0.1],
  ['slingAngle', 'Sling angle from vertical', '°', 0, 60, 1],
  ['slopeDirection', 'Ground slope direction', '°', 0, 359, 1],
  ['swingDamping', 'Load swing damping', 'ratio', 0.02, 1, 0.02],
  ['simulationSpeed', 'Simulation speed', '×', 0.25, 2, 0.05]
];

export const DEFAULT_CONTROLS = {
  boomAngle: 48,
  boomLength: 18,
  slew: 0,
  hookHeight: 7,
  outriggerSpread: 100,
  counterweight: 26.1,
  hoistSpeed: 0.35,
  slewSpeed: 0.35,
  trolley: 8,
  trolleySpeed: 0.35,
  bridgeX: 0,
  bridgeSpeed: 0.35,
  travelSpeed: 0.2, travelX: 0, boomSpeed: 3, telescopeSpeed: .35,
  load: 16,
  rigging: 1.9,
  wind: 25,
  windDir: 90, gustMultiplier: 1.5,
  area: 23, loadCoGOffset: 0,
  ground: 150,
  mat: 2,
  outOfLevel: 0,
  slingAngle: 15, slopeDirection: 0, swingDamping: .2,
  simulationSpeed: 1
};

export function controlsForFamily(kind) {
  return { ...DEFAULT_CONTROLS };
}
