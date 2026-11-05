import * as THREE from 'three';
import { clamp, deg } from './math.js';

const mat = (color, roughness = .72, metalness = .05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const M = {
  yellow: mat('#f2b52a', .38, .16), yellowHi: mat('#ffc84b', .3, .18),
  dark: mat('#202d3b'), steel: mat('#718293', .42, .55), steelDark: mat('#435363', .5, .5),
  glass: mat('#18384e', .2, .3), rubber: mat('#101820'), hub: mat('#b5c0c9', .38, .65),
  red: mat('#df5148'), white: mat('#f2f4f5'), rope: mat('#252b32'), load: mat('#c4d0d9'),
  track: mat('#303b46'), concrete: mat('#89949b', .9), sling: mat('#d7a32e', .48, .25), utility: mat('#aebbc3', .55, .25)
};

function box(parent, size, material, pos, name = '') {
  const o = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  o.position.set(...pos); o.castShadow = true; o.receiveShadow = true; o.name = name; parent.add(o); return o;
}
function cyl(parent, rTop, rBottom, height, material, pos, rot = [0, 0, 0], segments = 20) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, segments), material);
  o.position.set(...pos); o.rotation.set(...rot); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function beam(parent, a, b, radius, material, radialSegments = 10) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, Math.max(.01, d.length()), radialSegments), material);
  o.position.copy(va.add(vb).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
}
function wheel(parent, x, z, radius = .62) {
  cyl(parent, radius, radius, .42, M.rubber, [x, radius + .04, z], [Math.PI / 2, 0, 0], 28);
  cyl(parent, radius * .42, radius * .42, .44, M.hub, [x, radius + .04, z], [Math.PI / 2, 0, 0], 20);
  cyl(parent, radius * .18, radius * .18, .46, M.dark, [x, radius + .04, z], [Math.PI / 2, 0, 0], 16);
}
function unitCylinder(material, radius = .035) {
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), material);
}

function makeMobile(root) {
  const base = new THREE.Group(); base.name = 'mobile carrier'; root.add(base);
  box(base, [7.8, .78, 2.55], M.dark, [0, 1.02, 0], 'carrier chassis');
  box(base, [6.7, .22, 2.3], M.steelDark, [.1, 1.52, 0], 'carrier deck');
  for (const x of [-2.8, -1.0, .9, 2.65]) for (const z of [-1.35, 1.35]) wheel(base, x, z, .66);
  // Front carrier cab and glazing.
  box(base, [1.65, 1.75, 1.75], M.yellow, [3.05, 1.85, 0], 'carrier cab');
  box(base, [1.35, 1.12, 1.55], M.glass, [3.05, 2.03, 0], 'carrier cab glazing');
  box(base, [1.78, .12, 1.86], M.dark, [3.05, 2.78, 0]);
  // Four outrigger beams, legs and pads.
  const outriggers = [];
  for (const x of [-2.7, 2.7]) {
    box(base, [.5, .38, 7.4], M.steelDark, [x, 1.05, 0], 'outrigger beam');
    for (const z of [-3.6, 3.6]) {
      const leg = box(base, [.34, .9, .34], M.steel, [x, .58, z], 'outrigger ram');
      const foot = box(base, [.42, .12, .42], M.dark, [x, .12, z], 'outrigger foot');
      const pad = box(base, [1.8, .16, 1.8], M.track, [x, .025, z], 'outrigger mat');
      outriggers.push({ leg, foot, pad, x, z });
      box(base, [.38, .055, .09], M.red, [x, .82, z]);
    }
  }
  const upper = new THREE.Group(); upper.position.set(0, 1.65, 0); base.add(upper);
  box(upper, [4.2, .58, 2.55], M.dark, [-.2, .1, 0], 'upper deck');
  const cw = new THREE.Group(); cw.position.set(-2.2, .52, 0); upper.add(cw);
  const cwParts = [];
  for (let i = 0; i < 4; i++) cwParts.push(box(cw, [1.15, .42, 2.2], i % 2 ? M.steelDark : M.steel, [-i * .04, i * .38, 0], 'counterweight block'));
  box(upper, [1.45, 1.62, 1.62], M.yellow, [-1.25, 1.25, 0], 'operator cabin');
  box(upper, [1.18, 1.12, 1.45], M.glass, [-1.25, 1.42, 0], 'operator glazing');
  box(upper, [1.5, .12, 1.7], M.dark, [-1.25, 2.1, 0]);
  const boomPivot = new THREE.Group(); boomPivot.position.set(.55, 1.02, 0); upper.add(boomPivot);
  box(boomPivot, [8, .82, .98], M.yellow, [4, 0, 0], 'main telescopic boom');
  const ext1 = box(boomPivot, [1, .65, .76], M.steel, [8.5, 0, 0], 'telescopic section one');
  const ext2 = box(boomPivot, [1, .5, .6], M.yellowHi, [9, 0, 0], 'telescopic section two');
  const tip = new THREE.Group(); boomPivot.add(tip); tip.position.x = 18; tip.name = 'boom head';
  box(tip, [.9, .35, 1.1], M.dark, [0, 0, 0]);
  for (const z of [-.32, .32]) cyl(tip, .24, .24, .18, M.steel, [0, -.22, z], [Math.PI / 2, 0, 0], 20);
  const hydraulicBase = unitCylinder(M.steel, .19); upper.add(hydraulicBase);
  const hydraulicRod = unitCylinder(M.yellowHi, .095); upper.add(hydraulicRod);
  const c = { kind: 'mobile', root, base, upper, boomPivot, ext1, ext2, tip, hydraulicBase, hydraulicRod, outriggers, cw, cwParts,
    baseMass: 48, supportHalfX: 2.7, supportHalfZ: 3.6, hookMassTonnes: .3, hasOutriggers: true };
  return c;
}

function makeTower(root) {
  const base = new THREE.Group(); root.add(base);
  const foundationPad = box(base, [7, .7, 7], M.concrete, [0, .35, 0], 'tower foundation');
  box(base, [3.2, .35, 3.2], M.dark, [0, .85, 0], 'mast base frame');
  const mast = new THREE.Group(); base.add(mast);
  const mastH = 18, half = .78;
  for (let y = 0; y < mastH; y += .75) {
    for (const x of [-half, half]) for (const z of [-half, half]) beam(mast, [x, y, z], [x, y + .75, z], .075, M.yellow, 8);
    for (const z of [-half, half]) {
      beam(mast, [-half, y, z], [half, y + .75, z], .045, M.steel, 8);
      beam(mast, [half, y, z], [-half, y + .75, z], .045, M.steel, 8);
    }
    for (const x of [-half, half]) {
      beam(mast, [x, y, -half], [x, y + .75, half], .045, M.steel, 8);
      beam(mast, [x, y, half], [x, y + .75, -half], .045, M.steel, 8);
    }
  }
  const upper = new THREE.Group(); upper.position.y = mastH; base.add(upper);
  box(upper, [2.7, .75, 2.1], M.yellow, [0, 0, 0], 'slewing unit');
  box(upper, [1.1, 1.05, 1.3], M.glass, [-.25, .75, 0], 'operator cab');
  box(upper, [1.2, .12, 1.4], M.dark, [-.25, 1.3, 0]);
  const jib = new THREE.Group(); jib.position.set(0, .45, 0); upper.add(jib);
  // Main jib: box chords with repeated web bracing.
  const jibLength = 28;
  beam(jib, [0, .15, -.38], [jibLength, .15, -.38], .09, M.yellow, 8);
  beam(jib, [0, .15, .38], [jibLength, .15, .38], .09, M.yellow, 8);
  beam(jib, [0, .55, -.38], [jibLength, .55, -.38], .075, M.steel, 8);
  beam(jib, [0, .55, .38], [jibLength, .55, .38], .075, M.steel, 8);
  for (let x = 0; x < jibLength; x += 2) {
    beam(jib, [x, .15, -.38], [Math.min(jibLength, x + 2), .55, -.38], .035, M.steel);
    beam(jib, [x, .55, .38], [Math.min(jibLength, x + 2), .15, .38], .035, M.steel);
    beam(jib, [x, .15, .38], [Math.min(jibLength, x + 2), .55, .38], .035, M.steel);
    beam(jib, [x, .55, -.38], [Math.min(jibLength, x + 2), .15, -.38], .035, M.steel);
  }
  // Counter-jib and ballast.
  box(jib, [10, .48, 1.0], M.dark, [-5, .3, 0], 'counter jib');
  for (let i = 0; i < 3; i++) box(jib, [1.2, .75, 1.35], M.steel, [-8 - i * 1.15, -.25, 0], 'tower ballast');
  beam(upper, [0, 1.0, 0], [8, 1.0, 0], .09, M.steel, 8);
  beam(upper, [0, 1.0, 0], [-7, 1.0, 0], .09, M.steel, 8);
  const trolley = new THREE.Group(); trolley.position.x = 8; jib.add(trolley);
  box(trolley, [1.4, .62, 1.25], M.dark, [0, -.25, 0], 'trolley frame');
  for (const z of [-.48, .48]) cyl(trolley, .18, .18, .14, M.steel, [0, .1, z], [Math.PI / 2, 0, 0], 16);
  return { kind: 'tower', root, base, foundationPad, upper, boomPivot: jib, trolley, jibLength, baseMass: 120, supportHalfX: 3.5, supportHalfZ: 3.5, hookMassTonnes: .35, hasOutriggers: false };
}

function makeCrawler(root) {
  const base = new THREE.Group(); root.add(base);
  box(base, [6.8, 1, 3.5], M.dark, [0, 1, 0], 'crawler carbody');
  const trackGroups = [];
  for (const z of [-1.95, 1.95]) {
    const trackGroup = new THREE.Group(); trackGroup.position.z = z; base.add(trackGroup);
    box(trackGroup, [7.4, .72, .72], M.track, [0, .62, 0], 'crawler track frame');
    for (let x = -3.05; x <= 3.05; x += .55) cyl(trackGroup, .32, .32, .78, M.rubber, [x, .62, 0], [Math.PI / 2, 0, 0], 16);
    for (let x = -3.25; x <= 3.25; x += .4) box(trackGroup, [.32, .07, .82], M.steelDark, [x, .23, 0], 'track shoe');
    trackGroups.push(trackGroup);
  }
  const upper = new THREE.Group(); upper.position.y = 1.55; base.add(upper);
  box(upper, [4.1, .62, 2.8], M.dark, [-.3, 0, 0]);
  box(upper, [1.45, 1.65, 1.7], M.yellow, [-1.35, 1.15, 0]);
  box(upper, [1.18, 1.15, 1.48], M.glass, [-1.35, 1.32, 0]);
  const cw = new THREE.Group(); cw.position.set(-2.25, .45, 0); upper.add(cw);
  const cwParts = []; for (let i = 0; i < 4; i++) cwParts.push(box(cw, [1.15, .42, 2.25], M.steel, [-i * .05, i * .37, 0]));
  const boomPivot = new THREE.Group(); boomPivot.position.set(.6, 1.0, 0); upper.add(boomPivot);
  const boomStructure = new THREE.Group(); boomPivot.add(boomStructure);
  const nominalLength = 18, bays = 12, bay = nominalLength / bays, w = .58;
  for (let i = 0; i < bays; i++) {
    const x0 = i * bay, x1 = (i + 1) * bay;
    for (const z of [-w, w]) beam(boomStructure, [x0, 0, z], [x1, 0, z], .055, M.yellow, 8);
    for (const y of [0, .85]) {
      beam(boomStructure, [x0, y, -w], [x0, y, w], .045, M.steel, 8);
      beam(boomStructure, [x0, y, -w], [x1, y, w], .035, M.steel, 8);
      beam(boomStructure, [x0, y, w], [x1, y, -w], .035, M.steel, 8);
    }
    beam(boomStructure, [x0, .85, -w], [x1, .85, -w], .045, M.yellow, 8);
    beam(boomStructure, [x0, .85, w], [x1, .85, w], .045, M.yellow, 8);
  }
  const tip = new THREE.Group(); tip.position.x = nominalLength; boomPivot.add(tip);
  box(tip, [.9, .32, 1.25], M.dark, [0, .42, 0]);
  return { kind: 'crawler', root, base, upper, boomPivot, boomStructure, tip, nominalLength, cw, cwParts, trackGroups,
    baseMass: 72, supportHalfX: 3.7, supportHalfZ: 1.95, hookMassTonnes: .35, hasOutriggers: false };
}

function makeOverhead(root) {
  const base = new THREE.Group(); root.add(base);
  const span = 24, railZ = 3.5, height = 10, basePlates = [];
  for (const x of [-span / 2, span / 2]) for (const z of [-railZ, railZ]) {
    box(base, [.65, height, .65], M.steel, [x, height / 2, z], 'gantry column');
    basePlates.push(box(base, [1.5, .6, 1.5], M.dark, [x, .3, z], 'column base'));
  }
  for (const z of [-railZ, railZ]) {
    box(base, [span + 1, .72, .8], M.yellow, [0, height, z], 'runway girder');
    box(base, [span + 1, .12, .95], M.dark, [0, height - .4, z]);
  }
  const bridge = new THREE.Group(); bridge.position.y = height; base.add(bridge);
  box(bridge, [1.0, .9, railZ * 2 + 1.4], M.yellow, [0, 0, 0], 'bridge girder');
  box(bridge, [1.0, .2, railZ * 2 + 1.5], M.dark, [0, -.48, 0]);
  const trolley = new THREE.Group(); bridge.add(trolley);
  box(trolley, [1.7, .72, 1.6], M.dark, [0, -.75, 0], 'hoist trolley');
  for (const x of [-.55, .55]) for (const z of [-.5, .5]) cyl(trolley, .18, .18, .16, M.steel, [x, -.35, z], [Math.PI / 2, 0, 0], 16);
  return { kind: 'overhead', root, base, basePlates, upper: bridge, boomPivot: bridge, trolley, baseMass: 100, supportHalfX: 12, supportHalfZ: 3.5, hookMassTonnes: .25, hasOutriggers: false, span };
}

export function createCrane(scene, kind) {
  const root = new THREE.Group(); root.name = `${kind} crane root`; scene.add(root);
  let crane;
  if (kind === 'mobile') crane = makeMobile(root);
  else if (kind === 'tower') crane = makeTower(root);
  else if (kind === 'crawler') crane = makeCrawler(root);
  else crane = makeOverhead(root);
  crane.kind = kind; crane.root = root; crane.broken = false; crane.tipping = false;
  return crane;
}

export function updateCrane(c, controls) {
  const p = controls;
  if (c.kind === 'mobile') {
    c.upper.rotation.y = deg(p.slew);
    c.boomPivot.rotation.z = deg(p.boomAngle);
    const extra = Math.max(0, p.boomLength - 8), e1 = extra * .62, e2 = extra * .38;
    c.ext1.scale.x = Math.max(.01, e1); c.ext1.position.x = 8 + e1 / 2;
    c.ext2.scale.x = Math.max(.01, e2); c.ext2.position.x = 8 + e1 + e2 / 2;
    c.tip.position.x = p.boomLength;
    const spread = clamp(p.outriggerSpread / 100, .6, 1.35);
    for (const part of c.outriggers) {
      const z = part.z * spread; part.leg.position.z = z; part.foot.position.z = z; part.pad.position.z = z;
      part.pad.scale.set(p.mat / 1.8, 1, p.mat / 1.8);
    }
    c.cw.visible = p.counterweight > .01; c.cw.scale.x = Math.max(.04, p.counterweight / 26.1);
    // Visual hydraulic ram follows the boom angle. It is not a pressure/circuit model.
    const anchor = new THREE.Vector3(.35, .65, 0);
    const end = new THREE.Vector3(4.4, -.42, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), deg(p.boomAngle)).add(c.boomPivot.position);
    placeMeshBetween(c.hydraulicBase, anchor, end);
    const rodStart = anchor.clone().lerp(end, .52); placeMeshBetween(c.hydraulicRod, rodStart, end);
  }
  if (c.kind === 'tower') {
    c.foundationPad.scale.set(p.mat / 2, 1, p.mat / 2);
    c.upper.rotation.y = deg(p.slew);
    c.trolley.position.x = clamp(p.trolley, 0, c.jibLength - 1);
  }
  if (c.kind === 'crawler') {
    c.base.position.x = clamp(p.travelX || 0, -10, 10);
    c.upper.rotation.y = deg(p.slew);
    c.boomPivot.rotation.z = deg(p.boomAngle);
    c.boomStructure.scale.x = clamp(p.boomLength / c.nominalLength, .55, 1.8);
    c.tip.position.x = p.boomLength;
    for (const track of c.trackGroups) track.scale.z = p.mat / 2;
    c.cw.visible = p.counterweight > .01; c.cw.scale.x = Math.max(.04, p.counterweight / 20);
  }
  if (c.kind === 'overhead') {
    for (const plate of c.basePlates) plate.scale.set(p.mat / 2, 1, p.mat / 2);
    c.upper.position.x = clamp(p.bridgeX, -9, 9);
    c.trolley.position.z = clamp(p.trolley, -2.5, 2.5);
  }
}

function placeMeshBetween(mesh, a, b) {
  const d = b.clone().sub(a); mesh.position.copy(a.clone().add(b).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); mesh.scale.y = Math.max(.01, d.length());
}

export function createLoad(scene) {
  const load = new THREE.Group(); load.name = 'suspended training load'; scene.add(load);
  box(load, [1.8, 1.35, 1.55], M.load, [0, 0, 0], 'cargo body');
  box(load, [1.86, .1, 1.62], M.steel, [0, .68, 0], 'cargo top frame');
  for (const x of [-.72, .72]) for (const z of [-.58, .58]) box(load, [.08, .12, .08], M.dark, [x, .75, z]);
  const hook = new THREE.Group(); hook.name = 'hook block'; scene.add(hook);
  box(hook, [.72, .5, .68], M.dark, [0, 0, 0]);
  for (const z of [-.25, .25]) cyl(hook, .18, .18, .16, M.yellow, [0, .04, z], [Math.PI / 2, 0, 0], 18);
  const hookCurve = new THREE.Mesh(new THREE.TorusGeometry(.22, .055, 10, 24, Math.PI * 1.55), M.yellow);
  hookCurve.position.y = -.36; hookCurve.rotation.z = Math.PI; hook.add(hookCurve);
  const cable = unitCylinder(M.rope, .025); scene.add(cable);
  const slings = [0, 1].map(() => { const s = unitCylinder(M.sling, .035); scene.add(s); return s; });
  return { load, hook, cable, slings };
}
