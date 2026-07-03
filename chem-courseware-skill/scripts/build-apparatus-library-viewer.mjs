import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ACTIVE_CLASSIC_PRESET_KEYS } from './classic-kit-active-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sharedInlineSnippetPath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const apparatusInlineSnippetPath = path.join(repoRoot, 'templates/apparatus-inline-snippet.js');
const outputDir = path.join(repoRoot, 'generated/debug/apparatus-library-viewer');
const outputPath = path.join(outputDir, 'index.html');

function sceneModuleSource() {
  return String.raw`const { createSceneShell } = globalThis.ChemSharedLib;
const {
  THREE,
  listRegisteredApparatusPresets,
  getRegisteredApparatusPresetDefinition,
  createApparatusFromPreset,
  clearWater,
  blueSolution,
  diluteAcid,
} = globalThis.ChemApparatusLib;

const canvas = document.getElementById('stage');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const presetSelect = document.getElementById('presetSelect');
const anchorList = document.getElementById('anchorList');
const capabilityList = document.getElementById('capabilityList');
const contractDump = document.getElementById('contractDump');
const metaDump = document.getElementById('metaDump');
const anchorsToggle = document.getElementById('anchorsToggle');
const gridToggle = document.getElementById('gridToggle');
const axesToggle = document.getElementById('axesToggle');
const contrastToggle = document.getElementById('contrastToggle');
const debugMaterialToggle = document.getElementById('debugMaterialToggle');
const resetButton = document.getElementById('resetBtn');

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
controls.target.set(0, 1.7, 0);
controls.update();

const stageRoot = new THREE.Group();
bench.add(stageRoot);

const benchGuide = new THREE.GridHelper(4.8, 12, 0x4ea3ff, 0x294158);
benchGuide.position.y = 1.325;
benchGuide.material.opacity = 0.22;
benchGuide.material.transparent = true;
scene.add(benchGuide);

const worldAxes = new THREE.AxesHelper(0.8);
worldAxes.position.set(0, 1.34, 0);
scene.add(worldAxes);

const anchorDebugRoot = new THREE.Group();
scene.add(anchorDebugRoot);

const activePresetOrder = ${JSON.stringify(ACTIVE_CLASSIC_PRESET_KEYS)};

const presetDefinitionMap = new Map(
  listRegisteredApparatusPresets().map((definition) => [definition.key, definition]),
);

const presetDefinitions = activePresetOrder
  .map((key) => presetDefinitionMap.get(key))
  .filter(Boolean);

for (const definition of presetDefinitions) {
  const option = document.createElement('option');
  option.value = definition.key;
  option.textContent = definition.key;
  presetSelect.append(option);
}

const state = {
  currentPresetKey: presetDefinitions[0]?.key ?? '',
  currentApparatus: null,
  anchorMarkers: [],
  outlineHelpers: [],
};

const appearanceByPreset = {
  'classic-test-tube': clearWater(),
  'classic-reagent-bottle': diluteAcid(),
  'classic-solid-reagent-jar': clearWater(),
};

const debugScaleByPreset = {
  'classic-copper-piece': 1.8,
  'zinc-granules': 1.3,
};
const benchSurfaceY = 1.34;

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

function anchorWorldPosition(object) {
  const target = new THREE.Vector3();
  object.getWorldPosition(target);
  return target;
}

function clearAnchorMarkers() {
  for (const marker of state.anchorMarkers) {
    anchorDebugRoot.remove(marker);
  }
  state.anchorMarkers = [];
}

function clearOutlineHelpers() {
  for (const helper of state.outlineHelpers) {
    helper.parent?.remove(helper);
  }
  state.outlineHelpers = [];
}

function renderAnchorMarkers(apparatus) {
  clearAnchorMarkers();
  if (!anchorsToggle.checked || !apparatus?.anchors) {
    return;
  }

  const entries = Object.entries(apparatus.anchors);
  entries.forEach(([name, anchor], index) => {
    const color = new THREE.Color().setHSL((index / Math.max(entries.length, 1)) * 0.92, 0.72, 0.58);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 18, 18),
      new THREE.MeshBasicMaterial({ color }),
    );
    marker.position.copy(anchorWorldPosition(anchor));
    marker.name = 'anchor-marker:' + name;
    anchorDebugRoot.add(marker);
    state.anchorMarkers.push(marker);
  });
}

function ensureMaterialArray(material) {
  return Array.isArray(material) ? material : [material];
}

function cacheDebugMaterialState(material) {
  if (!material || material.userData.__viewerDebugCached) {
    return;
  }
  material.userData.__viewerDebugCached = true;
  material.userData.__viewerDebugState = {
    type: material.type,
    transparent: material.transparent,
    opacity: material.opacity,
    emissive: material.emissive?.getHex?.() ?? null,
    emissiveIntensity: material.emissiveIntensity ?? null,
    color: material.color?.getHex?.() ?? null,
    roughness: material.roughness ?? null,
    metalness: material.metalness ?? null,
  };
}

function restoreContrastMode(apparatus) {
  clearOutlineHelpers();
  apparatus?.group?.traverse((node) => {
    if (!node.isMesh || !node.material) {
      return;
    }
    for (const material of ensureMaterialArray(node.material)) {
      const cached = material?.userData?.__viewerDebugState;
      if (!cached) {
        continue;
      }
      material.transparent = cached.transparent;
      material.opacity = cached.opacity;
      if (cached.color !== null && material.color) {
        material.color.setHex(cached.color);
      }
      if (cached.emissive !== null && material.emissive) {
        material.emissive.setHex(cached.emissive);
      }
      if (cached.emissiveIntensity !== null) {
        material.emissiveIntensity = cached.emissiveIntensity;
      }
      if (cached.roughness !== null && 'roughness' in material) {
        material.roughness = cached.roughness;
      }
      if (cached.metalness !== null && 'metalness' in material) {
        material.metalness = cached.metalness;
      }
      material.needsUpdate = true;
    }
  });
}

function applyContrastMode(apparatus) {
  restoreContrastMode(apparatus);
  if (!contrastToggle.checked || !apparatus?.group) {
    return;
  }

  apparatus.group.traverse((node) => {
    if (!node.isMesh || !node.material) {
      return;
    }
    for (const material of ensureMaterialArray(node.material)) {
      cacheDebugMaterialState(material);
      if (typeof material.opacity === 'number' && material.opacity < 0.72) {
        material.transparent = true;
        material.opacity = Math.max(material.opacity, 0.72);
      }
      if (material.color) {
        material.color.lerp(new THREE.Color(0xe6f6ff), 0.14);
      }
      if (material.emissive) {
        material.emissive.lerp(new THREE.Color(0x2a80c9), 0.35);
        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.18);
      }
      material.needsUpdate = true;
    }

    if (node.geometry) {
      const edges = new THREE.EdgesGeometry(node.geometry, 28);
      const helper = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0x9ed8ff,
          transparent: true,
          opacity: 0.42,
        }),
      );
      helper.position.copy(node.position);
      helper.rotation.copy(node.rotation);
      helper.scale.copy(node.scale);
      helper.renderOrder = 12;
      node.add(helper);
      state.outlineHelpers.push(helper);
    }
  });
}

function applyDebugMaterialMode(apparatus, presetKey) {
  if (!apparatus?.group) {
    return;
  }

  const scale = debugScaleByPreset[presetKey] ?? 1;
  apparatus.group.scale.setScalar(scale);

  if (!debugMaterialToggle.checked) {
    return;
  }

  apparatus.group.traverse((node) => {
    if (!node.isMesh || !node.material) {
      return;
    }
    for (const material of ensureMaterialArray(node.material)) {
      cacheDebugMaterialState(material);
      material.transparent = false;
      material.opacity = 1;
      if (material.color) {
        material.color.lerp(new THREE.Color(0xdff3ff), 0.24);
      }
      if (material.emissive) {
        material.emissive.setHex(0x0e3b63);
        material.emissiveIntensity = 0.12;
      }
      if ('roughness' in material) {
        material.roughness = Math.min(material.roughness ?? 0.6, 0.72);
      }
      if ('metalness' in material) {
        material.metalness = Math.min(material.metalness ?? 0.2, 0.18);
      }
      material.needsUpdate = true;
    }
  });
}

function populateAnchorPanel(apparatus) {
  anchorList.innerHTML = '';
  const entries = Object.entries(apparatus?.anchors ?? {});
  for (const [name, anchor] of entries) {
    const world = anchorWorldPosition(anchor);
    const item = document.createElement('li');
    item.textContent = name + '  (' + [world.x, world.y, world.z].map((value) => value.toFixed(2)).join(', ') + ')';
    anchorList.append(item);
  }
}

function populateCapabilityPanel(definition) {
  capabilityList.innerHTML = '';
  const capabilities = definition?.capabilities ?? definition?.contract?.capabilities ?? [];
  for (const capability of capabilities) {
    const item = document.createElement('li');
    item.textContent = capability;
    capabilityList.append(item);
  }
}

function applyDebugState(apparatus, definition) {
  if (typeof apparatus?.controllers?.setGasFlow === 'function') {
    apparatus.controllers.setGasFlow(1);
  }
  if (typeof apparatus?.controllers?.setConnected === 'function') {
    apparatus.controllers.setConnected(true);
  }
  if (typeof apparatus?.controllers?.setCopperCoating === 'function') {
    apparatus.controllers.setCopperCoating(0.66);
  }
  if (typeof apparatus?.controllers?.setLiquidLevel === 'function') {
    const fillLevel = definition.key === 'test-tube' ? 0.36 : 0.6;
    apparatus.controllers.setLiquidLevel(fillLevel);
  }
  if (typeof apparatus?.controllers?.setLoadedAmount === 'function') {
    apparatus.controllers.setLoadedAmount(0.72);
  }
  if (typeof apparatus?.controllers?.setStirPose === 'function') {
    apparatus.controllers.setStirPose(0.28);
  }
  if (typeof apparatus?.controllers?.setGasOpacity === 'function') {
    apparatus.controllers.setGasOpacity(0.24);
  }
  if (typeof apparatus?.controllers?.setClampOpen === 'function') {
    apparatus.controllers.setClampOpen(0.72);
  }
}

function createOptionsForPreset(definition) {
  const options = {
    parent: stageRoot,
    name: definition.key.replace(/[^a-z0-9]+/gi, '_'),
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  };
  if (appearanceByPreset[definition.key]) {
    options.appearance = appearanceByPreset[definition.key];
  }
  if (definition.key === 'classic-test-tube') {
    options.fillRatio = 0.34;
  }
  if (definition.key === 'classic-reagent-bottle') {
    options.fillRatio = 0.68;
  }
  if (definition.key === 'classic-copper-piece') {
    options.rotation = [0, 0.18, 0.26];
    options.width = 0.2;
    options.length = 0.92;
    options.thickness = 0.026;
  }
  if (definition.key === 'zinc-granules') {
    options.radius = 0.07;
    options.spread = 0.14;
    options.count = 12;
  }
  return options;
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
  apparatus.group.position.y += benchSurfaceY - box.min.y;
  apparatus.group.updateMatrixWorld(true);
}

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.4);
  const distance = Math.max(2.4, maxDim * 2.8);
  camera.position.set(center.x + distance * 0.75, Math.max(2.0, center.y + distance * 0.42), center.z + distance);
  controls.target.copy(center);
  controls.minDistance = Math.max(1.1, maxDim * 0.7);
  controls.maxDistance = Math.max(6, maxDim * 9);
  controls.update();
}

function updatePanel(definition, apparatus) {
  contractDump.textContent = safeJson(definition?.contract ?? {});
  metaDump.textContent = safeJson({
    key: definition?.key,
    title: definition?.title,
    family: definition?.family,
    description: definition?.description ?? '',
    apparatusMeta: apparatus?.meta ?? {},
    apparatusState: apparatus?.state ?? {},
    constraints: apparatus?.constraints ?? {},
  });
}

function loadPreset(key) {
  const definition = getRegisteredApparatusPresetDefinition(key);
  if (!definition) {
    statusText.textContent = 'Preset không tồn tại.';
    statusSub.textContent = key;
    return;
  }

  if (state.currentApparatus?.group) {
    stageRoot.remove(state.currentApparatus.group);
  }

  const apparatus = createApparatusFromPreset(key, createOptionsForPreset(definition));
  state.currentPresetKey = key;
  state.currentApparatus = apparatus;

  applyDebugState(apparatus, definition);
  applyDebugMaterialMode(apparatus, key);
  applyContrastMode(apparatus);
  if (apparatus.meshes?.labelPlane) {
    apparatus.meshes.labelPlane.visible = false;
  }
  placeOnBench(apparatus);
  populateAnchorPanel(apparatus);
  populateCapabilityPanel(definition);
  renderAnchorMarkers(apparatus);
  fitCameraToObject(apparatus.group);
  updatePanel(definition, apparatus);

  statusText.textContent = 'Đang xem asset: ' + key;
  statusSub.textContent = (definition.family || 'unknown-family') + ' · ' + Object.keys(apparatus.anchors ?? {}).length + ' anchors';

  const url = new URL(window.location.href);
  url.searchParams.set('preset', key);
  history.replaceState({}, '', url);
}

function refreshVisibility() {
  benchGuide.visible = gridToggle.checked;
  worldAxes.visible = axesToggle.checked;
  if (state.currentApparatus) {
    state.currentApparatus.group.scale.setScalar(debugScaleByPreset[state.currentPresetKey] ?? 1);
    if (!debugMaterialToggle.checked) {
      restoreContrastMode(state.currentApparatus);
    }
    applyDebugMaterialMode(state.currentApparatus, state.currentPresetKey);
    applyContrastMode(state.currentApparatus);
    if (state.currentApparatus.meshes?.labelPlane) {
      state.currentApparatus.meshes.labelPlane.visible = false;
    }
    placeOnBench(state.currentApparatus);
  }
  renderAnchorMarkers(state.currentApparatus);
  populateAnchorPanel(state.currentApparatus);
}

const initialPreset = new URL(window.location.href).searchParams.get('preset');
if (initialPreset && presetDefinitions.some((definition) => definition.key === initialPreset)) {
  presetSelect.value = initialPreset;
}

presetSelect.addEventListener('change', () => {
  loadPreset(presetSelect.value);
});
anchorsToggle.addEventListener('change', refreshVisibility);
gridToggle.addEventListener('change', refreshVisibility);
axesToggle.addEventListener('change', refreshVisibility);
contrastToggle.addEventListener('change', refreshVisibility);
debugMaterialToggle.addEventListener('change', refreshVisibility);
resetButton?.addEventListener('click', () => {
  loadPreset(state.currentPresetKey);
});

loadPreset(presetSelect.value || state.currentPresetKey);

let previousTime = performance.now();
function animate(now = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
  previousTime = now;
  controls.update();
  for (const marker of state.anchorMarkers) {
    marker.scale.setScalar(0.95 + Math.sin(now * 0.004) * 0.08);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
`;
}

function buildHtml({ sharedInlineSnippet, apparatusInlineSnippet, sceneInlineCode }) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Apparatus Library Viewer</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #08111b;
        --panel: rgba(10, 18, 29, 0.88);
        --panel-soft: rgba(20, 34, 50, 0.74);
        --border: rgba(120, 183, 255, 0.24);
        --text: #edf6ff;
        --muted: #9ab6d2;
        --accent: #72c8ff;
        --warm: #ffb363;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; height: 100%; overflow: hidden; background: radial-gradient(circle at top, #12263a 0%, var(--bg) 55%, #050a10 100%); color: var(--text); font-family: "Segoe UI", system-ui, sans-serif; }
      #stage { width: 100vw; height: 100vh; display: block; }
      .shell {
        position: fixed;
        inset: 0;
        pointer-events: none;
        display: grid;
        grid-template-columns: 320px 1fr 360px;
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
      h1, h2, h3, p { margin: 0; }
      h1 { font-size: 22px; line-height: 1.1; }
      h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
      p { color: var(--muted); line-height: 1.4; }
      label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; }
      select, button {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 10px 12px;
        background: var(--panel-soft);
        color: var(--text);
        font: inherit;
      }
      button { cursor: pointer; }
      .toggle-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
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
      .stat-box {
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 14px;
        background: rgba(8, 17, 27, 0.45);
      }
      .list {
        margin: 0;
        padding-left: 18px;
        color: var(--muted);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .scroll {
        min-height: 0;
        overflow: auto;
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
      .status-bar {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        width: min(720px, calc(100vw - 32px));
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
        .shell { grid-template-columns: 280px 1fr 320px; }
      }
      @media (max-width: 980px) {
        .shell {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
          align-content: start;
          overflow: auto;
        }
        .panel { min-height: 280px; }
        .status-bar {
          position: static;
          transform: none;
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
            <h1>Classic Asset Viewer</h1>
            <p>Chỉ hiển thị active apparatus của classic-kit đang thực sự dùng trong pipeline experiment hiện tại.</p>
          </div>
          <div>
            <label for="presetSelect">Preset</label>
            <select id="presetSelect"></select>
          </div>
          <div class="toggle-row">
            <label class="toggle"><input id="gridToggle" type="checkbox" checked /> Grid</label>
            <label class="toggle"><input id="axesToggle" type="checkbox" checked /> Axes</label>
          </div>
          <label class="toggle"><input id="anchorsToggle" type="checkbox" checked /> Anchors</label>
          <label class="toggle"><input id="contrastToggle" type="checkbox" checked /> Contrast Mode</label>
          <label class="toggle"><input id="debugMaterialToggle" type="checkbox" checked /> Debug Material Mode</label>
          <button id="resetBtn" type="button">Rebuild Preset</button>
          <div class="stat-box">
            <h2>Capabilities</h2>
            <ul id="capabilityList" class="list scroll"></ul>
          </div>
          <div class="stat-box scroll">
            <h2>Anchors</h2>
            <ul id="anchorList" class="list"></ul>
          </div>
        </div>
      </section>
      <div></div>
      <section class="panel">
        <div class="panel-body">
          <div class="stat-box scroll">
            <h2>Contract</h2>
            <pre id="contractDump"></pre>
          </div>
          <div class="stat-box scroll">
            <h2>Meta / State / Constraints</h2>
            <pre id="metaDump"></pre>
          </div>
        </div>
      </section>
    </div>
    <div class="status-bar">
      <div id="statusText">Đang khởi tạo viewer...</div>
      <div id="statusSub">Orbit nền để xoay camera; panel sẽ hiện anchor/capability của asset đang chọn.</div>
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
