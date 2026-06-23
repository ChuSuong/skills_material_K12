import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = '/home/ding/chem-courseware-skill-base';
const apparatusIndexPath = path.join(repoRoot, 'lib/apparatus/index.js');
const apparatusScaffoldPath = path.join(repoRoot, 'templates/apparatus-scaffold.js');
const inlineBundlePath = path.join(repoRoot, 'templates/apparatus-inline-snippet.js');

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
  'APPARATUS_PRESET_DEFINITIONS',
  'listRegisteredApparatusPresets',
  'getRegisteredApparatusPresetDefinition',
  'ensureDefaultApparatusPresetsRegistered',
  'createPourInteraction',
  'createDripInteraction',
  'createHeatInteraction',
  'createSteamInteraction',
  'runApparatusValidators',
  'createSceneValidatorGate',
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

