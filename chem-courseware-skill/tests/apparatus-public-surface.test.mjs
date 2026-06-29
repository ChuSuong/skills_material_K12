import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const apparatusIndexPath = path.join(repoRoot, 'lib/apparatus/index.js');
const apparatusScaffoldPath = path.join(repoRoot, 'templates/apparatus-scaffold.js');
const inlineBundlePath = path.join(repoRoot, 'templates/apparatus-inline-snippet.js');
const sharedInlineBundlePath = path.join(repoRoot, 'templates/shared-inline-snippet.js');

const sharedExports = [
  'THREE',
  'normalizeCapabilities',
  'hasCapabilities',
  'normalizeContract',
  'makeContract',
  'defineApparatusPreset',
  'ApparatusContractRegistry',
  'defaultApparatusContractRegistry',
  'registerApparatusPreset',
  'getApparatusPreset',
  'listApparatusPresets',
  'createApparatusFromPreset',
  'composeApparatus',
  'createBeakerApparatus',
  'createBottleApparatus',
  'createReagentBottleApparatus',
  'createErlenmeyerApparatus',
  'createTestTubeApparatus',
  'createDropperApparatus',
  'createAlcoholBurnerApparatus',
  'createSolidReagentJarApparatus',
  'createLitmusPaperApparatus',
  'createFunnelApparatus',
  'createIronNailApparatus',
  'createGasGeneratorApparatus',
  'createGasDeliveryTubeApparatus',
  'APPARATUS_PRESET_DEFINITIONS',
  'listRegisteredApparatusPresets',
  'getRegisteredApparatusPresetDefinition',
  'ensureDefaultApparatusPresetsRegistered',
  'createPourInteraction',
  'createDripInteraction',
  'createHeatInteraction',
  'createOverlapCompletionInteraction',
  'createSteamInteraction',
  'runApparatusValidators',
  'createSceneValidatorGate',
];

const sharedHelperExports = [
  'THREE',
  'updatePointerFromEvent',
  'setPointerCaptureSafe',
  'releasePointerCaptureSafe',
  'setControlsDragging',
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
  'smoothstep01',
  'installCoursewareTestHarness',
  'installFlameTestHarness',
];

test('apparatus scaffold mirrors the public barrel entrypoint', async () => {
  const [indexSource, scaffoldSource] = await Promise.all([
    readFile(apparatusIndexPath, 'utf8'),
    readFile(apparatusScaffoldPath, 'utf8'),
  ]);

  assert.match(indexSource, /export \* from '\.\/core\.js';/);
  assert.match(indexSource, /export \* from '\.\/chemicals\.js';/);
  assert.match(indexSource, /export \* from '\.\/interactions\.js';/);
  assert.match(indexSource, /export \* from '\.\/presets\.js';/);
  assert.match(indexSource, /export \* from '\.\/capabilities\.js';/);
  assert.match(indexSource, /export \* from '\.\/contract\.js';/);
  assert.match(indexSource, /export \* from '\.\/registry\.js';/);
  assert.match(scaffoldSource, /export \* from '\.\.\/lib\/apparatus\/index\.js';/);
});

test('apparatus inline bundle exposes the shared public surface', async () => {
  const inlineSource = await readFile(inlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemApparatusLib = \{/);
  for (const key of sharedExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected inline bundle to expose ${key}`);
  }
});

test('shared inline bundle exposes courseware helper surface', async () => {
  const inlineSource = await readFile(sharedInlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemSharedLib = \{/);
  for (const key of sharedHelperExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected shared inline bundle to expose ${key}`);
  }
});
