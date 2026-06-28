import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateSemanticDraft } from '../lib/contracts/semantic-draft.js';
import { validateRecipeDefinition } from '../lib/contracts/recipe.js';
import {
  buildRecipeSceneArtifact,
  supportsRecipeSceneBuilder,
} from './build-recipe-scene.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const canonicalIronCopperSulfateDir = path.join(
  repoRoot,
  'examples/drafts/experiment/iron-nail-cuso4-displacement'
);
const canonicalCopperSulfuricAcidDir = path.join(
  repoRoot,
  'examples/drafts/experiment/cu-h2so4-heating'
);
const recipesDir = path.join(repoRoot, 'recipes');

function isIronCopperSulfateDraft(draft = {}, slug = '') {
  const topic = `${draft?.topic || ''}`.toLowerCase();
  const apparatus = Array.isArray(draft?.scene?.apparatus)
    ? draft.scene.apparatus.map((item) => `${item}`.toLowerCase())
    : [];

  return slug === 'iron-nail-cuso4-displacement'
    || topic.includes('cuso4')
    || topic.includes('cu so4')
    || topic.includes('đinh sắt')
    || topic.includes('dinh sat')
    || (apparatus.includes('iron-nail') && apparatus.includes('beaker'));
}

function isCopperHotSulfuricAcidDraft(draft = {}, slug = '') {
  const topic = `${draft?.topic || ''}`.toLowerCase();
  const apparatus = Array.isArray(draft?.scene?.apparatus)
    ? draft.scene.apparatus.map((item) => `${item}`.toLowerCase())
    : [];

  return slug === 'cu-h2so4-heating'
    || draft?.recipe === 'cu-h2so4-heating'
    || topic.includes('h2so4 đặc nóng')
    || topic.includes('h2so4 dac nong')
    || (apparatus.includes('copper-piece')
      && apparatus.includes('test-tube')
      && apparatus.includes('alcohol-burner'));
}

function buildCopperHotSulfuricAcidHud() {
  return `<div class="hud">
  <div class="panel" data-courseware-role="intro">
    <h1 class="lesson-title">Đồng tác dụng với H2SO4 đặc nóng</h1>
    <p class="lesson-desc">Kéo lá đồng vào ống nghiệm chứa H2SO4 đặc rồi đưa ống nghiệm lên đèn cồn để quan sát phản ứng.</p>
    <p class="lesson-desc lesson-hint">Hiện tượng chính: dung dịch chuyển xanh do CuSO4 tạo thành và có khí SO2 thoát ra khi đun nóng.</p>
  </div>

  <div class="status" data-courseware-role="status">
    <div class="status-label">Trạng thái thí nghiệm</div>
    <div id="statusText">Sẵn sàng. Đặt đồng vào ống nghiệm chứa H2SO4 đặc rồi đun nóng.</div>
    <div id="statusSub">Golden path: thả lá đồng vào ống nghiệm, đưa ống nghiệm lên đèn cồn, rồi quan sát dung dịch xanh và khí SO2.</div>
  </div>

  <div class="controls" data-courseware-role="controls">
    <button class="secondary" id="resetBtn" data-action="reset" type="button">Đặt lại</button>
    <button id="pourBtn" data-action="autoplay" type="button">Chạy tự động</button>
  </div>
</div>`;
}

function buildCopperHotSulfuricAcidScene() {
  return `import * as THREE from 'three';
import { createSceneShell } from '../../lib/runtime/scene-shell.js';
import { installCoursewareTestHarness } from '../../lib/testing/harness.js';
import {
  createCopperPieceApparatus,
  createTestTubeApparatus,
  createAlcoholBurnerApparatus,
} from '../../lib/apparatus/index.js';

const {
  createFreeDragController,
  createBubbleField,
  createSteamField,
  createGlowRing,
  createColorTransition,
} = globalThis.ChemSharedLib;

const canvas = document.getElementById('stage');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const autoplayButton = document.querySelector('[data-action="autoplay"]');
const resetButton = document.querySelector('[data-action="reset"]');

const shell = createSceneShell({
  canvas,
  theme: 'chem-lab-dark',
  cameraPreset: 'lab-close',
  hud: {
    statusText,
    statusSub,
    primaryAction: autoplayButton,
    reset: resetButton,
  },
});

const { scene, camera, renderer, controls, bench } = shell;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.update();

const labStage = new THREE.Group();
labStage.position.y = 1.34;
bench.add(labStage);

const reactionState = {
  phase: 'ready',
  tubeLoaded: false,
  tubeHeated: false,
  reactionProgress: 0,
  autoplay: false,
  autoplayStep: 0,
};

const copperHome = new THREE.Vector3(-1.75, 0.2, 0.15);
const tubeHome = new THREE.Vector3(0.2, 0.16, 0);
const burnerHome = new THREE.Vector3(1.9, 0.02, 0);

const copper = createCopperPieceApparatus({
  parent: labStage,
  position: copperHome.toArray(),
  rotation: [0, 0, Math.PI * 0.5],
  width: 0.22,
  length: 0.54,
  thickness: 0.03,
});
const testTube = createTestTubeApparatus({
  parent: labStage,
  position: tubeHome.toArray(),
  rotation: [0, 0, 0],
  appearance: {
    name: 'concentrated-sulfuric-acid',
    color: 0xf4f7ff,
    emissive: 0x1a1e28,
    opacity: 0.74,
    roughness: 0.14,
    metalness: 0.02,
  },
  fillRatio: 0.42,
});
const burner = createAlcoholBurnerApparatus({
  parent: labStage,
  position: burnerHome.toArray(),
});

copper.controllers.setLabel('Cu');
testTube.controllers.setLabel('H2SO4 đặc');
burner.controllers.setLabel('Đèn cồn');

const supportPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(0.78, 0.86, 0.08, 48),
  new THREE.MeshStandardMaterial({ color: 0x223047, roughness: 0.86, metalness: 0.16 })
);
supportPlate.position.set(0.1, -0.01, 0);
labStage.add(supportPlate);

const burnerAura = new THREE.Mesh(
  new THREE.RingGeometry(0.22, 0.34, 32),
  new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
);
burnerAura.rotation.x = -Math.PI / 2;
burnerAura.position.copy(burner.anchors.heatZone.position);
burner.group.add(burnerAura);

const flame = new THREE.Mesh(
  new THREE.ConeGeometry(0.08, 0.28, 20),
  new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 })
);
flame.position.copy(burner.anchors.flameOrigin.position);
flame.position.y += 0.12;
flame.visible = false;
burner.group.add(flame);

const bubbleField = createBubbleField({
  scene,
  maxParticles: 18,
  color: 0xd9efff,
  size: 0.05,
});
const steamField = createSteamField({
  scene,
  maxParticles: 28,
  color: 0xe7edf4,
  size: 0.18,
});
const glowRing = createGlowRing({
  scene,
  color: 0x74b7ff,
  radius: 0.34,
  thickness: 0.06,
});
const solutionColorTransition = createColorTransition({
  target: testTube.meshes.liquid.material.color,
  from: new THREE.Color(0xf4f7ff),
  to: new THREE.Color(0x3a7df0),
});

const copperBaseColor = new THREE.Color(0xb96838);
const copperSpentColor = new THREE.Color(0x7a8aa3);
const dragController = createFreeDragController({
  camera,
  renderer,
  controls,
  dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  bounds: {
    min: new THREE.Vector3(-2.4, 0.02, -1.2),
    max: new THREE.Vector3(2.5, 1.8, 1.2),
  },
});

function setStatus(text, sub) {
  statusText.textContent = text;
  statusSub.textContent = sub;
}

function worldPoint(anchor) {
  return anchor.getWorldPosition(new THREE.Vector3());
}

function screenPoint(target) {
  const point = worldPoint(target);
  point.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: rect.left + ((point.x + 1) * 0.5) * rect.width,
    y: rect.top + ((-point.y + 1) * 0.5) * rect.height,
  };
}

function positionCopperInTube() {
  copper.group.position.copy(testTube.group.position).add(new THREE.Vector3(0, 0.55, 0.015));
  copper.group.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.12);
  reactionState.tubeLoaded = true;
  reactionState.phase = reactionState.reactionProgress > 0 ? 'reaction' : 'loaded';
  setStatus(
    'Lá đồng đã nằm trong ống nghiệm chứa H2SO4 đặc.',
    'Bước tiếp theo: đưa ống nghiệm lên ngọn lửa đèn cồn để bắt đầu phản ứng.'
  );
}

function seatTubeOverBurner() {
  testTube.group.position.set(1.08, 0.76, 0);
  testTube.group.rotation.set(0, 0, -0.46);
  reactionState.tubeHeated = true;
  reactionState.phase = reactionState.reactionProgress > 0 ? 'reaction' : 'heating';
  flame.visible = true;
  burner.controllers.setEffectIntensity(1);
  setStatus(
    'Ống nghiệm đang được đun nóng.',
    'Nhiệt làm Cu phản ứng với H2SO4 đặc, tạo dung dịch CuSO4 màu xanh và khí SO2.'
  );
}

function updateReactionVisuals(dt) {
  const activeHeating = reactionState.tubeLoaded && reactionState.tubeHeated;
  if (activeHeating && reactionState.reactionProgress < 1) {
    reactionState.reactionProgress = Math.min(1, reactionState.reactionProgress + dt * 0.22);
    reactionState.phase = reactionState.reactionProgress >= 1 ? 'result' : 'reaction';
  }

  const progress = reactionState.reactionProgress;
  const effectOrigin = worldPoint(testTube.anchors.effectOrigin);
  const steamOrigin = worldPoint(testTube.anchors.steamOrigin);

  if (progress > 0) {
    bubbleField.burst(effectOrigin, progress, dt);
    steamField.burst(steamOrigin, Math.max(progress, reactionState.tubeHeated ? 0.18 : 0), dt);
    glowRing.setPosition(effectOrigin);
    glowRing.setIntensity(0.35 + progress * 0.65);
    solutionColorTransition.setProgress(progress);
    copper.meshes.shape.material.color.copy(copperBaseColor).lerp(copperSpentColor, progress * 0.72);
    copper.meshes.shape.material.emissive = new THREE.Color(0x000000);
    copper.meshes.shape.material.emissiveIntensity = 0;
    copper.meshes.shape.scale.y = 1 - progress * 0.18;
  } else {
    glowRing.setIntensity(reactionState.tubeHeated ? 0.22 : 0);
    glowRing.setPosition(effectOrigin);
    solutionColorTransition.reset();
    copper.meshes.shape.material.color.copy(copperBaseColor);
    copper.meshes.shape.scale.set(1, 1, 1);
  }

  bubbleField.update(dt, performance.now() * 0.001);
  steamField.update(dt, performance.now() * 0.001);

  if (progress >= 1) {
    setStatus(
      'Phản ứng đã xảy ra: xuất hiện dung dịch xanh lam và khí SO2.',
      'Kết luận: Cu bị oxi hóa bởi H2SO4 đặc nóng, không tạo khí H2.'
    );
  }
}

const copperDrag = dragController.registerDraggable({
  id: 'copper-piece',
  object: copper.group,
  pickObjects: [copper.group],
  dragAnchor: copper.anchors.interactionZone,
  validTargets: [{
    id: 'tube-mouth',
    anchor: testTube.anchors.mouth,
    radius: 0.42,
    onDropTarget() {
      positionCopperInTube();
    },
  }],
  onReturnHome() {
    if (!reactionState.tubeLoaded) {
      setStatus('Lá đồng đã trở về vị trí ban đầu.', 'Hãy thả lá đồng vào ống nghiệm để chuẩn bị đun nóng.');
    }
  },
});

const tubeDrag = dragController.registerDraggable({
  id: 'test-tube',
  object: testTube.group,
  pickObjects: [testTube.group],
  dragAnchor: testTube.anchors.gripAnchor,
  validTargets: [{
    id: 'burner-heat-zone',
    anchor: burner.anchors.heatZone,
    radius: 0.72,
    onDropTarget() {
      seatTubeOverBurner();
    },
  }],
  onReturnHome() {
    if (!reactionState.tubeHeated) {
      flame.visible = false;
      burner.controllers.setEffectIntensity(0);
      setStatus('Ống nghiệm đã về lại giá đỡ.', 'Sau khi đặt đồng vào ống nghiệm, hãy kéo ống nghiệm đến vùng lửa.');
    }
  },
});

function resetScene() {
  reactionState.phase = 'ready';
  reactionState.tubeLoaded = false;
  reactionState.tubeHeated = false;
  reactionState.reactionProgress = 0;
  reactionState.autoplay = false;
  reactionState.autoplayStep = 0;
  dragController.reset();
  copper.group.position.copy(copperHome);
  copper.group.rotation.set(0, 0, Math.PI * 0.5);
  testTube.group.position.copy(tubeHome);
  testTube.group.rotation.set(0, 0, 0);
  burner.group.position.copy(burnerHome);
  flame.visible = false;
  burner.controllers.setEffectIntensity(0);
  solutionColorTransition.reset();
  glowRing.setIntensity(0);
  copper.meshes.shape.material.color.copy(copperBaseColor);
  copper.meshes.shape.scale.set(1, 1, 1);
  setStatus(
    'Sẵn sàng. Đặt đồng vào ống nghiệm chứa H2SO4 đặc rồi đun nóng.',
    'Khi đun nóng, dung dịch sẽ chuyển xanh do tạo CuSO4 và có khí SO2 thoát ra.'
  );
}

function runVerifierStep(step) {
  if (step === 'load-copper') {
    positionCopperInTube();
    return true;
  }
  if (step === 'heat-tube') {
    if (!reactionState.tubeLoaded) {
      positionCopperInTube();
    }
    seatTubeOverBurner();
    return true;
  }
  if (step === 'finish-reaction') {
    if (!reactionState.tubeLoaded) {
      positionCopperInTube();
    }
    if (!reactionState.tubeHeated) {
      seatTubeOverBurner();
    }
    reactionState.reactionProgress = 1;
    reactionState.phase = 'result';
    return true;
  }
  return false;
}

installCoursewareTestHarness({
  state: reactionState,
  mapState(state) {
    return {
      phase: state.phase,
      tubeLoaded: state.tubeLoaded,
      tubeHeated: state.tubeHeated,
      reactionProgress: state.reactionProgress,
    };
  },
  getVerifierMeta() {
    return {
      supportsGoldenPath: true,
      successPhase: 'result',
      failureStatusText: 'Thả chưa đúng vị trí',
    };
  },
  getGoldenPath() {
    return [
      { type: 'pageApiCall', method: 'runVerifierStep', args: ['load-copper'], afterMs: 500 },
      { type: 'wait', ms: 500, afterMs: 200 },
      { type: 'pageApiCall', method: 'runVerifierStep', args: ['heat-tube'], afterMs: 800 },
      { type: 'wait', ms: 1400, afterMs: 200 },
      { type: 'pageApiCall', method: 'runVerifierStep', args: ['finish-reaction'], afterMs: 300 },
    ];
  },
  getDragPath(sampleId) {
    if (sampleId === 'tube') {
      return {
        type: 'drag',
        from: screenPoint(testTube.anchors.gripAnchor),
        to: screenPoint(burner.anchors.heatZone),
        steps: 22,
        afterMs: 700,
      };
    }
    return {
      type: 'drag',
      from: screenPoint(copper.anchors.interactionZone),
      to: screenPoint(testTube.anchors.mouth),
      steps: 20,
      afterMs: 600,
    };
  },
  dragFromPageApi({ sampleId } = {}) {
    if (sampleId === 'tube') {
      seatTubeOverBurner();
      return true;
    }
    positionCopperInTube();
    return true;
  },
  runVerifierStep,
});

autoplayButton.addEventListener('click', () => {
  reactionState.autoplay = true;
  reactionState.autoplayStep = 0;
  runVerifierStep('load-copper');
  window.setTimeout(() => runVerifierStep('heat-tube'), 500);
  window.setTimeout(() => runVerifierStep('finish-reaction'), 2100);
});

resetButton.addEventListener('click', resetScene);

let previousTime = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;
  dragController.update(dt);
  updateReactionVisuals(dt);
  flame.scale.x = 1 + Math.sin(now * 0.02) * 0.08;
  flame.scale.z = 1 + Math.cos(now * 0.018) * 0.08;
  flame.scale.y = 1 + Math.sin(now * 0.024) * 0.12;
  burnerAura.material.opacity = flame.visible ? 0.18 + Math.sin(now * 0.01) * 0.04 : 0.08;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resetScene();
requestAnimationFrame(animate);
`;
}

function buildDefaultHud() {
  return `<div class="hud">
  <div class="panel">
    <h1 class="lesson-title">Mô phỏng thí nghiệm</h1>
    <p class="lesson-desc">Thao tác kéo-thả trực tiếp trong mô hình 3D để quan sát hiện tượng.</p>
    <p class="lesson-desc lesson-hint">Gợi ý: bạn có thể xoay camera để nhìn rõ hơn.</p>
  </div>

  <div class="legend">
    <div class="legend-title">Điểm nhấn trực quan</div>
    <ul>
      <li>Kéo thả dụng cụ/mẫu để thao tác.</li>
      <li>Có thể xoay camera để quan sát toàn cảnh.</li>
      <li>Nhấn nút để chạy luồng hướng dẫn tự động.</li>
    </ul>
  </div>

  <div class="status">
    <div class="status-label">Trạng thái thí nghiệm</div>
    <div id="statusText">Sẵn sàng</div>
    <div id="statusSub">Hãy thao tác với mẫu thử.</div>
  </div>

  <div class="action-row">
    <button class="secondary" data-action="reset">Đặt lại</button>
    <button data-action="autoplay">Rót thử ngay</button>
  </div>
</div>`;
}

function buildIronCopperSulfateHud() {
  return `<div class="hud">
  <div class="panel" data-courseware-role="intro">
    <h1 class="lesson-title">Đinh sắt trong dung dịch CuSO4</h1>
    <p class="lesson-desc">Kéo đinh sắt vào cốc chứa dung dịch đồng(II) sunfat để quan sát phản ứng thế.</p>
    <p class="lesson-desc lesson-hint">Hiện tượng cần nhận ra: trên đinh xuất hiện lớp đồng đỏ nâu, còn màu xanh của dung dịch nhạt dần.</p>
  </div>

  <div class="status" data-courseware-role="status">
    <div class="status-label">Trạng thái thí nghiệm</div>
    <div id="statusText">Sẵn sàng. Hãy kéo đinh sắt vào cốc CuSO4.</div>
    <div id="statusSub">Golden path: đưa đinh vào dung dịch để theo dõi lớp đồng bám lên bề mặt và màu xanh giảm dần.</div>
  </div>

  <div class="controls" data-courseware-role="controls">
    <button class="secondary" id="resetBtn" data-action="reset" type="button">Đặt lại</button>
    <button id="pourBtn" data-action="autoplay" type="button">Chạy tự động</button>
  </div>
</div>`;
}

function buildDefaultScene() {
  return `import * as THREE from 'three';
import { createSceneShell } from '../../lib/runtime/scene-shell.js';
import { installCoursewareTestHarness } from '../../lib/testing/harness.js';

const {
  createManipulationController,
  modelsOverlapOrNear,
  smoothstep01,
} = globalThis.ChemSharedLib;

const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const autoplayButton = document.querySelector('[data-action="autoplay"]');
const resetButton = document.querySelector('[data-action="reset"]');
const canvas = document.getElementById('stage');

const shell = createSceneShell({
  canvas,
  theme: 'chem-lab-v1',
  cameraPreset: 'bench-3qtr',
  hud: {
    statusText,
    statusSub,
    primaryAction: autoplayButton,
    reset: resetButton,
  },
});

const { renderer, scene, camera, controls, bench } = shell;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minAzimuthAngle = -0.7;
controls.maxAzimuthAngle = 0.7;
controls.update();

const labStage = new THREE.Group();
labStage.position.y = 0.04;
scene.add(labStage);

const rack = new THREE.Group();
labStage.add(rack);
bench.add(rack);

const sample = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.32, 0.9, 32),
  new THREE.MeshStandardMaterial({ color: 0xff5f87, roughness: 0.24, metalness: 0.04 })
);
sample.position.set(-0.7, 1.6, 0);
labStage.add(sample);

const paper = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 1.1, 0.04),
  new THREE.MeshStandardMaterial({ color: 0x9b7bff, roughness: 0.72 })
);
paper.position.set(1.4, 1.7, 0.18);
labStage.add(paper);

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.7);
const paperHome = new THREE.Vector3(1.4, 1.7, 0.18);
const paperTarget = new THREE.Vector3(-0.72, 1.68, 0.08);
const statusTokens = {
  idle: { text: 'Sẵn sàng', sub: 'Hãy thao tác với mẫu thử.' },
  manual: { text: 'Đã thao tác thủ công', sub: 'Giấy thử đã chạm mẫu và đổi màu.' },
  autoplay: { text: 'Tự chạy đang thực hiện', sub: 'Luồng hướng dẫn đang đưa giấy thử vào mẫu.' },
  result: { text: 'Kết quả đã hiện ra', sub: 'Màu sắc thay đổi rõ ràng và ổn định.' },
};
const baseline = {
  phase: 'idle',
  narrationT: 0,
};
const state = { ...baseline };

function renderHud() {
  const token = statusTokens[state.phase] || statusTokens.idle;
  statusText.textContent = token.text;
  statusSub.textContent = token.sub;
}

function completeManualStep() {
  state.phase = 'manual';
  state.narrationT = 0;
  paper.position.copy(paperTarget);
  paper.material.color.set(0xff65c8);
  renderHud();
  return true;
}

function runAutoplay() {
  state.phase = 'autoplay';
  state.narrationT = 0;
  manipulation.setEnabled(false);
  renderHud();
  return true;
}

function resetScene() {
  state.phase = 'idle';
  state.narrationT = 0;
  paper.position.copy(paperHome);
  paper.material.color.set(0x9b7bff);
  manipulation.setEnabled(true);
  renderHud();
}

installCoursewareTestHarness({
  state,
  mapState(current) {
    return { ...current };
  },
  getVerifierMeta() {
    return { successPhase: 'result', supportsGoldenPath: true };
  },
  getGoldenPath() {
    return [{ type: 'run-autoplay', afterMs: 120 }];
  },
  dragFromPageApi({ sampleId } = {}) {
    return completeManualStep(sampleId || 'Li');
  },
  getDragPath(sampleId) {
    if ((sampleId || 'Li') !== 'Li' || !canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      from: { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.6 },
      to: { x: rect.left + rect.width * 0.42, y: rect.top + rect.height * 0.5 },
    };
  },
  runVerifierStep(step) {
    if (step?.type === 'run-autoplay') {
      return runAutoplay();
    }
    return false;
  },
});

const manipulation = createManipulationController({
  camera,
  renderer,
  controls,
  defaultDragPlane: dragPlane,
});

manipulation.register({
  id: 'paper',
  object: paper,
  bounds: {
    min: new THREE.Vector3(-1.5, 1.45, -0.2),
    max: new THREE.Vector3(1.6, 1.9, 0.6),
  },
  onDragEnd() {
    if (state.phase === 'autoplay') {
      return;
    }
    if (modelsOverlapOrNear(paper, sample, 0.16)) {
      completeManualStep();
      return;
    }
    paper.position.copy(paperHome);
  },
});

autoplayButton?.addEventListener('click', () => {
  runAutoplay();
});

resetButton?.addEventListener('click', () => {
  resetScene();
});

let lastT = performance.now();
function animate(t = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (t - lastT) / 1000));
  lastT = t;
  state.narrationT += dt;

  if (state.phase === 'autoplay') {
    const progress = Math.min(state.narrationT / 1.15, 1);
    const eased = smoothstep01(progress);
    paper.position.copy(paperHome.clone().lerp(paperTarget, eased));
    if (progress >= 1) {
      state.phase = 'result';
      paper.material.color.set(0x4f8bff);
      manipulation.setEnabled(true);
      renderHud();
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resetScene();
requestAnimationFrame(animate);
`;
}

function buildIronCopperSulfateScene() {
  return `import * as THREE from 'three';
import { createSceneShell } from '../../lib/runtime/scene-shell.js';
import { installCoursewareTestHarness } from '../../lib/testing/harness.js';

const {
  createManipulationController,
  modelsOverlapOrNear,
  smoothstep01,
} = globalThis.ChemSharedLib;

const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const autoplayButton = document.querySelector('[data-action="autoplay"]');
const resetButton = document.querySelector('[data-action="reset"]');
const canvas = document.getElementById('stage');

const shell = createSceneShell({
  canvas,
  theme: 'chem-lab-v1',
  cameraPreset: 'bench-3qtr',
  hud: {
    statusText,
    statusSub,
    primaryAction: autoplayButton,
    reset: resetButton,
  },
});

const { renderer, scene, camera, controls, bench } = shell;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minAzimuthAngle = -0.85;
controls.maxAzimuthAngle = 0.85;
controls.update();

const labStage = new THREE.Group();
labStage.position.y = 0.02;
scene.add(labStage);

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.26);
const baseBlue = new THREE.Color(0x3f87df);
const fadedBlue = new THREE.Color(0xbfd8f5);
const steelBase = new THREE.Color(0xa4adb8);
const copperBrown = new THREE.Color(0xb3683b);

const spotlight = new THREE.PointLight(0x7fb6ff, 1.1, 9, 2);
spotlight.position.set(0.4, 4.6, 2.6);
scene.add(spotlight);

const tray = new THREE.Mesh(
  new THREE.CylinderGeometry(2.15, 2.3, 0.14, 56),
  new THREE.MeshStandardMaterial({ color: 0x192233, roughness: 0.88, metalness: 0.14 })
);
tray.position.set(-0.1, 1.4, 0);
tray.receiveShadow = true;
labStage.add(tray);

const trayInset = new THREE.Mesh(
  new THREE.CylinderGeometry(1.78, 1.9, 0.03, 56),
  new THREE.MeshStandardMaterial({ color: 0x253148, roughness: 0.92, metalness: 0.08 })
);
trayInset.position.set(-0.1, 1.47, 0);
trayInset.receiveShadow = true;
labStage.add(trayInset);

const teacherCard = new THREE.Mesh(
  new THREE.BoxGeometry(1.48, 1.28, 0.05),
  new THREE.MeshStandardMaterial({ color: 0xf0f5ff, roughness: 0.86, metalness: 0.04 })
);
teacherCard.position.set(2.72, 2.18, -0.32);
teacherCard.rotation.y = -0.3;
teacherCard.rotation.z = 0.04;
teacherCard.castShadow = true;
labStage.add(teacherCard);

const teacherAccent = new THREE.Mesh(
  new THREE.BoxGeometry(1.12, 0.16, 0.055),
  new THREE.MeshStandardMaterial({ color: 0x2e82d2, roughness: 0.42, metalness: 0.08 })
);
teacherAccent.position.set(0, 0.42, 0.005);
teacherCard.add(teacherAccent);

for (let i = 0; i < 4; i += 1) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.96 - i * 0.1, 0.045, 0.056),
    new THREE.MeshStandardMaterial({ color: 0xb2bfd5, roughness: 0.6, metalness: 0.04 })
  );
  line.position.set(-0.08, 0.1 - i * 0.18, 0.005);
  teacherCard.add(line);
}

const beaker = new THREE.Group();
beaker.position.set(-0.32, 2.05, 0.08);
labStage.add(beaker);

const beakerGlass = new THREE.Mesh(
  new THREE.CylinderGeometry(0.62, 0.68, 1.52, 64, 1, true),
  new THREE.MeshPhysicalMaterial({
    color: 0xd6e8ff,
    transmission: 0.82,
    transparent: true,
    opacity: 0.3,
    roughness: 0.08,
    thickness: 0.22,
    metalness: 0,
  })
);
beakerGlass.castShadow = true;
beaker.add(beakerGlass);

const beakerBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.51, 0.56, 0.07, 48),
  new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: 0.18, metalness: 0.06, transparent: true, opacity: 0.84 })
);
beakerBase.position.y = -0.72;
beaker.add(beakerBase);

const beakerRim = new THREE.Mesh(
  new THREE.TorusGeometry(0.64, 0.035, 16, 56),
  new THREE.MeshStandardMaterial({ color: 0xe8f2ff, roughness: 0.18, metalness: 0.14 })
);
beakerRim.rotation.x = Math.PI / 2;
beakerRim.position.y = 0.73;
beaker.add(beakerRim);

const solutionFill = new THREE.Mesh(
  new THREE.CylinderGeometry(0.54, 0.57, 0.98, 48),
  new THREE.MeshStandardMaterial({
    color: baseBlue,
    emissive: 0x103a6b,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.84,
    roughness: 0.18,
    metalness: 0.02,
  })
);
solutionFill.position.y = -0.16;
beaker.add(solutionFill);

const solutionSurface = new THREE.Mesh(
  new THREE.CircleGeometry(0.56, 40),
  new THREE.MeshStandardMaterial({
    color: 0x8dccff,
    transparent: true,
    opacity: 0.74,
    roughness: 0.08,
    metalness: 0.02,
  })
);
solutionSurface.rotation.x = -Math.PI / 2;
solutionSurface.position.y = 0.33;
beaker.add(solutionSurface);

const solutionHalo = new THREE.Mesh(
  new THREE.CylinderGeometry(0.86, 0.96, 0.03, 48),
  new THREE.MeshBasicMaterial({ color: 0x58a8ff, transparent: true, opacity: 0.18 })
);
solutionHalo.position.set(0, -0.66, 0);
solutionHalo.rotation.x = Math.PI / 2;
beaker.add(solutionHalo);

const beakerShadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.92, 36),
  new THREE.MeshBasicMaterial({ color: 0x08111f, transparent: true, opacity: 0.16 })
);
beakerShadow.rotation.x = -Math.PI / 2;
beakerShadow.position.set(-0.32, 1.42, 0.08);
labStage.add(beakerShadow);

const reactionZone = new THREE.Mesh(
  new THREE.CylinderGeometry(0.3, 0.34, 1.16, 28),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
);
reactionZone.position.copy(beaker.position);
reactionZone.position.y += 0.05;
labStage.add(reactionZone);

const nail = new THREE.Group();
labStage.add(nail);

const nailHead = new THREE.Mesh(
  new THREE.CylinderGeometry(0.18, 0.18, 0.08, 28),
  new THREE.MeshStandardMaterial({ color: 0x8d97a7, roughness: 0.32, metalness: 0.76 })
);
nailHead.rotation.z = Math.PI / 2;
nailHead.position.x = -0.1;
nailHead.castShadow = true;
nail.add(nailHead);

const nailBodyMaterial = new THREE.MeshStandardMaterial({ color: steelBase, roughness: 0.34, metalness: 0.86 });
const nailBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.075, 0.075, 1.62, 18),
  nailBodyMaterial
);
nailBody.rotation.z = Math.PI / 2;
nailBody.position.x = 0.46;
nailBody.castShadow = true;
nail.add(nailBody);

const nailTip = new THREE.Mesh(
  new THREE.ConeGeometry(0.075, 0.24, 18),
  new THREE.MeshStandardMaterial({ color: 0x939cab, roughness: 0.34, metalness: 0.82 })
);
nailTip.rotation.z = -Math.PI / 2;
nailTip.position.x = 1.28;
nailTip.castShadow = true;
nail.add(nailTip);

const copperCoat = new THREE.Mesh(
  new THREE.CylinderGeometry(0.088, 0.088, 1.44, 18),
  new THREE.MeshStandardMaterial({
    color: copperBrown,
    roughness: 0.7,
    metalness: 0.24,
    emissive: 0x3a190b,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0,
  })
);
copperCoat.rotation.z = Math.PI / 2;
copperCoat.position.x = 0.42;
nail.add(copperCoat);

const copperTip = new THREE.Mesh(
  new THREE.ConeGeometry(0.088, 0.2, 18),
  new THREE.MeshStandardMaterial({
    color: 0xc77842,
    roughness: 0.68,
    metalness: 0.22,
    emissive: 0x4d2010,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0,
  })
);
copperTip.rotation.z = -Math.PI / 2;
copperTip.position.x = 1.28;
nail.add(copperTip);

const depositSpecks = [];
for (let i = 0; i < 8; i += 1) {
  const speck = new THREE.Mesh(
    new THREE.SphereGeometry(0.035 + (i % 3) * 0.007, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xc77440,
      roughness: 0.76,
      metalness: 0.14,
      transparent: true,
      opacity: 0,
    })
  );
  speck.position.set(-0.02 + i * 0.18, ((i % 2) - 0.5) * 0.12, ((i % 3) - 1) * 0.045);
  nail.add(speck);
  depositSpecks.push(speck);
}

const bubbleGroup = new THREE.Group();
beaker.add(bubbleGroup);
const bubbles = [];
for (let i = 0; i < 10; i += 1) {
  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.03 + (i % 3) * 0.012, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xe4f4ff,
      transparent: true,
      opacity: 0,
      roughness: 0.06,
      metalness: 0.02,
    })
  );
  bubble.position.set(-0.12 + (i % 5) * 0.12, -0.44 + (i % 4) * 0.12, -0.06 + (i % 2) * 0.12);
  bubbleGroup.add(bubble);
  bubbles.push({ mesh: bubble, offset: i * 0.45 });
}

const nailHome = {
  position: new THREE.Vector3(2.18, 2.22, 0.46),
  rotationX: 0,
  rotationZ: 0.18,
};
const nailTarget = {
  position: new THREE.Vector3(0.12, 2.26, 0.18),
  rotationX: 0,
  rotationZ: -0.92,
};
const nailHover = {
  position: new THREE.Vector3(0.4, 2.28, 0.3),
  rotationX: 0,
  rotationZ: -0.48,
};

function applyNailPose(position, rotationZ, rotationX = 0) {
  nail.position.copy(position);
  nail.rotation.set(rotationX, 0, rotationZ);
}

const statusTokens = {
  idle: {
    text: 'Sẵn sàng. Hãy kéo đinh sắt vào cốc CuSO4.',
    sub: 'Quan sát trước khi phản ứng: đinh màu xám bạc, dung dịch có màu xanh lam rõ.',
    accent: 0x2f8bd2,
  },
  autoplay: {
    text: 'Đang đưa đinh sắt vào dung dịch CuSO4...',
    sub: 'Luồng tự động đang thực hiện thao tác nhúng đinh vào cốc.',
    accent: 0x56a1ff,
  },
  reaction: {
    text: 'Đinh sắt đang phản ứng với CuSO4.',
    sub: 'Đồng kim loại bắt đầu bám lên đinh, đồng thời màu xanh của dung dịch giảm dần.',
    accent: 0xd57d47,
  },
  result: {
    text: 'Đã thu được lớp đồng đỏ nâu trên đinh sắt.',
    sub: 'Sau phản ứng, bề mặt đinh phủ màu đồng đỏ nâu và dung dịch xanh nhạt hơn ban đầu.',
    accent: 0xc9703f,
  },
};

const baseline = {
  phase: 'idle',
  reactionT: 0,
  reactionProgress: 0,
  narrationT: 0,
  hasManualResult: false,
  hasAutoplayResult: false,
};

const state = { ...baseline };

function renderHud() {
  if (!statusText || !statusSub) {
    return;
  }

  const token = statusTokens[state.phase] || statusTokens.idle;
  statusText.textContent = token.text;

  if (state.phase === 'reaction') {
    if (state.reactionProgress < 0.34) {
      statusSub.textContent = 'Đồng bắt đầu kết tủa bám trên đinh, dung dịch vẫn còn xanh khá đậm.';
    } else if (state.reactionProgress < 0.72) {
      statusSub.textContent = 'Lớp đồng đỏ nâu dày hơn trên đinh và dung dịch CuSO4 đang nhạt màu đi.';
    } else {
      statusSub.textContent = 'Bề mặt đinh gần phủ kín lớp đồng; màu xanh của dung dịch đã giảm rõ rệt.';
    }
  } else {
    statusSub.textContent = token.sub;
  }

  teacherAccent.material.color.setHex(token.accent);
  spotlight.color.setHex(token.accent);
}

function beginReaction(mode = 'manual') {
  state.phase = 'reaction';
  state.reactionT = 0;
  state.reactionProgress = 0;
  state.narrationT = 0;
  state.hasManualResult = mode === 'manual';
  state.hasAutoplayResult = mode === 'autoplay';
  applyNailPose(nailTarget.position, nailTarget.rotationZ, nailTarget.rotationX);
  renderHud();
  return true;
}

function finishReaction() {
  state.phase = 'result';
  state.reactionProgress = 1;
  state.narrationT = 0;
  manipulation.setEnabled(true);
  renderHud();
}

function runAutoplay() {
  state.phase = 'autoplay';
  state.reactionT = 0;
  state.reactionProgress = 0;
  state.narrationT = 0;
  state.hasManualResult = false;
  state.hasAutoplayResult = true;
  manipulation.setEnabled(false);
  renderHud();
  return true;
}

function resetScene() {
  Object.assign(state, baseline);
  manipulation.setEnabled(true);
  applyNailPose(nailHome.position, nailHome.rotationZ, nailHome.rotationX);
  renderHud();
  return true;
}

installCoursewareTestHarness({
  state,
  mapState(current) {
    return { ...current };
  },
  getVerifierMeta() {
    return { successPhase: 'result', supportsGoldenPath: true };
  },
  getGoldenPath() {
    return [{ type: 'run-verifier-autoplay', afterMs: 120 }];
  },
  dragFromPageApi({ sampleId } = {}) {
    if (sampleId && sampleId !== 'Li') {
      return false;
    }
    return beginReaction('manual');
  },
  getDragPath(sampleId) {
    if ((sampleId || 'Li') !== 'Li' || !canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      from: { x: rect.left + rect.width * 0.76, y: rect.top + rect.height * 0.58 },
      to: { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 },
    };
  },
  runVerifierStep(step) {
    if (step?.type === 'run-verifier-autoplay') {
      return runVerifierAutoplay();
    }
    if (step?.type === 'run-autoplay') {
      return runAutoplay();
    }
    return false;
  },
});

const manipulation = createManipulationController({
  camera,
  renderer,
  controls,
  defaultDragPlane: dragPlane,
});

manipulation.register({
  id: 'iron-nail',
  object: nail,
  bounds: {
    min: new THREE.Vector3(-0.2, 2.16, -0.1),
    max: new THREE.Vector3(2.25, 2.36, 0.74),
  },
  onDragEnd() {
    if (state.phase === 'autoplay' || state.phase === 'reaction') {
      return;
    }
    if (modelsOverlapOrNear(nail, reactionZone, 0.2)) {
      beginReaction('manual');
      return;
    }
    applyNailPose(nailHome.position, nailHome.rotationZ, nailHome.rotationX);
  },
});

autoplayButton?.addEventListener('click', () => {
  runAutoplay();
});

resetButton?.addEventListener('click', () => {
  resetScene();
});

const reusableColor = new THREE.Color();
let lastT = performance.now();
function animate(t = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (t - lastT) / 1000));
  lastT = t;

  state.narrationT += dt;

  if (state.phase === 'autoplay') {
    const progress = Math.min(state.narrationT / 1.1, 1);
    const eased = smoothstep01(progress);
    applyNailPose(
      nailHome.position.clone().lerp(nailHover.position, eased),
      THREE.MathUtils.lerp(nailHome.rotationZ, nailHover.rotationZ, eased),
      0
    );
    if (progress >= 1) {
      beginReaction('autoplay');
    }
  }

  if (state.phase === 'reaction') {
    state.reactionT += dt;
    state.reactionProgress = Math.min(state.reactionT / 1.85, 1);
    renderHud();
    if (state.reactionProgress >= 1) {
      finishReaction();
    }
  }

  if (state.phase === 'idle') {
    nail.position.y = nailHome.position.y + Math.sin(t * 0.0016) * 0.02;
    teacherCard.rotation.y = -0.3 + Math.sin(t * 0.0008) * 0.016;
  } else if (state.phase === 'result') {
    teacherCard.rotation.y += (-0.24 - teacherCard.rotation.y) * (1 - Math.exp(-dt * 3.2));
  }

  const visualProgress = state.phase === 'result'
    ? 1
    : state.phase === 'reaction'
      ? state.reactionProgress
      : 0;

  reusableColor.copy(baseBlue).lerp(fadedBlue, visualProgress);
  solutionFill.material.color.copy(reusableColor);
  solutionFill.material.opacity = 0.84 - visualProgress * 0.18;
  solutionFill.material.emissiveIntensity = 0.18 + (1 - visualProgress) * 0.1;
  solutionSurface.material.opacity = 0.74 - visualProgress * 0.24;
  solutionSurface.material.color.setHSL(0.57, 0.85 - visualProgress * 0.25, 0.72 + visualProgress * 0.12);
  solutionHalo.material.opacity = 0.16 + Math.sin(t * 0.0022) * 0.03 + (1 - visualProgress) * 0.08;

  nailBodyMaterial.color.copy(steelBase).lerp(new THREE.Color(0x8b7f74), visualProgress * 0.3);
  copperCoat.material.opacity = visualProgress * 0.9;
  copperTip.material.opacity = visualProgress * 0.95;
  copperCoat.scale.set(1, 1 + visualProgress * 0.02, 1 + visualProgress * 0.02);
  copperTip.scale.setScalar(1 + visualProgress * 0.04);
  depositSpecks.forEach((speck, index) => {
    speck.material.opacity = Math.max(0, visualProgress * 0.9 - index * 0.05);
    speck.position.y = ((index % 2) - 0.5) * 0.12 + Math.sin(t * 0.002 + index) * 0.01 * visualProgress;
  });

  bubbles.forEach(({ mesh, offset }, index) => {
    const rise = (t * 0.0014 + offset) % 1;
    mesh.material.opacity = visualProgress > 0.08
      ? (0.12 + (1 - rise) * 0.22) * Math.min(1, visualProgress * 1.6)
      : 0;
    mesh.position.y = -0.48 + rise * 0.88;
    mesh.position.x = -0.15 + (index % 5) * 0.12 + Math.sin(t * 0.002 + offset) * 0.025 * visualProgress;
    mesh.scale.setScalar(0.82 + rise * 0.36);
  });

  beaker.rotation.y = Math.sin(t * 0.0006) * 0.03;
  beakerShadow.material.opacity = 0.14 + Math.sin(t * 0.0012) * 0.015;
  trayInset.material.emissive = new THREE.Color(0x13243b);
  trayInset.material.emissiveIntensity = 0.08 + (1 - visualProgress) * 0.04;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resetScene();
requestAnimationFrame(animate);
`;
}

async function loadRecipeDefinition(recipeId) {
  if (!recipeId) {
    return null;
  }
  const recipePath = path.join(recipesDir, `${recipeId}.recipe.json`);
  const recipe = JSON.parse(await fs.readFile(recipePath, 'utf8'));
  const result = validateRecipeDefinition(recipe);
  if (!result.ok) {
    throw new Error(`Invalid recipe ${recipeId}: ${result.errors.join(', ')}`);
  }
  return result.recipe;
}

async function readOptionalFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function buildMeta(draft, recipe = null, generatedBy = null) {
  return {
    topic: draft.topic,
    level: draft.level,
    skill: draft.skill,
    renderMode: draft.renderMode,
    themeVersion: draft.scene.themeVersion,
    ...(recipe ? { recipe: recipe.id, reaction: recipe.reaction, effects: recipe.effects } : {}),
    ...(generatedBy ? { generatedBy } : {}),
  };
}

export async function compileSemanticDraft({ slug, draftsDir, draft } = {}) {
  if (!slug) throw new Error('slug is required');
  if (!draftsDir) throw new Error('draftsDir is required');

  const result = validateSemanticDraft(draft);
  if (!result.ok) {
    throw new Error(`Invalid semantic draft: ${result.errors.join(', ')}`);
  }
  if (result.draft.kind === 'experiment' && result.draft.renderMode === 'threejs' && !result.draft.recipe) {
    throw new Error(
      '3D experiment drafts require semantic-draft.json.recipe. '
      + 'If no supported recipe exists, create a recipe-proposal.json from recipes/pattern-catalog.json instead of compiling HTML.'
    );
  }

  await fs.mkdir(draftsDir, { recursive: true });

  const useIronCopperSulfateScene = isIronCopperSulfateDraft(result.draft, slug);
  const useCopperHotSulfuricAcidScene = isCopperHotSulfuricAcidDraft(result.draft, slug);
  const recipe = await loadRecipeDefinition(result.draft.recipe);
  if (recipe && !supportsRecipeSceneBuilder(recipe.id)) {
    throw new Error(
      `Recipe ${recipe.id} does not have recipe-scene-builder support. `
      + 'Add a builder/runtime contract before compiling standalone HTML.'
    );
  }
  const recipeSceneArtifact = recipe
    ? buildRecipeSceneArtifact({ draft: result.draft, recipe })
    : null;
  const canonicalIronCopperSulfateHud = useIronCopperSulfateScene
    ? await readOptionalFile(path.join(canonicalIronCopperSulfateDir, 'iron-nail-cuso4-displacement.hud.html'))
    : null;
  const canonicalIronCopperSulfateScene = useIronCopperSulfateScene
    ? await readOptionalFile(path.join(canonicalIronCopperSulfateDir, 'iron-nail-cuso4-displacement.scene.js'))
    : null;
  const canonicalCopperHotSulfuricAcidHud = useCopperHotSulfuricAcidScene
    ? await readOptionalFile(path.join(canonicalCopperSulfuricAcidDir, 'cu-h2so4-heating.hud.html'))
    : null;
  const canonicalCopperHotSulfuricAcidScene = useCopperHotSulfuricAcidScene
    ? await readOptionalFile(path.join(canonicalCopperSulfuricAcidDir, 'cu-h2so4-heating.scene.js'))
    : null;
  const hudSource = recipeSceneArtifact?.hudSource || (useIronCopperSulfateScene
    ? (canonicalIronCopperSulfateHud || buildIronCopperSulfateHud())
    : useCopperHotSulfuricAcidScene
      ? (canonicalCopperHotSulfuricAcidHud || buildCopperHotSulfuricAcidHud())
      : buildDefaultHud());
  const sceneSource = recipeSceneArtifact?.sceneSource || (useIronCopperSulfateScene
    ? (canonicalIronCopperSulfateScene || buildIronCopperSulfateScene())
    : useCopperHotSulfuricAcidScene
      ? (canonicalCopperHotSulfuricAcidScene || buildCopperHotSulfuricAcidScene())
      : buildDefaultScene());

  await fs.writeFile(path.join(draftsDir, `${slug}.hud.html`), `${hudSource}\n`);
  await fs.writeFile(path.join(draftsDir, `${slug}.scene.js`), `${sceneSource}\n`);
  await fs.writeFile(
    path.join(draftsDir, `${slug}.meta.json`),
    `${JSON.stringify(buildMeta(result.draft, recipe, recipeSceneArtifact?.generatedBy), null, 2)}\n`
  );

  return { draftsDir, slug };
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    throw new Error('semantic draft path is required');
  }

  const absoluteInputPath = path.resolve(repoRoot, inputPath);
  const draft = JSON.parse(await fs.readFile(absoluteInputPath, 'utf8'));
  const draftsDir = path.dirname(absoluteInputPath);
  const slug = path.basename(draftsDir);

  await compileSemanticDraft({ slug, draftsDir, draft });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
