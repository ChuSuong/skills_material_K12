import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { compileSemanticDraft } from '../scripts/compile-semantic-draft.mjs';
import {
  buildRecipeSceneArtifact,
  supportsRecipeSceneBuilder,
} from '../scripts/build-recipe-scene.mjs';
import { auditRecipeSceneContract } from '../scripts/audit-recipe-scene-contract.mjs';

const ironRecipe = {
  id: 'iron-cuso4-displacement',
  theme: 'chem-lab-dark',
  cameraPreset: 'lab-close',
  requiredApparatus: ['iron-nail', 'beaker'],
  interaction: 'free-drag-contact',
  reaction: 'metal-displacement',
  effects: ['bubble-field', 'color-transition', 'material-progress'],
  resultSustainEffects: [],
  steps: [
    {
      id: 'place-iron',
      type: 'drag-drop-anchor',
      source: 'iron-nail.gripAnchor',
      sourcePlacementAnchor: 'iron-nail.sampleZone',
      target: 'beaker.effectOrigin',
      targetRadius: 0.78,
      overlapPadding: 0.28,
      placementOffset: [0.04, 0.08, 0.02],
      placementRotation: [0.04, 0, -1.36],
      onComplete: 'start-reaction',
    },
    {
      id: 'finish-reaction',
      type: 'reaction-progress',
      reaction: 'metal-displacement',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
};

const ironDraft = {
  kind: 'experiment',
  recipe: 'iron-cuso4-displacement',
  topic: 'Đinh sắt thả vào dung dịch CuSO4',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['iron-nail', 'beaker'],
    cameraPreset: 'lab-close',
    themeVersion: 'chem-lab-dark',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['place-iron', 'observe-copper-coating', 'finish-reaction'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

const ch4Recipe = {
  id: 'ch4-combustion-flame-test',
  theme: 'chem-lab-dark',
  cameraPreset: 'lab-close',
  requiredApparatus: ['gas-generator', 'gas-delivery-tube', 'test-tube', 'alcohol-burner'],
  interaction: 'free-drag-flame-test',
  reaction: 'methane-combustion',
  effects: ['bubble-field', 'steam-field', 'spark-field', 'glow-ring', 'flame-plume'],
  resultSustainEffects: ['steam-field', 'spark-field', 'glow-ring', 'flame-plume'],
  steps: [
    {
      id: 'release-ch4',
      type: 'drag-pour-anchor',
      source: 'gas-delivery-tube.gripAnchor',
      sourcePlacementAnchor: 'gas-delivery-tube.outletAnchor',
      target: 'test-tube.mouth',
      targetRadius: 0.46,
      overlapPadding: 0.38,
      placementOffset: [0, 0.1, 0],
      placementRotation: [0.08, 0, -0.12],
      onComplete: 'stage-gas',
    },
    {
      id: 'ignite-ch4',
      type: 'drag-heat-anchor',
      source: 'alcohol-burner.flameOrigin',
      sourcePlacementAnchor: 'alcohol-burner.flameOrigin',
      target: 'test-tube.steamOrigin',
      targetRadius: 0.56,
      overlapPadding: 0.24,
      placementOffset: [0.02, -0.1, 0],
      placementRotation: [0, 0, 0],
      onComplete: 'start-reaction',
    },
    {
      id: 'finish-combustion',
      type: 'reaction-progress',
      reaction: 'methane-combustion',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
};

const ch4Draft = {
  kind: 'experiment',
  recipe: 'ch4-combustion-flame-test',
  topic: 'Đốt cháy khí metan CH4',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['gas-generator', 'gas-delivery-tube', 'test-tube', 'alcohol-burner'],
    cameraPreset: 'lab-close',
    themeVersion: 'chem-lab-dark',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['release-ch4', 'ignite-ch4', 'finish-combustion'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

const moistChlorineRecipe = {
  id: 'moist-chlorine-bleaches-colored-paper',
  theme: 'showcase-bench',
  cameraPreset: 'flask-showcase-close',
  requiredApparatus: ['classic-moist-paper', 'classic-erlenmeyer'],
  interaction: 'free-drag-contact',
  reaction: 'moist-chlorine-bleaching',
  effects: ['color-transition', 'smoke-field'],
  resultSustainEffects: ['smoke-field'],
  steps: [
    {
      id: 'insert-moist-paper',
      type: 'drag-drop-anchor',
      source: 'classic-moist-paper.probeGrip',
      sourcePlacementAnchor: 'classic-moist-paper.stopperSeat',
      target: 'classic-erlenmeyer.mouth',
      targetRadius: 0.52,
      overlapPadding: 0.24,
      placementOffset: [0, 0.025, 0.01],
      placementRotation: [0.02, 0, 0],
      onComplete: 'start-reaction',
    },
    {
      id: 'finish-reaction',
      type: 'reaction-progress',
      reaction: 'moist-chlorine-bleaching',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
  visualRequirements: {
    initialPaperColor: '#f26b28',
    finalPaperColor: '#f7f1d8',
    gasColor: '#d6e86a',
    wireColor: '#8993a0',
    stopperColor: '#d0c59c',
  },
};

const moistChlorineDraft = {
  kind: 'experiment',
  recipe: 'moist-chlorine-bleaches-colored-paper',
  topic: 'Tìm hiểu tính tẩy màu của khí chlorine ẩm',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['classic-moist-paper', 'classic-erlenmeyer'],
    cameraPreset: 'flask-showcase-close',
    themeVersion: 'showcase-bench',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['insert-moist-paper', 'finish-reaction'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

const zincRecipe = {
  id: 'zinc-copper-hcl-compare',
  theme: 'showcase-bench',
  cameraPreset: 'rack-2tube-front',
  requiredApparatus: ['classic-solid-reagent-jar', 'classic-copper-piece', 'classic-test-tube', 'zinc-granules'],
  interaction: 'free-drag-contact',
  reaction: 'acid-metal-gas',
  effects: ['bubble-field', 'color-transition'],
  resultSustainEffects: [],
  steps: [
    {
      id: 'add-zinc',
      type: 'drag-drop-anchor',
      source: 'classic-solid-reagent-jar.gripAnchor',
      sourcePlacementAnchor: 'classic-solid-reagent-jar.dropAnchor',
      target: 'classic-test-tube.mouth',
      targetRadius: 0.44,
      overlapPadding: 0.22,
      onComplete: 'start-reaction',
    },
    {
      id: 'add-copper',
      type: 'drag-drop-anchor',
      source: 'classic-copper-piece.interactionZone',
      sourcePlacementAnchor: 'classic-copper-piece.interactionZone',
      target: 'classic-test-tube.mouth',
      targetRadius: 0.44,
      overlapPadding: 0.22,
      onComplete: 'observe-no-reaction',
    },
    {
      id: 'finish-reaction',
      type: 'reaction-progress',
      reaction: 'acid-metal-gas',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
};

const zincDraft = {
  kind: 'experiment',
  recipe: 'zinc-copper-hcl-compare',
  topic: 'Dung dịch HCl tác dụng với kim loại',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['classic-solid-reagent-jar', 'classic-copper-piece', 'classic-test-tube', 'zinc-granules'],
    cameraPreset: 'rack-2tube-front',
    themeVersion: 'showcase-bench',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['add-zinc', 'add-copper', 'finish-reaction'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

const hclNahco3Recipe = {
  id: 'hcl-nahco3-gas-release',
  theme: 'showcase-bench',
  cameraPreset: 'showcase-close',
  requiredApparatus: ['classic-solid-reagent-jar', 'classic-reagent-bottle', 'classic-test-tube'],
  interaction: 'free-drag-pour',
  reaction: 'acid-carbonate-gas',
  effects: ['bubble-field'],
  resultSustainEffects: ['bubble-field'],
  steps: [
    {
      id: 'add-solid',
      type: 'drag-drop-anchor',
      source: 'classic-solid-reagent-jar.gripAnchor',
      sourcePlacementAnchor: 'classic-solid-reagent-jar.dropAnchor',
      target: 'classic-test-tube.mouth',
      targetRadius: 0.42,
      overlapPadding: 0.22,
      onComplete: 'stage-solid',
    },
    {
      id: 'add-acid',
      type: 'drag-pour-anchor',
      source: 'classic-reagent-bottle.nozzle',
      sourcePlacementAnchor: 'classic-reagent-bottle.pourAlign',
      target: 'classic-test-tube.mouth',
      targetRadius: 0.38,
      overlapPadding: 0.2,
      onComplete: 'start-reaction',
    },
    {
      id: 'finish-reaction',
      type: 'reaction-progress',
      reaction: 'acid-carbonate-gas',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
};

const hclNahco3Draft = {
  kind: 'experiment',
  recipe: 'hcl-nahco3-gas-release',
  topic: 'Dung dịch HCl tác dụng với muối NaHCO3 rắn',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['classic-solid-reagent-jar', 'classic-reagent-bottle', 'classic-test-tube'],
    cameraPreset: 'showcase-close',
    themeVersion: 'showcase-bench',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['add-solid', 'add-acid', 'finish-reaction'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

const halogenRecipe = {
  id: 'halogen-halide-displacement-compare',
  theme: 'showcase-bench',
  cameraPreset: 'rack-3tube-front',
  requiredApparatus: ['classic-reagent-bottle', 'classic-test-tube'],
  interaction: 'free-drag-pour',
  reaction: 'halogen-halide-displacement',
  effects: ['pour-stream', 'color-transition'],
  resultSustainEffects: [],
  steps: [
    {
      id: 'add-cl2-to-nabr',
      type: 'drag-pour-anchor',
      source: 'classic-reagent-bottle.nozzle',
      sourcePlacementAnchor: 'classic-reagent-bottle.pourAlign',
      target: 'classic-test-tube.pourTarget',
      targetRadius: 0.58,
      overlapPadding: 0.28,
      placementOffset: [0, 0.56, 0.02],
      placementRotation: [0.48, 0, -0.18],
      onComplete: 'start-reaction',
    },
    {
      id: 'add-cl2-to-nai',
      type: 'drag-pour-anchor',
      source: 'classic-reagent-bottle.nozzle',
      sourcePlacementAnchor: 'classic-reagent-bottle.pourAlign',
      target: 'classic-test-tube.pourTarget',
      targetRadius: 0.58,
      overlapPadding: 0.28,
      placementOffset: [0, 0.56, 0.02],
      placementRotation: [0.48, 0, -0.18],
      onComplete: 'start-reaction',
    },
    {
      id: 'add-br2-to-nai',
      type: 'drag-pour-anchor',
      source: 'classic-reagent-bottle.nozzle',
      sourcePlacementAnchor: 'classic-reagent-bottle.pourAlign',
      target: 'classic-test-tube.pourTarget',
      targetRadius: 0.58,
      overlapPadding: 0.28,
      placementOffset: [0, 0.56, 0.02],
      placementRotation: [0.48, 0, 0.18],
      onComplete: 'start-reaction',
    },
    {
      id: 'finish-reaction',
      type: 'reaction-progress',
      reaction: 'halogen-halide-displacement',
      successPhase: 'result',
    },
  ],
  verifier: 'run-reaction-golden-path',
  visualRequirements: {
    tube1InitialColor: '#dff6ff',
    tube1FinalColor: '#c97a1a',
    tube23InitialColor: '#e6f7ff',
    tube23FinalColor: '#7a4a2a',
    chlorineWaterColor: '#d9ee75',
    bromineWaterColor: '#d08a37',
  },
};

const halogenDraft = {
  kind: 'experiment',
  recipe: 'halogen-halide-displacement-compare',
  topic: 'Phản ứng thế của một số muối halide',
  level: 'THCS',
  skill: 'chem-3d-experiment',
  language: 'vi',
  renderMode: 'threejs',
  scene: {
    apparatus: ['classic-reagent-bottle', 'classic-test-tube'],
    cameraPreset: 'rack-3tube-front',
    themeVersion: 'showcase-bench',
  },
  interaction: {
    primaryMode: 'direct-manipulation',
    goldenPath: ['add-cl2-to-nabr', 'add-cl2-to-nai', 'add-br2-to-nai', 'finish-reaction'],
    resetRequired: true,
    autoplayRequired: true,
  },
  verification: {
    requiresFormat: true,
    requiresSmoke: true,
    requiresCanvas: true,
    requiresInteraction: true,
    requiresVisibility: true,
    requiresOffline: true,
  },
};

test('recipe scene builder supports the iron CuSO4 recipe and emits generated-only scene code', () => {
  assert.equal(supportsRecipeSceneBuilder('iron-cuso4-displacement'), true);
  assert.equal(supportsRecipeSceneBuilder('sugar-h2so4-dehydration'), false);

  const artifact = buildRecipeSceneArtifact({ draft: ironDraft, recipe: ironRecipe });
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.hudSource, /Recipe: iron-cuso4-displacement/);
  assert.match(artifact.sceneSource, /@generated by scripts\/build-recipe-scene\.mjs/);
  assert.match(artifact.sceneSource, /createBeakerApparatus/);
  assert.match(artifact.sceneSource, /createIronNailApparatus/);
  assert.match(artifact.sceneSource, /createFreeDragController/);
  assert.match(artifact.sceneSource, /createMetalDisplacementReaction/);
  assert.match(artifact.sceneSource, /beaker\.anchors\["effectOrigin"\]/);
  assert.match(artifact.sceneSource, /duration: 8\.5/);
  assert.match(artifact.sceneSource, /applyAnchorPlacement\(\{/);
  assert.match(artifact.sceneSource, /createContextualLabelPolicy\(\{/);
  assert.match(artifact.sceneSource, /createGuidedAnchorMotion\(\{/);
  assert.match(artifact.sceneSource, /const recipeStepContract = /);
  assert.match(artifact.sceneSource, /const recipeCapabilities = /);
  assert.match(artifact.sceneSource, /"resultSustainEffects": \[\]/);
  assert.match(artifact.sceneSource, /getCapabilities\(\)/);
  assert.match(artifact.sceneSource, /getStepContract\(\)/);
  assert.match(artifact.sceneSource, /"type": "drag-drop-anchor"/);
  assert.match(artifact.sceneSource, /"type": "reaction-progress"/);
  assert.match(artifact.sceneSource, /"draggables": \[/);
  assert.match(artifact.sceneSource, /registerDraggable\(\{/);
  assert.match(artifact.sceneSource, /overlapObject: beaker\.group/);
  assert.match(artifact.sceneSource, /overlapPadding: 0\.28/);
  assert.match(artifact.sceneSource, /guidedIronMotion\.start\(\)/);
  assert.match(artifact.sceneSource, /guidedIronMotion\.update\(dt\)/);
  assert.match(artifact.sceneSource, /guidedIronMotion\.state\.active/);
  assert.match(artifact.sceneSource, /bubbleField\.update\(dt, now \* 0\.001\)/);
  assert.match(artifact.sceneSource, /controllers\.setLabel\(\{/);
  assert.match(artifact.sceneSource, /const ironNailLabel = \{/);
  assert.match(artifact.sceneSource, /ironNailLabelPolicy\.hide\(\)/);
  assert.match(artifact.sceneSource, /ironNailLabelPolicy\.show\(\)/);
  assert.doesNotMatch(artifact.sceneSource, /const autoplayMotion = \{/);
  assert.doesNotMatch(artifact.sceneSource, /function startAutoplayMotion\(\)/);
  assert.doesNotMatch(artifact.sceneSource, /function updateAutoplayMotion\(dt\)/);
  assert.doesNotMatch(artifact.sceneSource, /function makeIronSolutionPose\(\)/);
  assert.doesNotMatch(artifact.sceneSource, /window\.setTimeout\(\(\) => runVerifierStep\('finish-reaction'\), 1100\)/);
  assert.doesNotMatch(artifact.sceneSource, /autoplayButton\?\.\addEventListener\('click', \(\) => \{\s*runVerifierStep\('place-iron'\)/);
  assert.doesNotMatch(artifact.sceneSource, /\bnew\s+THREE\.(Mesh|BoxGeometry|CylinderGeometry|SphereGeometry|ConeGeometry|TorusGeometry|RingGeometry|CircleGeometry|PlaneGeometry|MeshStandardMaterial|MeshBasicMaterial|MeshPhysicalMaterial|Points|PointsMaterial)\b/);
  assert.doesNotMatch(artifact.sceneSource, /effectOrigin, \[0\.18, 0\.18, 0\.04\]/);
  assert.doesNotMatch(artifact.sceneSource, /createManipulationController/);
  assert.doesNotMatch(artifact.sceneSource, /modelsOverlapOrNear/);
});

test('compileSemanticDraft uses recipe scene builder for iron CuSO4 recipe drafts', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-recipe-builder-'));
  const output = await compileSemanticDraft({
    slug: 'iron-cuso4-recipe-builder',
    draftsDir: tempDir,
    draft: ironDraft,
  });

  const scene = await fs.readFile(path.join(output.draftsDir, 'iron-cuso4-recipe-builder.scene.js'), 'utf8');
  const meta = JSON.parse(
    await fs.readFile(path.join(output.draftsDir, 'iron-cuso4-recipe-builder.meta.json'), 'utf8'),
  );
  const audit = await auditRecipeSceneContract({ draft: ironDraft, sceneSource: scene, recipe: ironRecipe });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(meta.recipe, 'iron-cuso4-displacement');
  assert.equal(meta.generatedBy, 'recipe-scene-builder');
  assert.match(scene, /source: 'recipe-scene-builder'/);
  assert.match(scene, /getGoldenPath\(\)/);
  assert.match(scene, /getCapabilities\(\)/);
  assert.match(scene, /getStepContract\(\)/);
  assert.match(scene, /dragFromPageApi\(\)/);
  assert.match(scene, /successPhase: "result"/);
});

test('recipe scene builder supports CH4 combustion without scene-local effects', async () => {
  assert.equal(supportsRecipeSceneBuilder('ch4-combustion-flame-test'), true);

  const artifact = buildRecipeSceneArtifact({ draft: ch4Draft, recipe: ch4Recipe });
  const audit = await auditRecipeSceneContract({ draft: ch4Draft, sceneSource: artifact.sceneSource, recipe: ch4Recipe });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.hudSource, /Recipe: ch4-combustion-flame-test/);
  assert.match(artifact.sceneSource, /createGasGeneratorApparatus/);
  assert.match(artifact.sceneSource, /createGasDeliveryTubeApparatus/);
  assert.match(artifact.sceneSource, /createTestTubeApparatus/);
  assert.match(artifact.sceneSource, /createAlcoholBurnerApparatus/);
  assert.match(artifact.sceneSource, /createFlamePlume/);
  assert.match(artifact.sceneSource, /createMethaneCombustionReaction/);
  assert.match(artifact.sceneSource, /"type": "drag-pour-anchor"/);
  assert.match(artifact.sceneSource, /"type": "drag-heat-anchor"/);
  assert.match(artifact.sceneSource, /"type": "reaction-progress"/);
  assert.match(artifact.sceneSource, /"resultSustainEffects": \[/);
  assert.match(artifact.sceneSource, /"flame-plume"/);
  assert.match(artifact.sceneSource, /"methane_delivery_tube"/);
  assert.match(artifact.sceneSource, /"alcohol_burner"/);
  assert.match(artifact.sceneSource, /overlapObject: testTube\.group/);
  assert.match(artifact.sceneSource, /overlapPadding: 0\.38/);
  assert.doesNotMatch(artifact.sceneSource, /\bnew\s+THREE\.(Mesh|BoxGeometry|CylinderGeometry|SphereGeometry|ConeGeometry|TorusGeometry|RingGeometry|CircleGeometry|PlaneGeometry|MeshStandardMaterial|MeshBasicMaterial|MeshPhysicalMaterial|Points|PointsMaterial)\b/);
});

test('recipe scene builder supports moist chlorine bleaching with erlenmeyer flask and probe assembly', async () => {
  assert.equal(supportsRecipeSceneBuilder('moist-chlorine-bleaches-colored-paper'), true);

  const artifact = buildRecipeSceneArtifact({ draft: moistChlorineDraft, recipe: moistChlorineRecipe });
  const audit = await auditRecipeSceneContract({
    draft: moistChlorineDraft,
    sceneSource: artifact.sceneSource,
    recipe: moistChlorineRecipe,
  });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.hudSource, /Tìm hiểu tính tẩy màu của khí chlorine ẩm/);
  assert.match(artifact.hudSource, /data-learner-widget="moist-chlorine-compare"/);
  assert.match(artifact.hudSource, /id="chlorinePaperState"/);
  assert.match(artifact.hudSource, /id="chlorineCondition"/);
  assert.match(artifact.sceneSource, /from '\.\.\/\.\.\/lib\/classic-kit\/apparatus\.js';/);
  assert.match(artifact.sceneSource, /createClassicErlenmeyerApparatus/);
  assert.match(artifact.sceneSource, /createClassicMoistPaperApparatus/);
  assert.match(artifact.sceneSource, /theme: "showcase-bench"/);
  assert.match(artifact.sceneSource, /cameraPreset: "flask-showcase-close"/);
  assert.match(artifact.sceneSource, /theme: activeTheme/);
  assert.match(artifact.sceneSource, /flaskShowcaseMaterials/);
  assert.match(artifact.sceneSource, /paperShowcaseMaterials/);
  assert.match(artifact.sceneSource, /gasColor: "#d6e86a"/);
  assert.match(artifact.sceneSource, /wireLength: 0\.9/);
  assert.match(artifact.sceneSource, /stopperRadius: 0\.19/);
  assert.match(artifact.sceneSource, /createGuidedAnchorMotion/);
  assert.match(artifact.sceneSource, /createSmokeField/);
  assert.match(artifact.sceneSource, /renderObservationWidget\(/);
  assert.match(artifact.sceneSource, /sourceAnchor: "stopperSeat"/);
  assert.match(artifact.sceneSource, /targetAnchor: "mouth"/);
  assert.match(artifact.sceneSource, /"draggables": \[\s*"moist_colored_paper"/);
  assert.match(artifact.sceneSource, /chlorine_gas_haze|chlorine-gas-haze/);
  assert.match(artifact.sceneSource, /"classic-moist-paper\.probeGrip"/);
  assert.match(artifact.sceneSource, /"classic-erlenmeyer\.mouth"/);
  assert.doesNotMatch(artifact.sceneSource, /createGasJarApparatus/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateLitmusPaperApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /createContextualLabelPolicy\(\{/);
  assert.doesNotMatch(artifact.sceneSource, /\bnew\s+THREE\.(Mesh|BoxGeometry|CylinderGeometry|SphereGeometry|ConeGeometry|TorusGeometry|RingGeometry|CircleGeometry|PlaneGeometry|MeshStandardMaterial|MeshBasicMaterial|MeshPhysicalMaterial|Points|PointsMaterial)\b/);
});

test('recipe scene builder supports the classic zinc/copper comparison slice', async () => {
  assert.equal(supportsRecipeSceneBuilder('zinc-copper-hcl-compare'), true);

  const artifact = buildRecipeSceneArtifact({ draft: zincDraft, recipe: zincRecipe });
  const audit = await auditRecipeSceneContract({ draft: zincDraft, sceneSource: artifact.sceneSource, recipe: zincRecipe });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.hudSource, /data-courseware-ui="learner-lab"/);
  assert.match(artifact.hudSource, /data-learner-widget="metal-comparison"/);
  assert.match(artifact.sceneSource, /from '\.\.\/\.\.\/lib\/classic-kit\/apparatus\.js';/);
  assert.match(artifact.sceneSource, /createClassicTestTubeApparatus/);
  assert.match(artifact.sceneSource, /createClassicSolidReagentJarApparatus/);
  assert.match(artifact.sceneSource, /createClassicCopperPieceApparatus/);
  assert.match(artifact.sceneSource, /createZincGranulesApparatus/);
  assert.doesNotMatch(artifact.sceneSource, /createClassicTestTubeRackApparatus/);
  assert.match(artifact.sceneSource, /cameraPreset: "rack-2tube-front"/);
  assert.match(artifact.sceneSource, /createVesselReactionZone/);
  assert.match(artifact.sceneSource, /particlePoolContainedInReactionZone/);
  assert.match(artifact.sceneSource, /objectContainedInReactionZone/);
  assert.match(artifact.sceneSource, /comparisonState: getComparisonState\(\)/);
  assert.match(artifact.sceneSource, /zincSampleContainedInTube/);
  assert.match(artifact.sceneSource, /copperContainedInTube/);
  assert.match(artifact.sceneSource, /zincJarReturnedHome/);
  assert.match(artifact.sceneSource, /successBehavior: 'return-home'/);
  assert.match(artifact.sceneSource, /successReturnDelayMs: 520/);
  assert.match(artifact.sceneSource, /successBehavior: 'stay-at-target'/);
  assert.match(artifact.sceneSource, /dragController\.commitSuccess\('zinc_jar'\)/);
  assert.match(artifact.sceneSource, /dragController\.commitSuccess\('copper_leaf'\)/);
  assert.match(artifact.sceneSource, /dragController\.isAtHome\('zinc_jar'\)/);
  assert.doesNotMatch(artifact.sceneSource, /zincJarHomePose/);
  assert.doesNotMatch(artifact.sceneSource, /jarIsHome\(/);
  assert.doesNotMatch(artifact.sceneSource, /controllers\.setLabel\(\{/);
  assert.doesNotMatch(artifact.sceneSource, /createContextualLabelPolicy\(\{/);
  assert.doesNotMatch(artifact.sceneSource, /\bnew\s+THREE\.(Mesh|BoxGeometry|CylinderGeometry|SphereGeometry|ConeGeometry|TorusGeometry|RingGeometry|CircleGeometry|PlaneGeometry|MeshStandardMaterial|MeshBasicMaterial|MeshPhysicalMaterial|Points|PointsMaterial)\b/);
});

test('recipe scene builder migrates hcl-nahco3 gas release to classic-kit', async () => {
  assert.equal(supportsRecipeSceneBuilder('hcl-nahco3-gas-release'), true);

  const artifact = buildRecipeSceneArtifact({ draft: hclNahco3Draft, recipe: hclNahco3Recipe });
  const audit = await auditRecipeSceneContract({ draft: hclNahco3Draft, sceneSource: artifact.sceneSource, recipe: hclNahco3Recipe });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.sceneSource, /from '\.\.\/\.\.\/lib\/classic-kit\/apparatus\.js';/);
  assert.match(artifact.sceneSource, /cameraPreset: "showcase-close"/);
  assert.match(artifact.sceneSource, /createClassicTestTubeApparatus/);
  assert.match(artifact.sceneSource, /createClassicSolidReagentJarApparatus/);
  assert.match(artifact.sceneSource, /createClassicReagentBottleApparatus/);
  assert.match(artifact.sceneSource, /createVesselReactionZone/);
  assert.match(artifact.sceneSource, /bubbleFieldContainedInTube/);
  assert.match(artifact.sceneSource, /solidJarReturnedHome/);
  assert.match(artifact.sceneSource, /acidBottleReturnedHome/);
  assert.match(artifact.sceneSource, /successBehavior: 'return-home'/);
  assert.match(artifact.sceneSource, /createGuidedPourMotion/);
  assert.match(artifact.sceneSource, /createSequencedPourController/);
  assert.match(artifact.sceneSource, /dragController\.commitSuccess\('solid_reagent_jar'/);
  assert.match(artifact.sceneSource, /acidPourSequence\.beginStep/);
  assert.doesNotMatch(artifact.sceneSource, /pourStream\.setEndpoints\(/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateSolidReagentJarApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateReagentBottleApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /controllers\.setLabel\(\{/);
  assert.doesNotMatch(artifact.sceneSource, /createContextualLabelPolicy\(\{/);
});

test('recipe scene builder migrates halogen-halide comparison to classic-kit', async () => {
  assert.equal(supportsRecipeSceneBuilder('halogen-halide-displacement-compare'), true);

  const artifact = buildRecipeSceneArtifact({ draft: halogenDraft, recipe: halogenRecipe });
  const audit = await auditRecipeSceneContract({ draft: halogenDraft, sceneSource: artifact.sceneSource, recipe: halogenRecipe });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(artifact.generatedBy, 'recipe-scene-builder');
  assert.match(artifact.hudSource, /data-learner-widget="halogen-comparison"/);
  assert.match(artifact.sceneSource, /from '\.\.\/\.\.\/lib\/classic-kit\/apparatus\.js';/);
  assert.match(artifact.sceneSource, /cameraPreset: "rack-3tube-front"/);
  assert.match(artifact.sceneSource, /createClassicTestTubeApparatus/);
  assert.match(artifact.sceneSource, /createClassicReagentBottleApparatus/);
  assert.match(artifact.sceneSource, /createColorTransition/);
  assert.match(artifact.hudSource, /data-step="tube1"/);
  assert.match(artifact.sceneSource, /"add-cl2-to-nabr": false/);
  assert.match(artifact.sceneSource, /"add-cl2-to-nai": false/);
  assert.match(artifact.sceneSource, /"add-br2-to-nai": false/);
  assert.match(artifact.sceneSource, /successBehavior: 'stay-at-target'/);
  assert.match(artifact.sceneSource, /createGuidedPourMotion/);
  assert.match(artifact.sceneSource, /createSequencedPourController/);
  assert.match(artifact.sceneSource, /returnDelayMs: 220/);
  assert.match(artifact.sceneSource, /pourSequence\.queueAutoplay/);
  assert.match(artifact.sceneSource, /pourSequence\.canStartStep\(nextStep\)/);
  assert.match(artifact.sceneSource, /pourSequence\.updateAutoplay/);
  assert.doesNotMatch(artifact.sceneSource, /pourStream\.setEndpoints\(/);
  assert.doesNotMatch(artifact.sceneSource, /nextQueuedStepUsesBottle/);
  assert.match(artifact.sceneSource, /chlorineBottleReturnedHome/);
  assert.match(artifact.sceneSource, /bromineBottleReturnedHome/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateTestTubeApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /\bcreateReagentBottleApparatus\b/);
  assert.doesNotMatch(artifact.sceneSource, /controllers\.setLabel\(\{/);
  assert.doesNotMatch(artifact.sceneSource, /createContextualLabelPolicy\(\{/);
});

test('compileSemanticDraft uses recipe scene builder for moist chlorine bleaching drafts', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-moist-chlorine-'));
  const output = await compileSemanticDraft({
    slug: 'moist-chlorine-bleaches-colored-paper',
    draftsDir: tempDir,
    draft: moistChlorineDraft,
  });

  const scene = await fs.readFile(path.join(output.draftsDir, 'moist-chlorine-bleaches-colored-paper.scene.js'), 'utf8');
  const meta = JSON.parse(
    await fs.readFile(path.join(output.draftsDir, 'moist-chlorine-bleaches-colored-paper.meta.json'), 'utf8'),
  );
  const audit = await auditRecipeSceneContract({
    draft: moistChlorineDraft,
    sceneSource: scene,
    recipe: moistChlorineRecipe,
  });

  assert.equal(audit.ok, true, audit.errors.join(', '));
  assert.equal(meta.recipe, 'moist-chlorine-bleaches-colored-paper');
  assert.equal(meta.generatedBy, 'recipe-scene-builder');
  assert.match(scene, /createClassicErlenmeyerApparatus/);
  assert.match(scene, /createClassicMoistPaperApparatus/);
  assert.doesNotMatch(scene, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(scene, /\bcreateLitmusPaperApparatus\b/);
  assert.match(scene, /getGoldenPath\(\)/);
  assert.match(scene, /successPhase: "result"/);
});
