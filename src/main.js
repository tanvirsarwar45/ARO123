import './style.css';
import { CraneSimulation } from './sim/Simulation.js';

import { clampControlValue, stepControlValue } from './sim/controlValues.js';
import { FAMILY_CONFIG, ENVIRONMENT_SPECS, DEFAULT_CONTROLS } from './sim/config.js';

const app = document.querySelector('#app');
app.innerHTML = `
<header class="topbar">
  <div class="brand"><span class="brand-icon">⚒</span><div><b>CRANE TRAINING LAB</b><small>3D OPERATOR DEVELOPMENT ENVIRONMENT</small></div></div>
  <div class="top-meta"><span class="live-dot"></span> LOCAL SIMULATION <i></i> TRAINING DATA ONLY</div>
  <div class="top-actions"><button id="reset" class="ghost">↺ Reset all</button><button id="fullscreen" class="ghost">⛶</button></div>
</header>
<main class="layout">
  <aside class="leftcol">
    <section class="panel model-panel">
      <div class="eyebrow">SIMULATION ASSET</div><h2>Crane configuration</h2>
      <label class="field-label" for="family">Crane family</label>
      <select id="family">
        <option value="mobile">Mobile hydraulic crane</option><option value="tower">Tower crane</option>
        <option value="crawler">Crawler lattice-boom crane</option><option value="overhead">Overhead / gantry crane</option>
      </select>
      <div class="asset-state"><span class="state-dot"></span><div><b id="assetTitle">Generic mobile hydraulic crane</b><small id="assetDescription">Procedural training geometry · no manufacturer data loaded</small></div></div>
      <div class="disclaimer">MODEL STATUS: <strong>UNVERIFIED TRAINING ASSET</strong><br>Rated capacity, stability approval and certified operating limits are unavailable.</div>
    </section>
    <section class="panel telemetry">
      <div class="panel-head"><div><div class="eyebrow">LIVE TELEMETRY</div><h2>Operating state</h2></div><span class="pill neutral" id="statePill">NORMAL</span></div>
      <div class="metric-grid">
        <div class="metric"><small>Payload input</small><b id="mLoad">16.0 t</b></div>
        <div class="metric"><small>Horizontal reach estimate</small><b id="mRadius">12.1 m</b></div>
        <div class="metric"><small>Effective wind speed</small><b id="mWind">25.0 m/s</b></div>
        <div class="metric"><small>Wind force estimate</small><b id="mWindForce">— kN</b></div>
        <div class="metric"><small>Ground pressure estimate*</small><b id="mGroundPressure">— kPa</b></div>
        <div class="metric"><small>2-leg sling tension estimate*</small><b id="mSlingTension">— kN / leg</b></div>
      </div>
      <div class="telemetry-foot"><span>Load swing angle</span><b id="mSwing">0.0°</b></div>
      <div class="telemetry-foot"><span>Training moment ratio*</span><b id="mRisk">—</b></div>
      <div class="fineprint">*Generic training model only. Not rated capacity or approved stability.</div>
    </section>
    <section class="panel events">
      <div class="panel-head"><div><div class="eyebrow">EVENT MONITOR</div><h2>Safety & event log</h2></div><span class="pill neutral">SESSION</span></div>
      <div id="eventList" class="event-list"><div class="event-row"><span class="event-mark"></span><div><b>Simulation initialized</b><small>Generic training model. Engineering approval outputs disabled.</small></div></div></div>
    </section>
  </aside>

  <section class="stage">
    <div class="stage-top"><div><span class="eyebrow">VIRTUAL JOBSITE</span><h1 id="sceneTitle">Mobile hydraulic crane · lift practice</h1></div>
      <div class="stage-tools"><button id="viewReset" class="tool">◎ <span>Reset view</span></button><button id="pause" class="tool">Ⅱ <span>Pause</span></button></div>
    </div>
    <div class="canvas-wrap">
      <canvas id="scene" aria-label="Interactive three-dimensional crane training scene"></canvas>
      <div class="scene-badge"><span class="live-dot"></span> LIVE TRAINING PHYSICS</div>
      <div class="wind-overlay"><span>WIND VECTOR</span><b id="windReadout">25 m/s · 90°</b></div>
      <div class="scene-hint">DRAG TO ORBIT · SCROLL TO ZOOM · RIGHT-DRAG TO PAN</div>
    </div>
    <div class="bottom-strip">
      <div><small>ENVIRONMENT</small><b>Industrial construction site</b></div><div><small>PHYSICS STEP</small><b>Fixed frame cap · variable render</b></div>
      <div><small>RENDERER</small><b>WebGL / Three.js</b></div><div><small>VALIDATION</small><b class="amber">Training-only model</b></div>
    </div>
  </section>

  <aside class="rightcol">
    <section class="panel controls" id="controlsPanel">
      <div class="panel-head"><div><div class="eyebrow">OPERATOR CONSOLE</div><h2>Machine controls</h2></div><span class="pill active">MANUAL</span></div>
      <div class="control-help">Every variable has a slider, editable number and − / + step buttons. Changes update the 3D crane immediately.</div>
      <div class="control-section"><div class="control-section-title">CRANE-SPECIFIC MOVEMENT</div><div id="controlFields"></div></div>
      <div class="control-divider"></div>
      <div class="control-section"><div class="control-section-title">PAYLOAD, RIGGING & ENVIRONMENT</div><div id="environmentFields"></div></div>
      <div class="control-divider"></div>
      <div class="control-section"><div class="control-section-title">OPERATOR QUICK ACTIONS</div>
        <div id="quickActions" class="quick-actions"></div>
      </div>
      <div class="status-line"><span class="live-dot"></span><span id="controlStatus">Controls connected · generic training model</span></div>
    </section>
    <section class="panel fault-panel">
      <div class="panel-head"><div><div class="eyebrow">INSTRUCTOR TOOLKIT</div><h2>Inject training event</h2></div><span class="pill danger">FAULTS</span></div>
      <div class="fault-grid"><button data-fault="gust">Wind gust</button><button data-fault="ground">Ground failure</button><button data-fault="overload">Overload event</button><button data-fault="boom">Boom / girder fault</button></div>
      <button id="recover" class="recover">↺ Reset fault / recover scene</button>
      <p class="fineprint">Instructor events are controlled training effects. They are not predictions of real crane failure thresholds.</p>
    </section>
  </aside>
</main>
<footer class="footer"><div class="footer-brand">CTL <span>CRANE TRAINING LAB</span></div><nav><button class="selected">Simulator</button><button id="scenarioTab">Scenarios</button><button id="auditTab">Validation & audit</button></nav><div class="footer-right"><span class="live-dot"></span> Browser session · not certified for real lifts</div></footer>
<div id="modal" class="modal hidden"><div class="modal-card"><button id="modalClose" class="modal-close">×</button><div id="modalBody"></div></div></div>
<div id="bootError" class="boot-error hidden"></div>`;

const $ = id => document.getElementById(id);
let sim;
let activeKind = 'mobile';
let paused = false;
let lastEventFlags = new Set();
const familyDefaults = {
  mobile: { boomAngle: 48, boomLength: 18, slew: 0, hookHeight: 7, outriggerSpread: 100, counterweight: 26.1, hoistSpeed: .35, slewSpeed: .35, boomSpeed: 3, telescopeSpeed: .35 },
  tower: { trolley: 8, hookHeight: 7, slew: 0, hoistSpeed: .35, slewSpeed: .25, trolleySpeed: .35 },
  crawler: { boomAngle: 48, boomLength: 18, slew: 0, hookHeight: 7, counterweight: 20, hoistSpeed: .35, slewSpeed: .3, travelX: 0, travelSpeed: .2, boomSpeed: 3, telescopeSpeed: .35 },
  overhead: { bridgeX: 0, trolley: 0, hookHeight: 7, hoistSpeed: .35, bridgeSpeed: .35, trolleySpeed: .35 }
};
const sharedDefaults = {
  load: 16, rigging: 1.9, wind: 25, windDir: 90, gustMultiplier: 1.5, area: 23, loadCoGOffset: 0,
  ground: 150, mat: 2, outOfLevel: 0, slingAngle: 15, slopeDirection: 0, swingDamping: .2, simulationSpeed: 1
};

function specsForKind(kind) { return FAMILY_CONFIG[kind].machine; }
function findSpec(key) {
  return specsForKind(activeKind).find(spec => spec[0] === key) || ENVIRONMENT_SPECS.find(spec => spec[0] === key);
}
function formatNumber(value, step) {
  const decimals = (String(step).split('.')[1] || '').length;
  return Number(value).toFixed(Math.min(3, decimals));
}
function sliderMarkup([id, label, unit, min, max, step], value) {
  const safe = clampControlValue(value, min, max, step);
  const pct = ((safe - min) / (max - min)) * 100;
  return `<div class="slider-row" data-control-row="${id}">
    <div class="slider-label"><label for="${id}Number">${label}</label>
      <div class="value-stepper">
        <button class="step-btn" type="button" data-step="-1" data-key="${id}" aria-label="Decrease ${label}" title="Decrease">−</button>
        <input class="number-input" id="${id}Number" data-key="${id}" type="number" min="${min}" max="${max}" step="${step}" value="${formatNumber(safe, step)}" aria-label="${label} numeric value">
        <span class="unit-label">${unit}</span>
        <button class="step-btn" type="button" data-step="1" data-key="${id}" aria-label="Increase ${label}" title="Increase">+</button>
      </div>
    </div>
    <input class="range-input" id="${id}Range" data-key="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${safe}" style="--fill:${pct}%" aria-label="${label} slider">
    <div class="range-bounds"><span>${min} ${unit}</span><span>${max} ${unit}</span></div>
  </div>`;
}
function renderControls(kind) {
  activeKind = kind;
  const cfg = FAMILY_CONFIG[kind];
  $('assetTitle').textContent = cfg.title;
  $('assetDescription').textContent = 'Procedural family-specific training geometry · no manufacturer data loaded';
  $('sceneTitle').textContent = cfg.scene;
  $('controlFields').innerHTML = cfg.machine.map(spec => sliderMarkup(spec, sim.controls[spec[0]])).join('');
  $('environmentFields').innerHTML = ENVIRONMENT_SPECS.map(spec => sliderMarkup(spec, sim.controls[spec[0]])).join('');
  $('controlStatus').textContent = `${cfg.title} · ${cfg.machine.length + ENVIRONMENT_SPECS.length} adjustable parameters`;
  const quick = kind === 'mobile'
    ? [['Boom raise','boomAngle',1],['Boom lower','boomAngle',-1],['Extend boom','boomLength',1],['Retract boom','boomLength',-1],['Hoist up','hookHeight',-1],['Hoist down','hookHeight',1],['Slew left','slew',-1],['Slew right','slew',1]]
    : kind === 'crawler'
      ? [['Boom raise','boomAngle',1],['Boom lower','boomAngle',-1],['Extend boom','boomLength',1],['Retract boom','boomLength',-1],['Hoist up','hookHeight',-1],['Hoist down','hookHeight',1],['Slew left','slew',-1],['Slew right','slew',1],['Travel +','travelX',1],['Travel −','travelX',-1]]
      : kind === 'tower'
        ? [['Trolley out','trolley',1],['Trolley in','trolley',-1],['Hoist up','hookHeight',-1],['Hoist down','hookHeight',1],['Slew left','slew',-1],['Slew right','slew',1]]
        : [['Bridge +','bridgeX',1],['Bridge −','bridgeX',-1],['Trolley +','trolley',1],['Trolley −','trolley',-1],['Hoist up','hookHeight',-1],['Hoist down','hookHeight',1]];
  $('quickActions').innerHTML = quick.map(([label,key,direction]) => `<button type="button" data-hold-key="${key}" data-hold-direction="${direction}">${label}</button>`).join('');
}

function syncControlWidgets() {
  const specs = [...specsForKind(activeKind), ...ENVIRONMENT_SPECS];
  for (const spec of specs) {
    const [key, , , min, max, step] = spec;
    const range = $(`${key}Range`), number = $(`${key}Number`);
    if (!range || !number) continue;
    const value = clampControlValue(sim.controls[key], min, max, step);
    range.value = String(value); number.value = formatNumber(value, step);
    range.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
  }
}
function applyControlValue(key, rawValue) {
  const spec = findSpec(key); if (!spec) return;
  const [, , , min, max, step] = spec;
  const value = clampControlValue(rawValue, min, max, step);
  sim.setControls({ [key]: value });
  const range = $(`${key}Range`), number = $(`${key}Number`);
  if (range && number) {
    range.value = String(value); number.value = formatNumber(value, step);
    range.style.setProperty('--fill', `${((value - min) / (max - min)) * 100}%`);
  }
}
function bindControlEvents(container) {
  container.addEventListener('input', event => {
    const el = event.target; if (!el.matches('.range-input')) return;
    applyControlValue(el.dataset.key, el.value);
  });
  container.addEventListener('change', event => {
    const el = event.target; if (!el.matches('.number-input')) return;
    if (el.value === '') { syncControlWidgets(); return; }
    applyControlValue(el.dataset.key, el.value);
  });
  container.addEventListener('keydown', event => {
    if (event.target.matches('.number-input') && event.key === 'Enter') event.target.blur();
  });
  container.addEventListener('click', event => {
    const button = event.target.closest('[data-step]'); if (!button) return;
    const key = button.dataset.key, spec = findSpec(key); if (!spec) return;
    const range = $(`${key}Range`); if (!range) return;
    const [, , , min, max, step] = spec;
    applyControlValue(key, stepControlValue(range.value, Number(button.dataset.step), min, max, step));
  });
}

function addEvent(title, description, type = 'info') {
  const row = document.createElement('div'); row.className = 'event-row';
  const mark = document.createElement('span'); mark.className = `event-mark ${type}`;
  const body = document.createElement('div'), strong = document.createElement('b'), small = document.createElement('small');
  strong.textContent = title; small.textContent = description; body.append(strong, small); row.append(mark, body);
  $('eventList').prepend(row);
  while ($('eventList').children.length > 9) $('eventList').lastElementChild.remove();
}
function updateMetrics(metrics, crane) {
  if (!metrics || !sim) return;
  const p = sim.controls;
  $('mLoad').textContent = `${p.load.toFixed(1)} t`;
  $('mRadius').textContent = `${metrics.radius.toFixed(1)} m`;
  $('mWind').textContent = `${metrics.windSpeed.toFixed(1)} m/s`;
  $('mWindForce').textContent = `${(metrics.windN / 1000).toFixed(2)} kN`;
  $('mGroundPressure').textContent = `${metrics.groundPressureKPa.toFixed(0)} kPa`;
  $('mSlingTension').textContent = `${metrics.slingTensionKN.toFixed(1)} kN / leg`;
  $('mSwing').textContent = `${metrics.pendulumDeg.toFixed(1)}°`;
  $('mRisk').textContent = Number.isFinite(metrics.momentRatio) ? `${metrics.momentRatio.toFixed(2)}×` : 'N/A';
  $('windReadout').textContent = `${metrics.windSpeed.toFixed(1)} m/s · ${Math.round(p.windDir)}°`;
  const pill = $('statePill');
  if (crane.tipping || crane.broken) { pill.textContent = 'FAULT EVENT'; pill.className = 'pill danger'; }
  else if (metrics.pendulumDeg > 12 || metrics.highWindTraining || metrics.antiTwoBlock || metrics.hoistLimit) { pill.textContent = 'TRAINING CAUTION'; pill.className = 'pill warn'; }
  else { pill.textContent = 'NORMAL'; pill.className = 'pill neutral'; }
  const flags = [
    ['tip', crane.tipping, 'Tip-over training event', 'Training moment model exceeded its configured restoring-moment proxy.', 'danger'],
    ['boom', crane.broken, 'Boom / girder fault', 'Instructor fault animation is active.', 'danger'],
    ['wind', metrics.highWindTraining, 'High-wind training condition', 'Wind field is in the high-wind training band; no manufacturer limit is implied.', 'warn'],
    ['anti2b', metrics.antiTwoBlock, 'Upper hoist proximity', 'Hook is near the training anti-two-block visualization zone.', 'warn'],
    ['lower', metrics.hoistLimit, 'Hoist travel boundary', 'Hoist payout is near the lower geometry boundary.', 'warn'],
    ['collision', metrics.collisionZone, 'Training obstacle / clearance zone', `Suspended load entered ${metrics.collisionName}.`, 'warn'],
    ['ground', metrics.groundUtilization > 1, 'Training ground index exceeded', 'Estimated average support pressure exceeds the selected training ground index.', 'danger'],
    ['cog', metrics.unstableRigging, 'Load COG outside training sling span', 'The configured load center offset exceeds the illustrative two-leg sling support span.', 'warn'],
    ['floor', metrics.loadGroundContact, 'Load contacted training ground', 'Suspended load has reached the virtual ground plane; further lowering is limited.', 'info']
  ];
  for (const [key, active, title, desc, type] of flags) {
    if (active && !lastEventFlags.has(key)) addEvent(title, desc, type);
    if (active) lastEventFlags.add(key); else lastEventFlags.delete(key);
  }
}
function showModal(title, body) {
  $('modalBody').innerHTML = `<div class="eyebrow">CRANE TRAINING LAB</div><h2>${title}</h2>${body}`;
  $('modal').classList.remove('hidden');
}
function bootError(error) {
  console.error(error);
  const box = $('bootError'); box.textContent = `Simulator control initialization error: ${error?.message || error}. Reload the page after checking the browser console.`;
  box.classList.remove('hidden');
}

try {
  bindControlEvents($('controlFields'));
  bindControlEvents($('environmentFields'));
  // Read the actual selected family before constructing the 3D model. This prevents
  // browser-restored <select> state from disagreeing with the initial crane geometry.
  const initialKind = FAMILY_CONFIG[$('family').value] ? $('family').value : 'mobile';
  $('family').value = initialKind;
  const initialControls = { ...DEFAULT_CONTROLS, ...sharedDefaults, ...familyDefaults[initialKind] };
  sim = new CraneSimulation($('scene'), updateMetrics, initialKind, initialControls);
  renderControls(initialKind);

  $('family').addEventListener('change', event => {
    const kind = event.target.value;
    sim.setCrane(kind, false, { ...sharedDefaults, ...familyDefaults[kind] });
    renderControls(kind);
    lastEventFlags.clear();
    addEvent('Crane family changed', `${FAMILY_CONFIG[kind].title} geometry and its own control set loaded.`);
  });

  $('reset').onclick = () => {
    const kind = $('family').value;
    sim.setCrane(kind, false, { ...DEFAULT_CONTROLS, ...sharedDefaults, ...familyDefaults[kind] });
    renderControls(kind); lastEventFlags.clear();
    addEvent('Simulation reset', 'Current crane family and all variables returned to the training defaults.');
  };
  $('recover').onclick = () => {
    sim.resetFault(); syncControlWidgets(); lastEventFlags.clear();
    addEvent('Recovery action', 'Fault state cleared and pre-event controls restored.');
  };
  document.querySelectorAll('[data-fault]').forEach(button => button.addEventListener('click', () => {
    sim.injectFault(button.dataset.fault); syncControlWidgets();
    addEvent('Instructor event injected', `${button.textContent.trim()} scenario started.`, 'warn');
  }));
  $('pause').onclick = () => {
    paused = !paused; sim.running = !paused;
    if (!paused) { sim.clock.getDelta(); sim.animate(); }
    $('pause').innerHTML = paused ? '▶ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  };
  $('viewReset').onclick = () => {
    const view = activeKind === 'tower' ? [39, 28, 43, 2, 9, 0] : activeKind === 'overhead' ? [34, 22, 34, 0, 5, 0] : [31, 21, 35, 3, 5, 0];
    sim.camera.position.set(view[0], view[1], view[2]); sim.orbit.target.set(view[3], view[4], view[5]); sim.orbit.update();
  };
  $('fullscreen').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();

  const jog = (key, delta) => { const spec = findSpec(key); if (!spec) return; const [, , , min, max, step] = spec; applyControlValue(key, clampControlValue(Number(sim.controls[key]) + delta, min, max, step)); };
  let holdFrame = 0, holdState = null, holdLast = 0, holdAccumulator = 0, suppressQuickClickUntil = 0;
  const stopHold = () => { if (holdFrame) cancelAnimationFrame(holdFrame); holdFrame = 0; holdState = null; };
  const rateFor = key => key === 'hookHeight' ? sim.controls.hoistSpeed
    : key === 'slew' ? sim.controls.slewSpeed * 6
    : key === 'boomAngle' ? sim.controls.boomSpeed
    : key === 'boomLength' ? sim.controls.telescopeSpeed
    : key === 'trolley' ? sim.controls.trolleySpeed
    : key === 'bridgeX' ? sim.controls.bridgeSpeed
    : key === 'travelX' ? sim.controls.travelSpeed : .25;
  const holdTick = now => {
    if (!holdState) return;
    const dt = Math.min(.08, Math.max(0, (now - holdLast) / 1000)); holdLast = now;
    const spec = findSpec(holdState.key);
    if (spec) {
      const step = spec[5]; holdAccumulator += Math.max(0, rateFor(holdState.key)) * dt;
      const count = Math.floor(holdAccumulator / step);
      if (count > 0) { holdAccumulator -= count * step; jog(holdState.key, holdState.direction * count * step); }
    }
    holdFrame = requestAnimationFrame(holdTick);
  };
  $('quickActions').addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-hold-key]'); if (!button) return;
    event.preventDefault(); stopHold(); holdState = { key: button.dataset.holdKey, direction: Number(button.dataset.holdDirection) };
    const spec = findSpec(holdState.key); if (spec) jog(holdState.key, holdState.direction * spec[5]);
    holdLast = performance.now(); holdAccumulator = 0; suppressQuickClickUntil = 0;
    button.classList.add('holding'); holdFrame = requestAnimationFrame(holdTick);
  });
  document.addEventListener('pointerup', () => { stopHold(); suppressQuickClickUntil = performance.now() + 500; document.querySelectorAll('.quick-actions .holding').forEach(button => button.classList.remove('holding')); });
  document.addEventListener('pointercancel', stopHold);
  $('quickActions').addEventListener('click', event => {
    const button = event.target.closest('[data-hold-key]'); if (!button) return;
    if (performance.now() <= suppressQuickClickUntil) { suppressQuickClickUntil = 0; return; }
    const spec = findSpec(button.dataset.holdKey); if (spec) jog(button.dataset.holdKey, Number(button.dataset.holdDirection) * spec[5]);
  });

  $('scenarioTab').onclick = () => showModal('Training scenarios', `
    <div class="scenario-list">
      <button data-preset="baseline">Baseline lift setup <small>Restore the operator's current training values.</small></button>
      <button data-preset="calm">Calm precision lift <small>Low wind, light load, controlled movement.</small></button>
      <button data-preset="gust">Wind gust response <small>Transient gust pulse and visible particle flow.</small></button>
      <button data-preset="overload">Overload demonstration <small>Instructor-controlled high payload event.</small></button>
      <button data-preset="ground">Ground support failure <small>Support settlement and training tip-over response.</small></button>
    </div>`);
  $('auditTab').onclick = () => showModal('Validation & engineering status', `
    <div class="audit-grid">
      <div><b>Crane family geometry</b><span class="ok">Four distinct procedural training models</span></div>
      <div><b>Operator controls</b><span class="ok">Slider, number input and − / + for every exposed variable</span></div>
      <div><b>Wind field</b><span class="ok">Animated particles, streaks, direction and gust pulse</span></div>
      <div><b>Load swing</b><span class="ok">Damped two-axis pendulum training model</span></div>
      <div><b>Tip-over response</b><span class="ok">Moment-balance training model and rotational animation</span></div>
      <div><b>Manufacturer load charts</b><span class="blocked">Not supplied / disabled</span></div>
      <div><b>Approved stability / ground solver</b><span class="blocked">Not implemented</span></div>
      <div><b>Hydraulic / structural validation</b><span class="blocked">Not implemented</span></div>
    </div>
    <p class="modal-note">All masses, dimensions and thresholds are generic training assumptions. These calculations are not a manufacturer's rated capacity, certified stability calculation, lift plan or safety-device approval.</p>`);
  $('modalClose').onclick = () => $('modal').classList.add('hidden');
  $('modal').addEventListener('click', event => { if (event.target === $('modal')) $('modal').classList.add('hidden'); });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-preset]'); if (!button) return;
    const preset = button.dataset.preset;
    if (preset === 'baseline') { sim.setCrane(activeKind, false, { ...DEFAULT_CONTROLS, ...sharedDefaults, ...familyDefaults[activeKind] }); renderControls(activeKind); }
    if (preset === 'calm') sim.setControls({ load: 5, rigging: .6, wind: 2, windDir: 0, area: 5, outOfLevel: 0 });
    if (preset === 'gust') sim.injectFault('gust');
    if (preset === 'overload') sim.injectFault('overload');
    if (preset === 'ground') sim.injectFault('ground');
    syncControlWidgets(); $('modal').classList.add('hidden');
    addEvent('Training scenario started', button.querySelector('small')?.textContent || preset, 'warn');
  });

  document.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    const keys = activeKind === 'mobile' || activeKind === 'crawler'
      ? { w: ['boomAngle', 1], s: ['boomAngle', -1], a: ['slew', -2], d: ['slew', 2], ArrowUp: ['hookHeight', -.2], ArrowDown: ['hookHeight', .2], q: ['boomLength', -.2], e: ['boomLength', .2] }
      : activeKind === 'tower'
        ? { a: ['slew', -2], d: ['slew', 2], ArrowUp: ['hookHeight', -.2], ArrowDown: ['hookHeight', .2], q: ['trolley', -.2], e: ['trolley', .2] }
        : { a: ['bridgeX', -.2], d: ['bridgeX', .2], ArrowUp: ['hookHeight', -.2], ArrowDown: ['hookHeight', .2], q: ['trolley', -.1], e: ['trolley', .1] };
    const action = keys[event.key] || keys[event.key.toLowerCase()];
    if (action && findSpec(action[0])) { event.preventDefault(); jog(action[0], action[1]); }
  });
} catch (error) { bootError(error); }
