import * as THREE from 'three';
import { createSceneShell } from '../../lib/runtime/scene-shell.js';
import { installCoursewareTestHarness } from '../../lib/testing/harness.js';
import {
  createClassicErlenmeyerApparatus,
  createClassicMoistPaperApparatus,
} from '../../lib/classic-kit/apparatus.js';

const {
  createFreeDragController,
  applyAnchorPlacement,
  createGuidedAnchorMotion,
  createColorTransition,
  createSmokeField,
  projectWorldToCanvas,
} = globalThis.ChemSharedLib;

const canvas = document.getElementById('stage');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const autoplayButton = document.querySelector('[data-action="autoplay"]');
const resetButton = document.querySelector('[data-action="reset"]');

const shell = createSceneShell({
  canvas,
  theme: "showcase-bench",
  cameraPreset: "flask-showcase-close",
  hud: {
    statusText,
    statusSub,
    primaryAction: autoplayButton,
    reset: resetButton,
  },
});

const { renderer, scene, camera, controls, bench, theme: activeTheme } = shell;
const flaskShowcaseMaterials = activeTheme.apparatusVariants?.flask?.showcase?.materials || {};
const paperShowcaseMaterials = activeTheme.apparatusVariants?.tool?.showcase?.materials || {};
controls.enablePan = false;
controls.enableZoom = true;
controls.enableRotate = true;
controls.update();

const chlorineFlask = createClassicErlenmeyerApparatus({
  parent: bench,
  name: 'chlorine_flask',
  position: [0.06, 1.38, 0.06],
  rotation: [0, 0, 0],
  bodyRadiusTop: 0.46,
  bodyRadiusBottom: 0.76,
  bodyHeight: 1.94,
  neckRadius: 0.19,
  neckHeight: 0.78,
  fillRatio: 0,
  gasColor: "#d6e86a",
  gasOpacity: 0.18,
  gasHeightRatio: 0.64,
  gasBaseY: 0.42,
  materials: flaskShowcaseMaterials,
});

const moistPaper = createClassicMoistPaperApparatus({
  parent: bench,
  name: 'moist_colored_paper',
  position: [1.74, 2.24, 0.34],
  rotation: [0.04, 0, -0.18],
  length: 0.74,
  width: 0.2,
  thickness: 0.012,
  contactRatio: 0.46,
  color: "#f26b28",
  wetColor: "#f26b28",
  wireLength: 0.9,
  wireRadius: 0.012,
  wireColor: "#8993a0",
  stopperRadius: 0.19,
  stopperHeight: 0.22,
  stopperColor: "#d0c59c",
  materials: paperShowcaseMaterials,
});
moistPaper.controllers.setWetness(1);

const state = {
  phase: 'idle',
  activeStep: 'ready',
  paperInserted: false,
  reactionProgress: 0,
  source: 'recipe-scene-builder',
  recipe: "moist-chlorine-bleaches-colored-paper",
};
const recipeStepContract = {
  "recipe": "moist-chlorine-bleaches-colored-paper",
  "interaction": "free-drag-contact",
  "resultSustainEffects": [
    "smoke-field"
  ],
  "steps": [
    {
      "id": "insert-moist-paper",
      "type": "drag-drop-anchor",
      "source": "classic-moist-paper.probeGrip",
      "sourcePlacementAnchor": "classic-moist-paper.stopperSeat",
      "target": "classic-erlenmeyer.mouth",
      "targetRadius": 0.52,
      "overlapPadding": 0.24,
      "placementOffset": [
        0,
        0.025,
        0.01
      ],
      "placementRotation": [
        0.02,
        0,
        0
      ],
      "onComplete": "start-reaction"
    },
    {
      "id": "finish-reaction",
      "type": "reaction-progress",
      "reaction": "moist-chlorine-bleaching",
      "successPhase": "result"
    }
  ]
};
const recipeCapabilities = {
  "source": "recipe-scene-builder",
  "generatedBy": "recipe-scene-builder",
  "recipe": "moist-chlorine-bleaches-colored-paper",
  "interaction": "free-drag-contact",
  "draggables": [
    "moist_colored_paper"
  ],
  "resultSustainEffects": [
    "smoke-field"
  ],
  "steps": [
    "insert-moist-paper",
    "finish-reaction"
  ],
  "anchors": [
    "classic-moist-paper.probeGrip",
    "classic-moist-paper.stopperSeat",
    "classic-erlenmeyer.mouth",
    "classic-erlenmeyer.gasVolume"
  ]
};

const homePose = {
  position: moistPaper.group.position.clone(),
  rotation: moistPaper.group.rotation.clone(),
};
const stripColor = createColorTransition({
  material: moistPaper.meshes.strip.material,
  from: "#f26b28",
  to: "#f7f1d8",
});
const wetPatchColor = createColorTransition({
  material: moistPaper.meshes.contactPatch.material,
  from: "#f26b28",
  to: "#f7f1d8",
});
const gasHaze = createSmokeField({
  parent: chlorineFlask.group,
  count: 96,
  color: "#d6e86a",
  size: 0.24,
  opacity: 0.18,
  spread: [0.22, 0.1, 0.22],
  velocity: [0.032, 0.042, 0.032],
  lifetime: [1.9, 3.0],
  driftStrength: 0.024,
  scaleRange: [0.32, 1.28],
  alphaRange: [0.32, 0.04],
  name: 'chlorine-gas-haze',
});

const dragController = createFreeDragController({
  camera,
  renderer,
  controls,
  dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.04),
  bounds: {
    min: new THREE.Vector3(-2.2, 1.46, -1.1),
    max: new THREE.Vector3(2.1, 2.82, 1.1),
  },
  targetRadius: 0.52,
});

const guidedProbeMotion = createGuidedAnchorMotion({
  source: moistPaper,
  sourceAnchor: "stopperSeat",
  target: chlorineFlask,
  targetAnchor: "mouth",
  parent: bench,
  offset: [
  0,
  0.025,
  0.01
],
  rotation: [
  0.02,
  0,
  0
],
  duration: 1.18,
  dragController,
  onStart() {
    state.activeStep = 'autoplay-moving';
    state.phase = 'autoplay';
    renderStatus();
  },
  onComplete() {
    insertPaperIntoChlorine('autoplay');
  },
});

function setStatus(text, sub) {
  if (statusText) statusText.textContent = text;
  if (statusSub) statusSub.textContent = sub;
}

function renderObservationWidget() {
  if (chlorineEquation) {
    chlorineEquation.textContent = 'Cl2 + H2O ⇌ HCl + HClO';
  }

  if (state.phase === 'result') {
    if (chlorinePaperState) {
      chlorinePaperState.textContent = 'Giấy gần trắng sau khi tiếp xúc với khí chlorine ẩm.';
    }
    if (chlorineCondition) {
      chlorineCondition.textContent = 'HClO sinh ra trên giấy ẩm đã oxi hóa chất màu, nên giấy bị tẩy màu.';
    }
    return;
  }

  if (state.phase === 'reaction' || state.paperInserted) {
    if (chlorinePaperState) {
      chlorinePaperState.textContent = 'Giấy đang nhạt dần từ màu cam sang gần trắng trong bình tam giác.';
    }
    if (chlorineCondition) {
      chlorineCondition.textContent = 'Điều kiện quyết định là giấy phải ẩm để Cl2 phản ứng với nước tạo HClO.';
    }
    return;
  }

  if (chlorinePaperState) {
    chlorinePaperState.textContent = 'Màu cam, chưa đưa vào bình khí chlorine.';
  }
  if (chlorineCondition) {
    chlorineCondition.textContent = 'Giấy phải ẩm để tạo HClO rồi mới bị tẩy màu.';
  }
}

function renderStatus() {
  renderObservationWidget();
  if (guidedProbeMotion.state.active || state.activeStep === 'autoplay-moving') {
    setStatus(
      'Đang đưa giấy màu ẩm vào bình tam giác chứa khí chlorine...',
      'Nút đậy giữ giấy treo trong bình để vùng giấy ẩm tiếp xúc trực tiếp với Cl2.'
    );
    return;
  }

  if (state.phase === 'result') {
    setStatus(
      'Giấy màu ẩm đã bị tẩy gần trắng.',
      'Cl2 + H2O ⇌ HCl + HClO; HClO oxi hóa chất màu nên giấy mất màu.'
    );
    return;
  }

  if (state.phase === 'reaction') {
    const percent = Math.round(state.reactionProgress * 100);
    setStatus(
      'Giấy màu ẩm đang nhạt màu trong bình chlorine.',
      'Tiến trình tẩy màu: ' + percent + '%. Khí Cl2 chỉ tẩy màu khi có nước tạo HClO.'
    );
    return;
  }

  if (state.paperInserted) {
    setStatus(
      'Giấy đã nằm trong vùng khí chlorine ẩm.',
      'Quan sát mẩu giấy đổi từ màu cam sang nhạt rồi gần trắng ngay trong bình tam giác.'
    );
    return;
  }

  setStatus(
    'Sẵn sàng. Hãy đưa giấy màu ẩm treo trên dây kim loại vào bình Cl2.',
    "Tính tẩy màu của khí chlorine ẩm: giấy phải ẩm để tạo HClO, chất trực tiếp gây tẩy màu."
  );
}

function updateBleaching(progress) {
  const value = Math.max(0, Math.min(1, progress));
  moistPaper.controllers.setWetness(1 - value * 0.2);
  stripColor.setProgress(value);
  wetPatchColor.setProgress(Math.min(1, value * 1.08));
  chlorineFlask.controllers.setGasOpacity?.(0.14 + Math.sin(value * Math.PI) * 0.035);
}

function insertPaperIntoChlorine(mode = 'manual') {
  state.paperInserted = true;
  state.activeStep = "insert-moist-paper";
  state.phase = 'reaction';
  state.reactionProgress = 0;
  applyAnchorPlacement({
    source: moistPaper,
    sourceAnchor: "stopperSeat",
    target: chlorineFlask,
    targetAnchor: "mouth",
    parent: bench,
    offset: [
  0,
  0.025,
  0.01
],
    rotation: [
  0.02,
  0,
  0
],
  });
  renderStatus();
  return true;
}

function finishReaction() {
  if (!state.paperInserted) {
    insertPaperIntoChlorine('autoplay');
  }
  state.phase = 'result';
  state.activeStep = "finish-reaction";
  state.reactionProgress = 1;
  updateBleaching(1);
  renderStatus();
  return true;
}

function resetScene() {
  guidedProbeMotion.cancel({ restoreDrag: true });
  dragController.reset();
  moistPaper.group.position.copy(homePose.position);
  moistPaper.group.rotation.copy(homePose.rotation);
  state.phase = 'idle';
  state.activeStep = 'ready';
  state.paperInserted = false;
  state.reactionProgress = 0;
  stripColor.reset();
  wetPatchColor.reset();
  moistPaper.controllers.setWetness(1);
  chlorineFlask.controllers.setGasOpacity?.(0.16);
  gasHaze.reset();
  renderStatus();
}

dragController.registerDraggable({
  id: 'moist_colored_paper',
  object: moistPaper.group,
  pickObjects: Object.values(moistPaper.meshes).filter(Boolean),
  dragAnchor: moistPaper.anchors["probeGrip"],
  validTargets: [{
    id: "chlorine_flask.mouth",
    anchor: chlorineFlask.anchors["mouth"],
    radius: 0.52,
    overlapObject: chlorineFlask.group,
    overlapPadding: 0.24,
    onDropTarget() {
      insertPaperIntoChlorine('manual');
    },
  }],
  onReturnHome() {
    if (!state.paperInserted) {
      renderStatus();
    }
  },
});

function getGoldenPath() {
  return [
    { type: 'pageApiCall', method: 'runVerifierStep', args: ["insert-moist-paper"], afterMs: 500 },
    { type: 'wait', ms: 1100, afterMs: 100 },
    { type: 'pageApiCall', method: 'runVerifierStep', args: ["finish-reaction"], afterMs: 250 },
  ];
}

function runVerifierStep(step) {
  const stepType = typeof step === 'string' ? step : step?.type;
  if (stepType === "insert-moist-paper" || stepType === 'run-autoplay') {
    return insertPaperIntoChlorine('autoplay');
  }
  if (stepType === "finish-reaction") {
    return finishReaction();
  }
  return false;
}

installCoursewareTestHarness({
  state,
  mapState() {
    return {
      phase: guidedProbeMotion.state.active || state.activeStep === 'autoplay-moving' ? 'autoplay' : state.phase,
      activeStep: state.activeStep,
      paperInserted: state.paperInserted,
      autoplayMotionActive: guidedProbeMotion.state.active,
      reactionProgress: state.reactionProgress,
      recipe: state.recipe,
      source: state.source,
      chlorineGasVisible: !!chlorineFlask.meshes.gasVolume?.visible,
    };
  },
  getVerifierMeta() {
    return {
      supportsGoldenPath: true,
      successPhase: "result",
      failureStatusText: 'Giấy chưa được đưa vào vùng khí chlorine trong bình tam giác',
    };
  },
  getCapabilities() {
    return recipeCapabilities;
  },
  getStepContract() {
    return recipeStepContract;
  },
  getGoldenPath,
  getDragPath() {
    return {
      type: 'drag',
      from: projectWorldToCanvas(moistPaper.anchors["probeGrip"], camera, renderer),
      to: projectWorldToCanvas(chlorineFlask.anchors["mouth"], camera, renderer),
      steps: 24,
      afterMs: 700,
    };
  },
  dragFromPageApi() {
    return insertPaperIntoChlorine('manual');
  },
  runVerifierStep,
});

autoplayButton?.addEventListener('click', () => {
  if (state.phase !== 'idle' || state.paperInserted) {
    return;
  }
  guidedProbeMotion.start();
});
resetButton?.addEventListener('click', resetScene);

let previousTime = performance.now();
function animate(now = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (now - previousTime) / 1000));
  previousTime = now;
  dragController.update(dt);
  guidedProbeMotion.update(dt);

  if (state.phase === 'reaction') {
    state.reactionProgress = Math.min(1, state.reactionProgress + dt / 3.4);
    updateBleaching(state.reactionProgress);
    if (state.reactionProgress >= 1) {
      state.phase = 'result';
      state.activeStep = "finish-reaction";
    }
  }

  const gasOrigin = chlorineFlask.anchors.gasVolume.position.clone();
  gasOrigin.y += state.phase === 'idle' ? 0.02 : 0.05;
  gasHaze.burst(gasOrigin, state.phase === 'reaction' ? 0.12 : 0.04, dt);
  gasHaze.update(dt, now * 0.001);
  renderStatus();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resetScene();
requestAnimationFrame(animate);

