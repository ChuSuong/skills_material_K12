import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';
import { getCameraPreset, cameraPresets } from './camera-presets.js';
import { getThemePreset, themePresets } from './theme-presets.js';
import { installCoursewareTestHarness } from '../testing/harness.js';

export { cameraPresets, getCameraPreset, themePresets, getThemePreset };

function resolveHud(hud = {}) {
  const ids = {
    canvas: hud.canvasId || 'stage',
    statusText: hud.statusTextId || 'statusText',
    statusSub: hud.statusSubId || 'statusSub',
    primaryAction: hud.primaryActionId || hud.primaryButtonId || 'primaryAction',
    reset: hud.resetId || 'resetBtn',
    labelsToggle: hud.labelsToggleId || 'labelsToggle',
    root: hud.rootId || null,
  };

  return {
    ids,
    canvas: hud.canvas || document.getElementById(ids.canvas),
    root: hud.root || (ids.root ? document.getElementById(ids.root) : document.documentElement),
    statusText: hud.statusText || document.getElementById(ids.statusText),
    statusSub: hud.statusSub || document.getElementById(ids.statusSub),
    primaryAction: hud.primaryAction || hud.primaryButton || document.getElementById(ids.primaryAction),
    reset: hud.reset || document.getElementById(ids.reset),
    labelsToggle: hud.labelsToggle || document.getElementById(ids.labelsToggle),
  };
}

function applyUiTheme(hud, theme) {
  const root = hud.root || document.documentElement;
  if (!root?.style || !theme?.ui) {
    return;
  }
  root.style.setProperty('--panel', theme.ui.panel);
  root.style.setProperty('--panel-soft', theme.ui.panelSoft);
  root.style.setProperty('--border', theme.ui.border);
  root.style.setProperty('--text', theme.ui.text);
  root.style.setProperty('--muted', theme.ui.muted);
  root.style.setProperty('--accent', theme.ui.accent);
  root.style.setProperty('--warm', theme.ui.warm);
  root.style.setProperty('--button-primary', theme.ui.buttonPrimary);
  root.style.setProperty('--button-secondary', theme.ui.buttonSecondary);
}

export function createSceneShell({
  canvas,
  theme,
  cameraPreset,
  controlsPreset = {},
  hud,
  verifier,
} = {}) {
  const resolvedHud = resolveHud({ ...hud, canvas });
  const resolvedCanvas = resolvedHud.canvas;
  if (!resolvedCanvas) {
    throw new Error('createSceneShell requires a canvas or HUD canvas reference');
  }

  const resolvedTheme = getThemePreset(theme);
  const resolvedCameraPreset = getCameraPreset(cameraPreset);
  const stageTheme = resolvedTheme.scene || {};
  const benchTopSize = stageTheme.benchTopSize || [12.8, 0.34, 5.8];
  const benchTopY = stageTheme.benchTopY ?? 1.32;
  const benchLegSize = stageTheme.benchLegSize || [0.35, 2.6, 0.35];
  const benchLegOffsets = stageTheme.benchLegOffsets || [[-5.8, -2.4], [5.8, -2.4], [-5.8, 2.4], [5.8, 2.4]];
  const floorRadius = stageTheme.floorRadius || 24;
  const roomRadius = stageTheme.roomRadius || 40;
  const stagePadConfig = stageTheme.stagePad || { visible: false };
  const renderer = new THREE.WebGLRenderer({ canvas: resolvedCanvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    resolvedCameraPreset.fov,
    window.innerWidth / window.innerHeight,
    resolvedCameraPreset.near,
    resolvedCameraPreset.far,
  );
  camera.position.fromArray(resolvedCameraPreset.position);

  const OrbitControlsImpl = globalThis.OrbitControls || (typeof OrbitControls !== 'undefined' ? OrbitControls : null);
  if (!OrbitControlsImpl) {
    throw new Error('createSceneShell requires OrbitControls to be available (set globalThis.OrbitControls)');
  }

  const controls = new OrbitControlsImpl(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.fromArray(resolvedCameraPreset.target);
  Object.assign(controls, {
    minDistance: resolvedCameraPreset.minDistance,
    maxDistance: resolvedCameraPreset.maxDistance,
    minPolarAngle: resolvedCameraPreset.minPolarAngle,
    maxPolarAngle: resolvedCameraPreset.maxPolarAngle,
    ...controlsPreset,
  });
  controls.update();

  const lights = {
    ambient: new THREE.HemisphereLight(),
    key: new THREE.DirectionalLight(),
    rim: new THREE.PointLight(),
    warm: null,
  };

  lights.key.castShadow = true;
  lights.key.shadow.mapSize.set(2048, 2048);
  lights.key.shadow.camera.left = -16;
  lights.key.shadow.camera.right = 16;
  lights.key.shadow.camera.top = 16;
  lights.key.shadow.camera.bottom = -16;

  const room = new THREE.Mesh(
    new THREE.SphereGeometry(roomRadius, 42, 28),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide }),
  );

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(floorRadius, 72),
    new THREE.MeshStandardMaterial({ roughness: 0.96, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  const bench = new THREE.Group();
  const benchTop = new THREE.Mesh(
    new THREE.BoxGeometry(benchTopSize[0], benchTopSize[1], benchTopSize[2]),
    new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0.06 }),
  );
  benchTop.position.y = benchTopY;
  benchTop.castShadow = true;
  benchTop.receiveShadow = true;
  bench.add(benchTop);

  const legGeometry = new THREE.BoxGeometry(benchLegSize[0], benchLegSize[1], benchLegSize[2]);
  const legMaterial = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.24 });
  for (const [x, z] of benchLegOffsets) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, (benchTopY - benchTopSize[1] * 0.5) - benchLegSize[1] * 0.5, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    bench.add(leg);
  }

  let stagePad = null;
  if (stagePadConfig.visible) {
    stagePad = new THREE.Mesh(
      new THREE.BoxGeometry(stagePadConfig.width || 9.6, stagePadConfig.height || 0.08, stagePadConfig.depth || 2),
      new THREE.MeshStandardMaterial({ color: stagePadConfig.color || 0x111824, roughness: 0.9, metalness: 0.02 }),
    );
    stagePad.position.set(0, stagePadConfig.y ?? (benchTopY + benchTopSize[1] * 0.5 + (stagePadConfig.height || 0.08) * 0.5), 0);
    stagePad.castShadow = true;
    stagePad.receiveShadow = true;
    stagePad.name = 'stagePad';
    bench.add(stagePad);
  }

  let activeTheme = resolvedTheme;
  scene.add(lights.ambient, lights.key, lights.rim, room, floor, bench);

  function applyTheme(nextTheme = resolvedTheme) {
    activeTheme = getThemePreset(nextTheme);
    const sceneTheme = activeTheme.scene;

    scene.background = new THREE.Color(sceneTheme.background);
    scene.fog = sceneTheme.fog
      ? new THREE.Fog(sceneTheme.fog.color, sceneTheme.fog.near, sceneTheme.fog.far)
      : null;
    renderer.toneMapping = sceneTheme.toneMapping;
    renderer.toneMappingExposure = sceneTheme.rendererExposure;

    lights.ambient.color.setHex(sceneTheme.ambientLight.skyColor);
    lights.ambient.groundColor.setHex(sceneTheme.ambientLight.groundColor);
    lights.ambient.intensity = sceneTheme.ambientLight.intensity;

    lights.key.color.setHex(sceneTheme.keyLight.color);
    lights.key.intensity = sceneTheme.keyLight.intensity;
    lights.key.position.fromArray(sceneTheme.keyLight.position);

    lights.rim.color.setHex(sceneTheme.rimLight.color);
    lights.rim.intensity = sceneTheme.rimLight.intensity;
    lights.rim.distance = sceneTheme.rimLight.distance;
    lights.rim.decay = sceneTheme.rimLight.decay;
    lights.rim.position.fromArray(sceneTheme.rimLight.position);

    if (sceneTheme.warmLight) {
      if (!lights.warm) {
        lights.warm = new THREE.PointLight();
        scene.add(lights.warm);
      }
      lights.warm.color.setHex(sceneTheme.warmLight.color);
      lights.warm.intensity = sceneTheme.warmLight.intensity;
      lights.warm.distance = sceneTheme.warmLight.distance;
      lights.warm.decay = sceneTheme.warmLight.decay;
      lights.warm.position.fromArray(sceneTheme.warmLight.position);
    } else if (lights.warm) {
      scene.remove(lights.warm);
      lights.warm = null;
    }

    room.material.color.setHex(sceneTheme.room);
    floor.material.color.setHex(sceneTheme.floor);
    benchTop.material.color.setHex(sceneTheme.bench);
    legMaterial.color.setHex(sceneTheme.benchLeg);
    if (stagePad && sceneTheme.stagePad?.color != null) {
      stagePad.material.color.setHex(sceneTheme.stagePad.color);
    }

    applyUiTheme(resolvedHud, activeTheme);
    return activeTheme;
  }

  function resize(width = window.innerWidth, height = window.innerHeight) {
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    return { width, height };
  }

  const handleResize = () => resize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', handleResize);

  function installHarness(overrides = {}) {
    return installCoursewareTestHarness({
      state: overrides.state ?? verifier?.state ?? {},
      mapState: overrides.mapState ?? verifier?.mapState ?? ((state) => state),
      getVerifierMeta: overrides.getVerifierMeta ?? verifier?.getVerifierMeta,
      getGoldenPath: overrides.getGoldenPath ?? verifier?.getGoldenPath,
      getDragPath: overrides.getDragPath ?? verifier?.getDragPath,
      runVerifierStep: overrides.runVerifierStep ?? verifier?.runVerifierStep,
    });
  }

  applyTheme(resolvedTheme);
  resize();

  return {
    renderer,
    scene,
    camera,
    controls,
    lights,
    hud: resolvedHud,
    bench,
    floor,
    room,
    stagePad,
    theme: activeTheme,
    resize,
    applyTheme,
    installHarness,
    dispose() {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
