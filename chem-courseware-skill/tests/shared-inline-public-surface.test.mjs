import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const inlineBundlePath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const generatedExperimentDir = path.join(repoRoot, 'generated/experiment');

const sharedExports = [
  'THREE',
  'cameraPresets',
  'getCameraPreset',
  'themePresets',
  'getThemePreset',
  'updatePointerFromEvent',
  'setPointerCaptureSafe',
  'releasePointerCaptureSafe',
  'setControlsDragging',
  'createManipulationController',
  'createFreeDragController',
  'createSceneShell',
  'intersectPointerPlane',
  'getWorldBounds',
  'modelsOverlapOrNear',
  'canAttemptOrderedStep',
  'hasActiveCompletion',
  'isStepBusy',
  'lerpObjectPose',
  'beginStepCompletion',
  'clearStepCompletion',
  'runStepCompletion',
  'completeOrderedOverlapStep',
  'clamp01',
  'lerp',
  'smoothstep01',
  'segment',
  'sequenceProgress',
  'computeAnchorPlacementPose',
  'applyAnchorPlacement',
  'createGuidedAnchorMotion',
  'createContextualLabelPolicy',
  'createSpriteTexture',
  'createSoftCircleTexture',
  'createParticlePool',
  'createBubbleField',
  'createSteamField',
  'createSparkField',
  'createPourStream',
  'createGlowRing',
  'createFlamePlume',
  'createColorTransition',
  'createMaterialProgress',
  'createReactionFlow',
  'createPourIntoVesselReaction',
  'createAcidBaseIndicatorReaction',
  'createMetalDisplacementReaction',
  'createDehydrationCarbonizationReaction',
  'createAcidMetalGasReaction',
  'createMethaneCombustionReaction',
  'getCanvasBox',
  'canvasPoint',
  'projectWorldToCanvas',
  'installFlameTestHarness',
  'installCoursewareTestHarness',
];

async function listGeneratedExperimentHtmlFiles() {
  const entries = await readdir(generatedExperimentDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(generatedExperimentDir, entry.name, 'index.html'));
}

test('shared inline bundle exposes the shared public surface', async () => {
  const inlineSource = await readFile(inlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemSharedLib = \{/);
  for (const key of sharedExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected inline bundle to expose ${key}`);
  }
});

test('legacy generated experiment references still avoid repo-local helper imports', async () => {
  const localImportPattern = /\.\.\/\.\.\/\.\.\/lib\//;
  const generatedHtmlFiles = await listGeneratedExperimentHtmlFiles();

  for (const filePath of generatedHtmlFiles) {
    const source = await readFile(filePath, 'utf8');
    assert.doesNotMatch(source, localImportPattern, `Expected ${filePath} to avoid repo-local helper imports`);
    assert.match(source, /<script type="importmap">/, `Expected ${filePath} to declare an importmap`);
    assert.match(source, /__coursewareTestApi|__flameTestApi/, `Expected ${filePath} to expose a verifier API`);
  }
});
