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
const recipesDir = path.join(repoRoot, 'recipes');

function buildDefaultHud() {
  return `<div class="hud">
  <div class="panel">
    <h1 class="lesson-title">Mô phỏng thí nghiệm</h1>
    <p class="lesson-desc">Thao tác kéo thả trực tiếp trong mô hình 3D để quan sát hiện tượng.</p>
    <p class="lesson-desc lesson-hint">Gợi ý: bạn có thể xoay camera để nhìn rõ hơn.</p>
  </div>

  <div class="legend">
    <div class="legend-title">Điểm nhấn trực quan</div>
    <ul>
      <li>Kéo thả dụng cụ hoặc mẫu để thao tác.</li>
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
    <button data-action="autoplay">Chạy tự động</button>
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

const { renderer, scene, camera, controls } = shell;
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.minAzimuthAngle = -0.7;
controls.maxAzimuthAngle = 0.7;
controls.update();

const labStage = new THREE.Group();
labStage.position.y = 0.04;
scene.add(labStage);

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
  dragFromPageApi() {
    return completeManualStep();
  },
  getDragPath() {
    if (!canvas) {
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
  const hudSource = recipeSceneArtifact?.hudSource || buildDefaultHud();
  const sceneSource = recipeSceneArtifact?.sceneSource || buildDefaultScene();

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
