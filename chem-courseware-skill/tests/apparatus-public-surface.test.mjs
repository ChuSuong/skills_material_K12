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
const classicInlineBundlePath = path.join(repoRoot, 'templates/classic-apparatus-inline-snippet.js');
const sharedInlineBundlePath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const classicKitBarrelPath = path.join(repoRoot, 'lib/classic-kit/apparatus.js');

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
  'createCopperPieceApparatus',
  'createGasGeneratorApparatus',
  'createGasDeliveryTubeApparatus',
  'createTestTubeRackApparatus',
  'createGlassStirringRodApparatus',
  'createSpatulaApparatus',
  'createTripodGauzeApparatus',
  'createEvaporatingDishApparatus',
  'createRoundBottomFlaskApparatus',
  'createWatchGlassApparatus',
  'createFilterPaperApparatus',
  'createGasJarApparatus',
  'createRetortStandClampApparatus',
  'createElectrodePairApparatus',
  'createDcPowerSupplyApparatus',
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
  'createGuidedPourMotion',
  'createSequencedPourController',
  'installCoursewareTestHarness',
  'installFlameTestHarness',
];

const activeClassicExports = [
  'THREE',
  'APPARATUS_THREE_CDN',
  'clamp',
  'makeAnchor',
  'getAnchorWorld',
  'getApparatusId',
  'composeApparatus',
  'computeCylinderLiquidMetrics',
  'setCylinderLiquidLevel',
  'createCylinderLiquidController',
  'clearWater',
  'diluteAcid',
  'createClassicTestTubeApparatus',
  'createClassicSolidReagentJarApparatus',
  'createClassicCopperPieceApparatus',
  'createClassicReagentBottleApparatus',
  'createZincGranulesApparatus',
  'createClassicErlenmeyerApparatus',
  'createClassicMoistPaperApparatus',
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

test('classic apparatus inline bundle exposes only the active classic surface', async () => {
  const inlineSource = await readFile(classicInlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemApparatusLib = \{/);
  for (const key of activeClassicExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected classic inline bundle to expose ${key}`);
  }

  assert.doesNotMatch(inlineSource, /\bcreateBeakerApparatus\b/);
  assert.doesNotMatch(inlineSource, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(inlineSource, /\bcreateDropperApparatus\b/);
  assert.doesNotMatch(inlineSource, /\bcreateGasJarApparatus\b/);
  assert.doesNotMatch(inlineSource, /\bcreateClassicTestTubeRackApparatus\b/);
  assert.doesNotMatch(inlineSource, /\blistRegisteredApparatusPresets\b/);
});

test('shared inline bundle exposes courseware helper surface', async () => {
  const inlineSource = await readFile(sharedInlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemSharedLib = \{/);
  for (const key of sharedHelperExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected shared inline bundle to expose ${key}`);
  }
});

test('classic-kit apparatus barrel exposes the active showcase apparatus surface', async () => {
  const source = await readFile(classicKitBarrelPath, 'utf8');

  assert.match(source, /createClassicTestTubeApparatus/);
  assert.match(source, /createClassicSolidReagentJarApparatus/);
  assert.match(source, /createClassicReagentBottleApparatus/);
  assert.match(source, /createClassicCopperPieceApparatus/);
  assert.match(source, /createZincGranulesApparatus/);
  assert.match(source, /createClassicErlenmeyerApparatus/);
  assert.match(source, /createClassicMoistPaperApparatus/);
  assert.match(source, /clearWater/);
  assert.match(source, /diluteAcid/);
  assert.doesNotMatch(source, /createClassicTestTubeRackApparatus/);
});
