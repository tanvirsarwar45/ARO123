import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCrane, createLoad, updateCrane } from './cranes.js';
import { G, clamp, deg, estimateWindForce, stepPendulum, calculateTrainingMoment } from './math.js';

const VERTICAL = new THREE.Vector3(0, 1, 0);

export class CraneSimulation {
  constructor(canvas, onFrame, initialKind = 'mobile', initialControls = {}) {
    this.canvas = canvas;
    this.onFrame = onFrame;
    this.kind = initialKind;
    this.controls = {
      boomAngle: 48, boomLength: 18, slew: 0, hookHeight: 7,
      outriggerSpread: 100, counterweight: 26.1, hoistSpeed: .35, slewSpeed: .35,
      trolley: 8, trolleySpeed: .35, bridgeX: 0, bridgeSpeed: .35, travelSpeed: .2,
      load: 16, rigging: 1.9, wind: 25, windDir: 90, area: 23,
      ground: 150, mat: 2, outOfLevel: 0, slingAngle: 15, slopeDirection: 0, swingDamping: .2, gustMultiplier: 1.5, loadCoGOffset: 0, simulationSpeed: 1,
      ...initialControls
    };
    this.pend = { angleX: 0, angleZ: 0, velocityX: 0, velocityZ: 0 };
    this.fault = 'none';
    this.preFaultControls = null;
    this.tipAngle = 0;
    this.tipVelocity = 0;
    this.boomFailureAngle = 0;
    this.groundSettlement = 0;
    this.gust = { time: 0, duration: 0, peak: 0 };
    this.previousHookTop = null;
    this.lastSupportVelocity = new THREE.Vector3();
    this.lastMetrics = null;
    this.running = true;
    this.clock = new THREE.Clock();
    this.init();
    this.setCrane(initialKind, true);
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#9dbbd0');
    this.scene.fog = new THREE.Fog('#9dbbd0', 110, 290);
    this.camera = new THREE.PerspectiveCamera(45, 1, .1, 500);
    this.camera.position.set(34, 25, 39);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.target.set(0, 5, 0);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = .06;
    this.orbit.maxPolarAngle = Math.PI * .485;
    this.orbit.minDistance = 7;
    this.orbit.maxDistance = 150;
    this.scene.add(new THREE.HemisphereLight('#e8f4ff', '#596b78', 2.0));
    const sun = new THREE.DirectionalLight('#fff1d8', 3.0);
    sun.position.set(-45, 65, 35); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -85; sun.shadow.camera.right = 85;
    sun.shadow.camera.top = 85; sun.shadow.camera.bottom = -85;
    sun.shadow.bias = -.0002; this.scene.add(sun);
    const fill = new THREE.DirectionalLight('#8ab8e6', .65); fill.position.set(35, 20, -35); this.scene.add(fill);
    this.buildSky();
    this.buildEnvironment();
    this.buildWind();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }


  buildSky() {
    const skyGeometry = new THREE.SphereGeometry(280, 32, 18);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vWorldPosition; void main(){ vec4 worldPosition=modelMatrix*vec4(position,1.0); vWorldPosition=worldPosition.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vWorldPosition; uniform vec3 topColor; uniform vec3 horizonColor; void main(){ float h=normalize(vWorldPosition-cameraPosition).y; float t=smoothstep(-0.12,0.72,h); vec3 color=mix(horizonColor,topColor,t); gl_FragColor=vec4(color,1.0); }`,
      uniforms: { topColor: { value: new THREE.Color('#254b70') }, horizonColor: { value: new THREE.Color('#b7cbd5') } }
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial); sky.renderOrder = -20; this.scene.add(sky);
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#dce7eb', roughness: 1, transparent: true, opacity: .34, depthWrite: false });
    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group();
      const x = -115 + (i * 37) % 230, z = -125 + (i * 53) % 250;
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(5 + (j % 2) * 1.8, 12, 8), cloudMaterial);
        puff.position.set(j * 5.4, (j % 2) * 1.1, (j % 2) * 1.6); puff.scale.y = .35; cloud.add(puff);
      }
      cloud.position.set(x, 48 + (i % 4) * 5, z); cloud.scale.setScalar(.65 + (i % 3) * .16); this.scene.add(cloud);
    }
  }

  buildEnvironment() {
    const env = new THREE.Group(); this.scene.add(env);
    const concrete = new THREE.MeshStandardMaterial({ color: '#89949b', roughness: .95 });
    const darkConcrete = new THREE.MeshStandardMaterial({ color: '#596771', roughness: .96 });
    const warehouse = new THREE.MeshStandardMaterial({ color: '#657987', roughness: .85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#445967', roughness: .88 });
    const glass = new THREE.MeshStandardMaterial({ color: '#1d3c50', metalness: .2, roughness: .25 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(360, 360), concrete);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.12; ground.receiveShadow = true; env.add(ground);
    const grid = new THREE.GridHelper(220, 110, '#617583', '#aab5bb'); grid.position.y = -.105; env.add(grid);
    // Large warehouse buildings kept outside the central operating envelope.
    for (let i = 0; i < 3; i++) {
      const x = -48 + i * 22;
      const building = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 15), warehouse);
      building.position.set(x, 5, -43); building.castShadow = true; building.receiveShadow = true; env.add(building);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(20.8, .55, 15.8), roofMat);
      roof.position.set(x, 10.25, -43); roof.castShadow = true; env.add(roof);
      for (let wx = -7; wx <= 7; wx += 4.6) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, .12), glass);
        win.position.set(x + wx, 5.6, -35.42); env.add(win);
      }
      const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.2, .15), darkConcrete);
      door.position.set(x, 2.2, -35.35); env.add(door);
    }
    // Container yard with corrugation, corner castings and varied colors.
    const containerColors = ['#a94c3f', '#c18a32', '#3f7188', '#586f64', '#6d596d'];
    for (let i = 0; i < 8; i++) {
      const x = 25 + (i % 4) * 6.5, z = -35 - Math.floor(i / 4) * 3.3;
      const color = new THREE.MeshStandardMaterial({ color: containerColors[i % containerColors.length], roughness: .78, metalness: .12 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.5), color);
      body.position.set(x, 1.3, z); body.castShadow = true; body.receiveShadow = true; env.add(body);
      for (let xx = -2.7; xx <= 2.7; xx += .32) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(.045, 2.48, .035), darkConcrete);
        rib.position.set(x + xx, 1.3, z + 1.26); env.add(rib);
      }
      for (const xx of [-2.8, 2.8]) for (const yy of [.15, 2.45]) {
        const corner = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), MISSING_MATERIAL());
        corner.position.set(x + xx, yy, z + 1.28); env.add(corner);
      }
    }
    // Road, lane marking, kerbs and traffic barriers.
    const road = new THREE.Mesh(new THREE.PlaneGeometry(140, 11), new THREE.MeshStandardMaterial({ color: '#343e47', roughness: 1 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, -.04, 29); env.add(road);
    for (let x = -68; x <= 68; x += 7) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.4, .025, .16), new THREE.MeshStandardMaterial({ color: '#e8dfc1' }));
      stripe.position.set(x, -.015, 29); env.add(stripe);
    }
    for (const side of [-1, 1]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(140, .18, .35), darkConcrete);
      kerb.position.set(0, .02, 29 + side * 5.8); env.add(kerb);
    }
    // Perimeter fence, light poles, cones and safety barriers.
    for (let x = -52; x <= 52; x += 4) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 2.4, 10), darkConcrete);
      post.position.set(x, 1.2, 43); env.add(post);
    }
    for (let x = -52; x < 52; x += 1.5) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, .08), new THREE.MeshStandardMaterial({ color: '#e5a83c' }));
      rail.position.set(x + .75, 1.15, 43); env.add(rail);
    }
    for (let x = -36; x <= 36; x += 12) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 8, 12), darkConcrete);
      pole.position.set(x, 4, 17); env.add(pole);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(.9, .2, .55), new THREE.MeshStandardMaterial({ color: '#ffe5a8', emissive: '#dba94d', emissiveIntensity: .55 }));
      lamp.position.set(x, 8.05, 17); env.add(lamp);
    }
    for (let x = -17; x <= 17; x += 3.4) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(.28, .9, 16), new THREE.MeshStandardMaterial({ color: '#e85c3d', roughness: .7 }));
      cone.position.set(x, .45, 10); cone.castShadow = true; env.add(cone);
      const base = new THREE.Mesh(new THREE.BoxGeometry(.62, .08, .62), darkConcrete); base.position.set(x, .04, 10); env.add(base);
    }
    // Distant tree line and low terrain mounds.
    for (let i = 0; i < 17; i++) {
      const x = -62 + i * 7.5, z = 54 + (i % 3) * 2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .26, 2.6, 9), new THREE.MeshStandardMaterial({ color: '#66513e' }));
      trunk.position.set(x, 1.3, z); env.add(trunk);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 10), new THREE.MeshStandardMaterial({ color: '#3e6657', roughness: 1 }));
      crown.position.set(x, 3.6, z); crown.scale.y = 1.2; env.add(crown);
    }
    // Overhead utility line zone in the far background, clearly separated from the practice pad.
    for (const x of [-42, 42]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 14, 12), darkConcrete);
      pole.position.set(x, 7, -8); env.add(pole);
      for (const z of [-2, 0, 2]) {
        const insulator = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .5, 10), MISSING_MATERIAL());
        insulator.position.set(x, 13.8, z - 8); env.add(insulator);
      }
    }
  }

  buildWind() {
    const count = 900;
    const positions = new Float32Array(count * 3);
    this.windVelocity = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - .5) * 100;
      positions[i * 3 + 1] = 1 + Math.random() * 28;
      positions[i * 3 + 2] = (Math.random() - .5) * 90;
      this.windVelocity[i] = .65 + Math.random() * 1.65;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.windPoints = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#eff8ff', size: .16, transparent: true, opacity: .6, depthWrite: false, sizeAttenuation: true }));
    this.scene.add(this.windPoints);
    this.windArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 10, 0), 6, '#fff0bf', 1.2, .7);
    this.scene.add(this.windArrow);
    this.windStreaks = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#e8f5ff', transparent: true, opacity: .34 }));
    this.windPoints.frustumCulled = false; this.windStreaks.frustumCulled = false;
    const streakPositions = new Float32Array(count * 6);
    this.windStreaks.geometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
    this.scene.add(this.windStreaks);
  }

  setCrane(kind, initial = false, controlsPatch = {}) {
    Object.assign(this.controls, controlsPatch);
    if (this.crane) {
      this.scene.remove(this.crane.root);
      this.crane.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      this.disposeLoad();
    }
    this.kind = kind;
    this.crane = createCrane(this.scene, kind);
    this.load = createLoad(this.scene);
    this.pend = { angleX: 0, angleZ: 0, velocityX: 0, velocityZ: 0 };
    this.tipAngle = 0; this.tipVelocity = 0; this.boomFailureAngle = 0; this.groundSettlement = 0;
    this.previousHookTop = null; this.lastSupportVelocity.set(0, 0, 0);
    this.fault = 'none'; this.preFaultControls = null; this.gust = { time: 0, duration: 0, peak: 0 };
    this.structuralDeflection = 0; this.currentSupportLoss = 1;
    this.crane.root.position.set(0, 0, 0); this.crane.root.quaternion.identity();
    const view = kind === 'tower' ? { camera: [39, 28, 43], target: [2, 9, 0] }
      : kind === 'overhead' ? { camera: [34, 22, 34], target: [0, 5, 0] }
      : kind === 'crawler' ? { camera: [32, 22, 36], target: [2, 5, 0] }
      : { camera: [31, 21, 35], target: [3, 5, 0] };
    this.camera.position.set(...view.camera); this.orbit.target.set(...view.target); this.orbit.update();
    this.update(0);
    if (!initial) this.onFamilyChanged?.(kind);
  }

  disposeLoad() {
    if (!this.load) return;
    for (const obj of [this.load.load, this.load.hook, this.load.cable, ...this.load.slings]) {
      this.scene.remove(obj); obj.traverse?.(child => { if (child.geometry) child.geometry.dispose(); });
    }
  }

  setControls(patch) {
    Object.assign(this.controls, patch);
    this.controls.wind = clamp(this.controls.wind, 0, 35);
    this.controls.windDir = ((this.controls.windDir % 360) + 360) % 360;
  }

  injectFault(fault) {
    if (this.fault === 'none') this.preFaultControls = { ...this.controls };
    this.fault = fault;
    if (fault === 'gust') this.gust = { time: 0, duration: 4.5, peak: Math.max(8, this.controls.wind * (this.controls.gustMultiplier - 1)) };
    if (fault === 'ground') this.groundSettlement = 0;
    if (fault === 'overload') {
      this.controls.load = Math.max(32, this.controls.load);
      if (this.kind === 'tower') this.controls.trolley = 24;
      if (this.kind === 'crawler') { this.controls.boomLength = 32; this.controls.boomAngle = 42; }
      if (this.kind === 'overhead') { this.controls.trolley = 2.5; this.controls.bridgeX = 9; }
    }
    if (fault === 'boom') this.boomFailureAngle = 0;
    this.update(0);
  }

  resetFault() {
    if (this.preFaultControls) this.controls = { ...this.preFaultControls };
    this.preFaultControls = null; this.fault = 'none';
    this.tipAngle = 0; this.tipVelocity = 0; this.boomFailureAngle = 0; this.groundSettlement = 0;
    this.gust = { time: 0, duration: 0, peak: 0 };
    this.crane.tipping = false; this.crane.broken = false;
    this.crane.root.position.set(0, 0, 0); this.crane.root.quaternion.identity();
    if (this.crane.base) { this.crane.base.position.x = 0; this.crane.base.position.y = 0; }
    if (this.crane.outriggers) for (const support of this.crane.outriggers) { support.leg.position.y = .58; support.foot.position.y = .12; support.pad.position.y = .025; }
    this.pend = { angleX: 0, angleZ: 0, velocityX: 0, velocityZ: 0 };
    this.update(0);
  }

  currentWindSpeed() {
    if (!(this.gust.duration > 0) || this.gust.time >= this.gust.duration) return this.controls.wind;
    const phase = this.gust.time / this.gust.duration;
    const envelope = Math.sin(Math.PI * phase);
    return Math.min(50, this.controls.wind + this.gust.peak * envelope);
  }

  getHookAnchor() {
    this.scene.updateMatrixWorld(true);
    const anchor = new THREE.Vector3();
    if (this.kind === 'mobile' || this.kind === 'crawler') this.crane.tip.getWorldPosition(anchor);
    else this.crane.trolley.getWorldPosition(anchor);
    return anchor;
  }

  getRadius() {
    if (this.kind === 'mobile' || this.kind === 'crawler') return Math.max(0, this.controls.boomLength * Math.cos(deg(this.controls.boomAngle)) + this.controls.loadCoGOffset);
    if (this.kind === 'tower') return Math.max(0, Math.abs(this.controls.trolley) + this.controls.loadCoGOffset);
    return Math.max(0, Math.hypot(this.controls.bridgeX || 0, this.controls.trolley || 0) + this.controls.loadCoGOffset);
  }

  getSupportEdge() {
    const p = this.controls;
    let hx = this.crane.supportHalfX, hz = this.crane.supportHalfZ;
    if (this.kind === 'mobile') hz *= clamp(p.outriggerSpread / 100, .6, 1.35);
    if (this.kind === 'crawler') hz *= clamp(p.mat / 2, .25, 1.5);
    if (this.kind === 'tower') { hx *= clamp(p.mat / 2, .25, 1.5); hz *= clamp(p.mat / 2, .25, 1.5); }
    const angle = deg(p.slew || 0);
    const dx = Math.abs(Math.cos(angle)), dz = Math.abs(Math.sin(angle));
    return 1 / (dx / Math.max(.25, hx) + dz / Math.max(.25, hz));
  }

  applyTipTransform(angle) {
    const slew = deg(this.controls.slew || 0);
    const radial = new THREE.Vector3(Math.cos(slew), 0, Math.sin(slew));
    const axis = new THREE.Vector3(radial.z, 0, -radial.x).normalize();
    const support = this.getSupportEdge() * (this.currentSupportLoss || (this.fault === 'ground' ? .48 : 1));
    const pivot = radial.multiplyScalar(support);
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    this.crane.root.quaternion.copy(q);
    const center = this.crane.base?.position.clone() || new THREE.Vector3();
    const worldPivot = center.clone().add(pivot);
    const rotatedCenter = center.clone().applyQuaternion(q);
    this.crane.root.position.copy(worldPivot).sub(rotatedCenter);
  }

  update(dt) {
    if (!this.crane || !this.load) return;
    const c = this.crane, p = this.controls;
    updateCrane(c, p);
    if (c.boomPivot && this.boomFailureAngle > 0) c.boomPivot.rotation.z -= this.boomFailureAngle;
    if (c.kind === 'overhead' && c.upper) c.upper.position.y = 10 - Math.min(1.6, this.structuralDeflection || 0);
    if (this.groundSettlement > 0) {
      if (c.kind === 'mobile' && c.outriggers?.length) {
        const support = c.outriggers[1]; support.leg.position.y = .58 - this.groundSettlement * .5;
        support.foot.position.y = .12 - this.groundSettlement; support.pad.position.y = .025 - this.groundSettlement;
      } else if (c.kind === 'overhead' || c.kind === 'tower' || c.kind === 'crawler') c.base.position.y = -this.groundSettlement * .35;
    }

    const windSpeed = this.currentWindSpeed();
    const windN = estimateWindForce({ speed: windSpeed, area: p.area });
    const anchor = this.getHookAnchor();
    const radius = this.getRadius();
    const totalMassTonnes = c.baseMass + p.load + p.rigging + ((this.kind === 'mobile' || this.kind === 'crawler') ? p.counterweight : 0);
    const supportAreaM2 = this.kind === 'mobile' ? 4 * p.mat * p.mat
      : this.kind === 'crawler' ? 2 * 7.4 * .72 * (p.mat / 2)
      : this.kind === 'tower' ? 7 * 7 * (p.mat / 2) ** 2
      : 4 * 1.5 * 1.5 * (p.mat / 2) ** 2;
    const estimatedGroundPressureKPa = totalMassTonnes * 1000 * G / Math.max(.5, supportAreaM2) / 1000;
    const groundUtilization = estimatedGroundPressureKPa / Math.max(1, p.ground);
    const naturalSupportLoss = groundUtilization > 1 ? clamp(1 - (groundUtilization - 1) * .3, .45, 1) : 1;
    const supportLoss = this.fault === 'ground' ? .48 : naturalSupportLoss;
    this.currentSupportLoss = supportLoss;
    const slopeAlignment = Math.abs(Math.cos(deg(p.slopeDirection - (p.slew || 0))));
    const outOfLevelMoment = (c.baseMass + p.load + p.rigging) * 1000 * G * 1.4 * Math.tan(deg(p.outOfLevel)) * slopeAlignment;
    const moment = calculateTrainingMoment({
      payloadTonnes: p.load, riggingTonnes: p.rigging, hookTonnes: c.hookMassTonnes,
      radiusM: radius, windForceN: windN, windHeightM: Math.max(1, anchor.y),
      baseMassTonnes: c.baseMass, counterweightTonnes: (this.kind === 'mobile' || this.kind === 'crawler') ? p.counterweight : 0,
      supportEdgeM: this.getSupportEdge(), counterweightArmM: this.kind === 'crawler' ? 2.8 : 2.2,
      supportLoss
    });
    moment.overturningNm += outOfLevelMoment;
    moment.netOverturningNm = moment.overturningNm - moment.restoringNm;
    moment.ratio = moment.restoringNm > 0 ? moment.overturningNm / moment.restoringNm : Infinity;

    const isSuspendedCrane = ['mobile', 'crawler', 'tower'].includes(this.kind);
    const shouldTip = isSuspendedCrane && moment.ratio > 1.0;
    if (shouldTip) c.tipping = true;
    if (c.tipping && dt > 0) {
      const totalMassKg = (c.baseMass + p.load + p.rigging + p.counterweight) * 1000;
      const inertia = Math.max(250000, totalMassKg * (moment.supportEdgeM ** 2 + 1.8));
      const angularAcceleration = Math.max(-.18, Math.min(.9, moment.netOverturningNm / inertia));
      this.tipVelocity += angularAcceleration * dt;
      this.tipVelocity *= Math.pow(.986, dt * 60);
      this.tipAngle = clamp(this.tipAngle + this.tipVelocity * dt, 0, 1.15);
      this.applyTipTransform(this.tipAngle);
    }

    if ((this.fault === 'ground' || groundUtilization > 1) && dt > 0) {
      const settlementRate = this.fault === 'ground' ? .18 : clamp((groundUtilization - 1) * .08, 0, .12);
      this.groundSettlement = Math.min(.9, this.groundSettlement + dt * settlementRate);
    }
    if (this.fault === 'boom' && dt > 0) {
      this.boomFailureAngle = Math.min(.85, this.boomFailureAngle + dt * .22);
      c.broken = this.boomFailureAngle > .08;
    }
    if (this.gust.duration > 0 && dt > 0) {
      this.gust.time += dt;
      if (this.gust.time >= this.gust.duration) this.gust = { time: 0, duration: 0, peak: 0 };
    }

    // Overhead crane response is a training beam-deflection visualization, not a structural rating.
    if (this.kind === 'overhead') {
      const loadN = (p.load + p.rigging + c.hookMassTonnes) * 1000 * G;
      this.structuralDeflection = Math.min(1.6, loadN / 180000 * .22 + (this.fault === 'boom' ? .55 : 0) + (this.fault === 'overload' ? .8 : 0));
      c.broken = this.structuralDeflection > .8;
    } else this.structuralDeflection = 0;

    // Training-only damped pendulum response to wind and support acceleration.
    const pendLength = Math.max(.8, p.hookHeight);
    const totalSuspendedKg = Math.max(100, (p.load + p.rigging + c.hookMassTonnes) * 1000);
    const windAccel = windN / totalSuspendedKg;
    let supportAccelX = 0, supportAccelZ = 0;
    if (dt > 0 && this.previousHookTop) {
      const velocity = anchor.clone().sub(this.previousHookTop).divideScalar(dt);
      supportAccelX = (velocity.x - this.lastSupportVelocity.x) / dt;
      supportAccelZ = (velocity.z - this.lastSupportVelocity.z) / dt;
      this.lastSupportVelocity.copy(velocity);
    }
    this.previousHookTop = anchor.clone();
    const windDirection = deg(p.windDir);
    stepPendulum(this.pend, dt, {
      length: pendLength,
      windAccel: windAccel * Math.sin(windDirection),
      supportAccel: supportAccelX,
      crosswindAccel: windAccel * Math.cos(windDirection),
      crossSupportAccel: supportAccelZ,
      damping: p.swingDamping
    });

    const rawHookY = anchor.y - p.hookHeight;
    const floorLoadCenterY = .69;
    const hookPos = new THREE.Vector3(anchor.x, Math.max(rawHookY, floorLoadCenterY + 1.1), anchor.z);
    const swingX = Math.sin(this.pend.angleX) * pendLength;
    const swingZ = Math.sin(this.pend.angleZ) * pendLength;
    this.load.hook.position.copy(hookPos);
    const cogDirection = deg(p.slew || 0);
    const rawLoadY = hookPos.y - 1.45;
    const loadY = Math.max(floorLoadCenterY, rawLoadY);
    const loadGroundContact = rawLoadY < floorLoadCenterY + .01;
    this.load.load.position.set(hookPos.x + swingX + Math.cos(cogDirection) * p.loadCoGOffset, loadY, hookPos.z + swingZ + Math.sin(cogDirection) * p.loadCoGOffset);
    this.load.load.rotation.z = this.pend.angleX * .42;
    this.load.load.rotation.x = this.pend.angleZ * .42;
    const areaScale = clamp(Math.sqrt(p.area / 23), .45, 1.65);
    this.load.load.scale.set(areaScale, 1, areaScale);
    this.placeRod(this.load.cable, anchor, hookPos);
    const loadTop = new THREE.Vector3(this.load.load.position.x, this.load.load.position.y + .7, this.load.load.position.z);
    const slingStartL = new THREE.Vector3(hookPos.x - .22, hookPos.y - .2, hookPos.z);
    const slingStartR = new THREE.Vector3(hookPos.x + .22, hookPos.y - .2, hookPos.z);
    const slingOffset = .55 + Math.tan(deg(p.slingAngle)) * .35;
    this.placeRod(this.load.slings[0], slingStartL, new THREE.Vector3(loadTop.x - slingOffset, loadTop.y, loadTop.z));
    this.placeRod(this.load.slings[1], slingStartR, new THREE.Vector3(loadTop.x + slingOffset, loadTop.y, loadTop.z));

    this.updateWindParticles(dt, windSpeed);
    const swingDeg = Math.hypot(this.pend.angleX, this.pend.angleZ) * 180 / Math.PI;
    const antiTwoBlock = p.hookHeight < 1.2;
    const hoistLimit = p.hookHeight > anchor.y - 1.1;
    const highWindTraining = windSpeed >= 20;
    const loadPosition = this.load.load.position;
    const hazardZones = [
      { name: 'warehouse clearance zone', min: [-58, 0, -52], max: [-6, 12, -34] },
      { name: 'container storage zone', min: [21, 0, -42], max: [52, 4, -27] },
      { name: 'perimeter fence zone', min: [-55, 0, 41], max: [55, 4, 45] },
      { name: 'overhead utility-line zone', min: [39, 7, -12], max: [45, 15, -4] }
    ];
    const collision = hazardZones.find(zone => loadPosition.x >= zone.min[0] && loadPosition.x <= zone.max[0]
      && loadPosition.y >= zone.min[1] && loadPosition.y <= zone.max[1]
      && loadPosition.z >= zone.min[2] && loadPosition.z <= zone.max[2]);
    const collisionZone = Boolean(collision) || Math.abs(loadPosition.x) > 55 || Math.abs(loadPosition.z) > 55;
    this.lastMetrics = {
      windN, windSpeed, radius, momentRatio: moment.ratio, overturningNm: moment.overturningNm,
      restoringNm: moment.restoringNm, tippingTrigger: shouldTip, pendulumDeg: swingDeg,
      loadSwingSpeed: Math.hypot(this.pend.velocityX, this.pend.velocityZ) * pendLength,
      antiTwoBlock, hoistLimit, highWindTraining, collisionZone, collisionName: collision?.name || 'site boundary', loadGroundContact, anchorHeight: anchor.y,
      groundPressureKPa: estimatedGroundPressureKPa, groundUtilization, groundSettlement: this.groundSettlement,
      unstableRigging: Math.abs(p.loadCoGOffset) > .55,
      slingTensionKN: ((p.load + p.rigging) * 1000 * G * Math.max(
        clamp((.55 - p.loadCoGOffset) / 1.1, 0, 1),
        clamp((.55 + p.loadCoGOffset) / 1.1, 0, 1)
      )) / Math.max(.25, Math.cos(deg(p.slingAngle))) / 1000,
      structuralDeflection: this.structuralDeflection || 0
    };
  }

  updateWindParticles(dt, windSpeed) {
    const dir = deg(this.controls.windDir), vx = Math.sin(dir), vz = Math.cos(dir);
    const pos = this.windPoints.geometry.attributes.position;
    const streak = this.windStreaks.geometry.attributes.position;
    const flow = .35 + windSpeed * .11;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      let nx = x + vx * flow * dt * this.windVelocity[i];
      let nz = z + vz * flow * dt * this.windVelocity[i];
      if (Math.abs(nx) > 50) nx -= Math.sign(nx) * 98;
      if (Math.abs(nz) > 45) nz -= Math.sign(nz) * 88;
      const ny = y + Math.sin((i + this.clock.elapsedTime * 2) * .1) * .01;
      pos.setXYZ(i, nx, ny, nz);
      const k = i * 6, tail = Math.min(1.8, .12 + windSpeed * .035);
      streak.setXYZ(i * 2, nx - vx * tail, ny, nz - vz * tail);
      streak.setXYZ(i * 2 + 1, nx, ny, nz);
    }
    pos.needsUpdate = true; streak.needsUpdate = true;
    this.windArrow.position.set(0, 10, 0);
    this.windArrow.setDirection(new THREE.Vector3(vx, 0, vz));
    this.windArrow.setLength(3 + windSpeed * .28, 1, .7);
  }

  placeRod(mesh, a, b) {
    const d = b.clone().sub(a);
    mesh.position.copy(a.clone().add(b).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(VERTICAL, d.clone().normalize());
    mesh.scale.y = Math.max(.01, d.length());
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
  }

  animate = () => {
    if (!this.running) return;
    requestAnimationFrame(this.animate);
    const rawDt = Math.min(.035, this.clock.getDelta());
    const dt = rawDt * clamp(this.controls.simulationSpeed || 1, .25, 2);
    this.update(dt);
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.(this.lastMetrics, this.crane);
  };

  dispose() {
    this.running = false;
    this.disposeLoad();
    this.renderer.dispose();
  }
}

function MISSING_MATERIAL() {
  return new THREE.MeshStandardMaterial({ color: '#aebbc3', metalness: .25, roughness: .55 });
}
