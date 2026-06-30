import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sharedInlineSnippetPath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const apparatusInlineSnippetPath = path.join(repoRoot, 'templates/apparatus-inline-snippet.js');
const outputDir = path.join(repoRoot, 'generated/debug/effect-library-viewer');
const outputPath = path.join(outputDir, 'index.html');

function sceneModuleSource() {
  return String.raw`const {
  createSceneShell,
  createBubbleField,
  createSteamField,
  createSparkField,
  createPourStream,
  createGlowRing,
  createFlamePlume,
  createColorTransition,
  createSmokeField,
  createPrecipitateCloud,
  createGasCollectionBubbles,
  createHeatShimmer,
} = globalThis.ChemSharedLib;

const {
  THREE,
  createApparatusFromPreset,
  getRegisteredApparatusPresetDefinition,
  clearWater,
  diluteAcid,
  blueSolution,
  yellowPrecipitate,
  denseSteam,
  burnerFlame,
} = globalThis.ChemApparatusLib;

const canvas = document.getElementById('stage');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const effectButtons = document.getElementById('effectButtons');
const chemicalButtons = document.getElementById('chemicalButtons');
const vesselSelect = document.getElementById('vesselSelect');
const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
const tabPanels = Array.from(document.querySelectorAll('[data-panel]'));
const playPauseButton = document.getElementById('playPauseBtn');
const resetButton = document.getElementById('resetBtn');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const gridToggle = document.getElementById('gridToggle');
const axesToggle = document.getElementById('axesToggle');
const originToggle = document.getElementById('originToggle');
const metadataDump = document.getElementById('metadataDump');

const shell = createSceneShell({
  canvas,
  theme: 'chem-lab-dark',
  cameraPreset: 'lab-close',
  hud: {
    statusText,
    statusSub,
    reset: resetButton,
  },
});

const { scene, camera, renderer, controls, bench } = shell;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.target.set(0, 1.82, 0);
controls.update();

const stageRoot = new THREE.Group();
bench.add(stageRoot);

const effectRoot = new THREE.Group();
effectRoot.name = 'effect-preview-root';
stageRoot.add(effectRoot);

const chemicalRoot = new THREE.Group();
chemicalRoot.name = 'chemical-preview-root';
stageRoot.add(chemicalRoot);

const benchGuide = new THREE.GridHelper(5.2, 13, 0x4ea3ff, 0x294158);
benchGuide.position.y = 1.335;
benchGuide.material.opacity = 0.2;
benchGuide.material.transparent = true;
scene.add(benchGuide);

const worldAxes = new THREE.AxesHelper(0.85);
worldAxes.position.set(0, 1.34, 0);
scene.add(worldAxes);

const originMarker = new THREE.Group();
originMarker.name = 'origin-marker';
const originDisk = new THREE.Mesh(
  new THREE.TorusGeometry(0.18, 0.012, 8, 36),
  new THREE.MeshBasicMaterial({ color: 0xffc36b, transparent: true, opacity: 0.88 }),
);
originDisk.rotation.x = Math.PI / 2;
const originDot = new THREE.Mesh(
  new THREE.SphereGeometry(0.035, 18, 12),
  new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
);
originMarker.position.set(0, 1.36, 0);
originMarker.add(originDisk, originDot);
scene.add(originMarker);

const effectOrigin = new THREE.Vector3(0, 1.66, 0);
const pourSource = new THREE.Object3D();
const pourTarget = new THREE.Object3D();
pourSource.position.set(-0.55, 2.14, 0);
pourTarget.position.set(0.48, 1.56, 0);
effectRoot.add(pourSource, pourTarget);

const pourGuideMaterial = new THREE.MeshBasicMaterial({
  color: 0xaee9ff,
  transparent: true,
  opacity: 0.38,
});
const pourGuideA = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 12), pourGuideMaterial);
const pourGuideB = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 12), pourGuideMaterial.clone());
pourGuideA.position.copy(pourSource.position);
pourGuideB.position.copy(pourTarget.position);
effectRoot.add(pourGuideA, pourGuideB);

const effectDefinitions = [
  {
    key: 'bubble-field',
    label: 'Bubble Field',
    description: 'Rising translucent bubbles for gas release or boiling.',
    create: () => createBubbleField({ parent: effectRoot, count: 150, size: 0.22 }),
  },
  {
    key: 'steam-field',
    label: 'Steam Field',
    description: 'Soft drifting vapor plume for heating and evaporation.',
    create: () => createSteamField({ parent: effectRoot, count: 130, size: 1.0 }),
  },
  {
    key: 'spark-field',
    label: 'Spark Field',
    description: 'Short-lived warm particles for ignition and active reactions.',
    create: () => createSparkField({ parent: effectRoot, count: 90, size: 0.2 }),
  },
  {
    key: 'flame-plume',
    label: 'Flame Plume',
    description: 'Blue additive cone flame with flicker intensity.',
    create: () => createFlamePlume({ parent: effectRoot, height: 0.82, radius: 0.18 }),
  },
  {
    key: 'glow-ring',
    label: 'Glow Ring',
    description: 'Pulsing torus highlight for reaction origin emphasis.',
    create: () => createGlowRing({ parent: effectRoot, radius: 0.62, tube: 0.035 }),
  },
  {
    key: 'pour-stream',
    label: 'Pour Stream',
    description: 'Oriented liquid stream between two anchor points.',
    create: () => createPourStream({ parent: effectRoot, radius: 0.045 }),
  },
  {
    key: 'smoke-field',
    label: 'Smoke Field',
    description: 'Dense gray smoke for incomplete combustion and visible gas release.',
    create: () => createSmokeField({ parent: effectRoot, count: 160, size: 1.16 }),
  },
  {
    key: 'precipitate-cloud',
    label: 'Precipitate Cloud',
    description: 'Suspended solid particles for precipitation inside a liquid.',
    create: () => createPrecipitateCloud({ parent: effectRoot, count: 180, size: 0.18 }),
  },
  {
    key: 'gas-collection-bubbles',
    label: 'Gas Collection Bubbles',
    description: 'Directed bubble stream for gas delivery into a collection vessel.',
    create: () => createGasCollectionBubbles({ parent: effectRoot, count: 145, size: 0.2 }),
  },
  {
    key: 'heat-shimmer',
    label: 'Heat Shimmer',
    description: 'Subtle rising distortion marker above a heat source.',
    create: () => createHeatShimmer({ parent: effectRoot, radius: 0.42, height: 0.9 }),
  },
  {
    key: 'color-change-wash',
    label: 'Color Change Wash',
    description: 'Material transition preview for indicators and reaction color changes.',
    create: () => createColorChangeWash(),
  },
];

const chemicalDefinitions = [
  { key: 'clearWater', label: 'Clear Water', description: 'Transparent blue-tinted classroom water.', factory: clearWater },
  { key: 'diluteAcid', label: 'Dilute Acid', description: 'Pale translucent acid appearance.', factory: diluteAcid },
  { key: 'blueSolution', label: 'Blue Solution', description: 'Copper-salt style blue solution.', factory: blueSolution },
  { key: 'yellowPrecipitate', label: 'Yellow Precipitate', description: 'Opaque yellow precipitate suspension.', factory: yellowPrecipitate },
  { key: 'denseSteam', label: 'Dense Steam', description: 'Faint milky appearance for vapor-heavy content.', factory: denseSteam },
  { key: 'burnerFlame', label: 'Burner Flame', description: 'Warm orange emissive flame material sample.', factory: burnerFlame },
];

const vesselCandidates = [
  { key: 'beaker', label: 'Beaker' },
  { key: 'test-tube', label: 'Test Tube' },
  { key: 'evaporating-dish', label: 'Evaporating Dish' },
].filter((candidate) => Boolean(getRegisteredApparatusPresetDefinition(candidate.key)));

const state = {
  tab: 'effects',
  activeEffectKey: effectDefinitions[0].key,
  activeChemicalKey: chemicalDefinitions[0].key,
  activeVesselKey: vesselCandidates[0]?.key || 'beaker',
  effect: null,
  chemicalApparatus: null,
  playing: true,
  intensity: Number(intensitySlider.value),
  elapsed: 0,
};

function safeJson(value) {
  return JSON.stringify(
    value,
    (key, current) => {
      if (current instanceof THREE.Vector3) {
        return { x: Number(current.x.toFixed(3)), y: Number(current.y.toFixed(3)), z: Number(current.z.toFixed(3)) };
      }
      if (current && current.isColor) {
        return '#' + current.getHexString();
      }
      if (typeof current === 'number') {
        return Number.isFinite(current) ? Number(current.toFixed(4)) : current;
      }
      return current;
    },
    2,
  );
}

function setSelectedButton(container, key) {
  for (const button of Array.from(container.querySelectorAll('button[data-key]'))) {
    button.classList.toggle('active', button.dataset.key === key);
  }
}

function setStatus(title, subtitle) {
  statusText.textContent = title;
  statusSub.textContent = subtitle;
}

function clearGroup(group) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

function restorePourAnchors() {
  effectRoot.add(pourSource, pourTarget, pourGuideA, pourGuideB);
}

function findEffectDefinition(key) {
  return effectDefinitions.find((definition) => definition.key === key) || effectDefinitions[0];
}

function findChemicalDefinition(key) {
  return chemicalDefinitions.find((definition) => definition.key === key) || chemicalDefinitions[0];
}

function createColorChangeWash() {
  const apparatus = createApparatusFromPreset('beaker', {
    parent: effectRoot,
    name: 'effect_color_change_beaker',
    position: [0, 0, 0],
    appearance: blueSolution(),
    fillRatio: 0.62,
    visualProfile: 'clear-inspection',
    halo: 'soft',
  });
  if (apparatus?.meshes?.labelPlane) {
    apparatus.meshes.labelPlane.visible = false;
  }
  placeOnBench(apparatus);

  const liquidTransition = createColorTransition({
    material: apparatus.meshes.liquid.material,
    from: 0x6ab9ff,
    to: 0xf1d36b,
  });
  const surfaceTransition = createColorTransition({
    material: apparatus.meshes.liquidSurface.material,
    from: 0xaadfff,
    to: 0xffe794,
  });

  function setIntensity(intensity = 0, elapsed = 0) {
    const value = Math.max(0, Math.min(1, intensity));
    const wave = value * (0.5 + Math.sin(elapsed * 1.25) * 0.5);
    liquidTransition.setProgress(wave);
    surfaceTransition.setProgress(wave);
    apparatus.meshes.liquid.material.opacity = 0.44 + wave * 0.22;
    apparatus.meshes.liquidSurface.material.opacity = 0.3 + wave * 0.22;
    apparatus.meshes.liquid.material.needsUpdate = true;
    apparatus.meshes.liquidSurface.material.needsUpdate = true;
  }

  function update(_dt = 1 / 60, elapsed = 0) {
    setIntensity(1, elapsed);
  }

  function reset() {
    liquidTransition.reset();
    surfaceTransition.reset();
  }

  return { apparatus, setIntensity, update, reset };
}

function refreshDebugVisibility() {
  benchGuide.visible = gridToggle.checked;
  worldAxes.visible = axesToggle.checked;
  originMarker.visible = originToggle.checked;
}

function updatePlayButton() {
  playPauseButton.textContent = state.playing ? 'Pause' : 'Play';
}

function resetEffect() {
  const definition = findEffectDefinition(state.activeEffectKey);
  clearGroup(effectRoot);
  restorePourAnchors();
  state.effect = definition.create();
  state.elapsed = 0;
  if (state.effect?.mesh) {
    state.effect.mesh.position.copy(effectOrigin);
  }
  if (state.effect?.group) {
    state.effect.group.position.copy(effectOrigin);
  }
  if (state.effect?.reset) {
    state.effect.reset();
  }
  setSelectedButton(effectButtons, definition.key);
  metadataDump.textContent = safeJson({
    mode: 'effects',
    key: definition.key,
    label: definition.label,
    description: definition.description,
    playing: state.playing,
    intensity: state.intensity,
    controls: ['play-pause', 'reset', 'intensity', 'grid', 'axes', 'origin'],
  });
  setStatus('Effect preview: ' + definition.key, definition.description);
}

function placeOnBench(apparatus) {
  if (!apparatus?.group) {
    return;
  }
  apparatus.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(apparatus.group);
  if (!Number.isFinite(box.min.y)) {
    return;
  }
  apparatus.group.position.y += 1.34 - box.min.y;
  apparatus.group.updateMatrixWorld(true);
}

function createOptionsForChemical(vesselKey, appearance) {
  const options = {
    parent: chemicalRoot,
    name: 'chemical_' + vesselKey.replace(/[^a-z0-9]+/gi, '_'),
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    appearance,
    fillRatio: vesselKey === 'test-tube' ? 0.46 : 0.62,
  };
  if (vesselKey === 'beaker') {
    options.visualProfile = 'clear-inspection';
    options.halo = 'soft';
  }
  return options;
}

function loadChemical() {
  const definition = findChemicalDefinition(state.activeChemicalKey);
  const vesselDefinition = getRegisteredApparatusPresetDefinition(state.activeVesselKey)
    || getRegisteredApparatusPresetDefinition('beaker')
    || getRegisteredApparatusPresetDefinition('test-tube');
  const vesselKey = vesselDefinition?.key || state.activeVesselKey;

  clearGroup(chemicalRoot);
  state.chemicalApparatus = createApparatusFromPreset(
    vesselKey,
    createOptionsForChemical(vesselKey, definition.factory()),
  );
  if (typeof state.chemicalApparatus?.controllers?.setLiquidLevel === 'function') {
    state.chemicalApparatus.controllers.setLiquidLevel(vesselKey === 'test-tube' ? 0.46 : 0.62);
  }
  if (state.chemicalApparatus?.meshes?.labelPlane) {
    state.chemicalApparatus.meshes.labelPlane.visible = false;
  }
  placeOnBench(state.chemicalApparatus);

  setSelectedButton(chemicalButtons, definition.key);
  metadataDump.textContent = safeJson({
    mode: 'chemicals',
    key: definition.key,
    label: definition.label,
    description: definition.description,
    vessel: vesselKey,
    availableVessels: vesselCandidates.map((candidate) => candidate.key),
    appearance: definition.factory().name,
  });
  setStatus('Chemical preview: ' + definition.key, vesselKey + ' preview using apparatus material hooks.');
}

function setTab(tab) {
  state.tab = tab;
  effectRoot.visible = tab === 'effects';
  chemicalRoot.visible = tab === 'chemicals';
  for (const button of tabButtons) {
    button.classList.toggle('active', button.dataset.tab === tab);
  }
  for (const panel of tabPanels) {
    panel.hidden = panel.dataset.panel !== tab;
  }
  if (tab === 'effects') {
    resetEffect();
  } else {
    loadChemical();
  }
}

function updateEffect(dt) {
  if (state.tab !== 'effects' || !state.effect) {
    return;
  }

  state.elapsed += dt;
  const activeIntensity = state.playing ? state.intensity : 0;
  const origin = effectOrigin;

  if (state.effect.setEndpoints && state.activeEffectKey === 'gas-collection-bubbles') {
    state.effect.setEndpoints(pourSource, pourTarget);
  }
  if (state.effect.burst && state.playing) {
    const burstOrigin = state.activeEffectKey === 'gas-collection-bubbles' && state.effect.source
      ? state.effect.source
      : origin;
    state.effect.burst(burstOrigin, activeIntensity, dt);
  }
  if (state.effect.update) {
    state.effect.update(dt, state.elapsed);
  }
  if (state.effect.setIntensity) {
    state.effect.setIntensity(activeIntensity, state.elapsed);
  }
  if (state.effect.positionAt) {
    state.effect.positionAt(origin);
  }
  if (state.effect.mesh && state.activeEffectKey === 'glow-ring') {
    state.effect.mesh.position.copy(origin);
  }
  if (state.effect.setEndpoints && state.activeEffectKey !== 'gas-collection-bubbles') {
    if (activeIntensity > 0) {
      state.effect.setEndpoints(pourSource, pourTarget, activeIntensity);
    } else {
      state.effect.reset();
    }
  }

  pourGuideA.visible = state.activeEffectKey === 'pour-stream' || state.activeEffectKey === 'gas-collection-bubbles';
  pourGuideB.visible = state.activeEffectKey === 'pour-stream' || state.activeEffectKey === 'gas-collection-bubbles';
}

for (const definition of effectDefinitions) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.key = definition.key;
  button.textContent = definition.label;
  button.addEventListener('click', () => {
    state.activeEffectKey = definition.key;
    resetEffect();
  });
  effectButtons.append(button);
}

for (const definition of chemicalDefinitions) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.key = definition.key;
  button.textContent = definition.label;
  button.addEventListener('click', () => {
    state.activeChemicalKey = definition.key;
    loadChemical();
  });
  chemicalButtons.append(button);
}

for (const candidate of vesselCandidates) {
  const option = document.createElement('option');
  option.value = candidate.key;
  option.textContent = candidate.label;
  vesselSelect.append(option);
}
vesselSelect.disabled = vesselCandidates.length <= 1;
vesselSelect.value = state.activeVesselKey;

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setTab(button.dataset.tab));
});
playPauseButton.addEventListener('click', () => {
  state.playing = !state.playing;
  updatePlayButton();
  if (!state.playing && state.effect?.setIntensity) {
    state.effect.setIntensity(0, state.elapsed);
  }
  if (!state.playing && state.effect?.setEndpoints) {
    state.effect.reset();
  }
  metadataDump.textContent = safeJson({
    mode: 'effects',
    key: state.activeEffectKey,
    playing: state.playing,
    intensity: state.intensity,
  });
});
resetButton.addEventListener('click', () => {
  if (state.tab === 'effects') {
    resetEffect();
  } else {
    loadChemical();
  }
});
intensitySlider.addEventListener('input', () => {
  state.intensity = Number(intensitySlider.value);
  intensityValue.textContent = state.intensity.toFixed(2);
});
vesselSelect.addEventListener('change', () => {
  state.activeVesselKey = vesselSelect.value;
  loadChemical();
});
gridToggle.addEventListener('change', refreshDebugVisibility);
axesToggle.addEventListener('change', refreshDebugVisibility);
originToggle.addEventListener('change', refreshDebugVisibility);

refreshDebugVisibility();
updatePlayButton();
intensityValue.textContent = state.intensity.toFixed(2);
setTab('effects');

let previousTime = performance.now();
function animate(now = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
  previousTime = now;
  controls.update();
  originDot.scale.setScalar(0.9 + Math.sin(now * 0.004) * 0.12);
  updateEffect(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
`;
}

function buildHtml({ sharedInlineSnippet, apparatusInlineSnippet, sceneInlineCode }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Effect + Chemical Library Viewer</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #071019;
        --panel: rgba(10, 18, 29, 0.88);
        --panel-soft: rgba(20, 34, 50, 0.74);
        --border: rgba(120, 183, 255, 0.24);
        --text: #edf6ff;
        --muted: #9ab6d2;
        --accent: #72c8ff;
        --warm: #ffb363;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        height: 100%;
        overflow: hidden;
        background: radial-gradient(circle at top, #13263a 0%, var(--bg) 56%, #04080d 100%);
        color: var(--text);
        font-family: "Segoe UI", system-ui, sans-serif;
      }
      #stage { width: 100vw; height: 100vh; display: block; }
      .shell {
        position: fixed;
        inset: 0;
        pointer-events: none;
        display: grid;
        grid-template-columns: 330px 1fr 360px;
        gap: 14px;
        padding: 14px;
      }
      .panel {
        pointer-events: auto;
        backdrop-filter: blur(16px);
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
        overflow: hidden;
        min-height: 0;
      }
      .panel-body {
        padding: 14px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        height: 100%;
        min-height: 0;
      }
      .eyebrow { color: var(--accent); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      h1, h2, p { margin: 0; }
      h1 { font-size: 22px; line-height: 1.1; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
      p { color: var(--muted); line-height: 1.4; }
      label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; }
      button, select, input[type="range"] {
        width: 100%;
        font: inherit;
      }
      button, select {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 12px;
        background: var(--panel-soft);
        color: var(--text);
      }
      button { cursor: pointer; }
      button.active {
        border-color: rgba(114, 200, 255, 0.72);
        background: linear-gradient(135deg, rgba(56, 137, 190, 0.46), rgba(255, 179, 99, 0.16));
      }
      button:disabled, select:disabled {
        opacity: 0.58;
        cursor: default;
      }
      .segmented {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .button-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }
      .toggle-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
      }
      .toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 12px;
        background: var(--panel-soft);
      }
      .toggle input { margin: 0; }
      .control-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .stat-box {
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: rgba(8, 17, 27, 0.45);
      }
      .scroll {
        min-height: 0;
        overflow: auto;
      }
      .range-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      pre {
        margin: 0;
        padding: 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.05);
        background: rgba(0, 0, 0, 0.24);
        color: #cce6ff;
        font-size: 12px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
      }
      [hidden] { display: none !important; }
      .status-bar {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        width: min(760px, calc(100vw - 32px));
        pointer-events: auto;
        backdrop-filter: blur(16px);
        background: rgba(8, 17, 27, 0.78);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      #statusText { font-weight: 600; }
      #statusSub { color: var(--muted); font-size: 13px; }
      @media (max-width: 1200px) {
        .shell { grid-template-columns: 300px 1fr 320px; }
      }
      @media (max-width: 980px) {
        html, body { overflow: auto; }
        .shell {
          position: relative;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
          align-content: start;
          overflow: visible;
        }
        .panel { min-height: 260px; }
        .status-bar {
          position: relative;
          transform: none;
          left: auto;
          bottom: auto;
          width: auto;
          margin: 0 14px 14px;
        }
      }
    </style>
  </head>
  <body>
    <canvas id="stage"></canvas>
    <div class="shell">
      <section class="panel">
        <div class="panel-body">
          <div>
            <div class="eyebrow">Debug Viewer</div>
            <h1>Effects + Chemicals</h1>
            <p>Preview reusable particle effects and chemical appearances on the shared Three scene shell.</p>
          </div>
          <div class="segmented" role="tablist" aria-label="Viewer mode">
            <button class="active" type="button" data-tab="effects">Effects</button>
            <button type="button" data-tab="chemicals">Chemicals</button>
          </div>
          <div data-panel="effects">
            <h2>Effect Assets</h2>
            <div id="effectButtons" class="button-grid" aria-label="Effects"></div>
          </div>
          <div data-panel="chemicals" hidden>
            <h2>Chemical Assets</h2>
            <div id="chemicalButtons" class="button-grid" aria-label="Chemicals"></div>
            <div style="margin-top: 12px;">
              <label for="vesselSelect">Preview Vessel</label>
              <select id="vesselSelect"></select>
            </div>
          </div>
        </div>
      </section>
      <div></div>
      <section class="panel">
        <div class="panel-body">
          <div class="control-row">
            <button id="playPauseBtn" type="button">Pause</button>
            <button id="resetBtn" type="button">Reset</button>
          </div>
          <div class="stat-box">
            <div class="range-head">
              <h2>Intensity</h2>
              <span id="intensityValue">0.72</span>
            </div>
            <input id="intensitySlider" type="range" min="0" max="1" step="0.01" value="0.72" />
          </div>
          <div class="toggle-row">
            <label class="toggle"><input id="gridToggle" type="checkbox" checked /> Grid</label>
            <label class="toggle"><input id="axesToggle" type="checkbox" checked /> Axes</label>
            <label class="toggle"><input id="originToggle" type="checkbox" checked /> Origin</label>
          </div>
          <div class="stat-box scroll">
            <h2>Active Asset</h2>
            <pre id="metadataDump"></pre>
          </div>
        </div>
      </section>
    </div>
    <div class="status-bar">
      <div id="statusText">Initializing viewer...</div>
      <div id="statusSub">Orbit to inspect the scene; use tabs to switch libraries.</div>
    </div>
    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js"
        }
      }
    </script>
    <script type="module">
      import * as THREE from 'three';
      import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';

      globalThis.THREE = THREE;
      globalThis.OrbitControls = OrbitControls;
${indent(sharedInlineSnippet.trim(), 6)}
${indent(apparatusInlineSnippet.trim(), 6)}
    </script>
    <script type="module">
${indent(sceneInlineCode.trim(), 6)}
    </script>
  </body>
</html>
`;
}

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value.split('\n').map((line) => `${prefix}${line}`).join('\n');
}

async function main() {
  const [sharedInlineSnippet, apparatusInlineSnippet] = await Promise.all([
    fs.readFile(sharedInlineSnippetPath, 'utf8'),
    fs.readFile(apparatusInlineSnippetPath, 'utf8'),
  ]);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    outputPath,
    buildHtml({
      sharedInlineSnippet,
      apparatusInlineSnippet,
      sceneInlineCode: sceneModuleSource(),
    }),
  );

  process.stdout.write(`${path.relative(repoRoot, outputPath)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
