import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readRepoFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('free drag controller wraps shared manipulation instead of scene-local pointer loops', async () => {
  const source = await readRepoFile('lib/interaction/free-drag-controller.js');
  assert.match(source, /createManipulationController/);
  assert.match(source, /registerDraggable/);
  assert.match(source, /validTargets/);
  assert.match(source, /overlapObject/);
  assert.match(source, /modelsOverlapOrNear/);
  assert.match(source, /homePose/);
  assert.match(source, /autoTiltTarget/);
  assert.doesNotMatch(source, /addEventListener\s*\(\s*['"]pointer/);
});

test('effect modules expose reusable effect factories', async () => {
  const files = [
    'lib/effects/particle-pool.js',
    'lib/effects/bubble-field.js',
    'lib/effects/steam-field.js',
    'lib/effects/spark-field.js',
    'lib/effects/pour-stream.js',
    'lib/effects/glow-ring.js',
    'lib/effects/flame-plume.js',
    'lib/effects/color-transition.js',
    'lib/effects/material-progress.js',
    'lib/effects/smoke-field.js',
    'lib/effects/precipitate-cloud.js',
    'lib/effects/gas-collection-bubbles.js',
    'lib/effects/heat-shimmer.js',
  ];

  for (const filePath of files) {
    const source = await readRepoFile(filePath);
    assert.match(source, /export function create/, `${filePath} should export a factory`);
    assert.match(source, /reset\s*\(|\.\.\.pool/, `${filePath} should expose reset behavior`);
  }
});

test('reaction modules expose flow-based factories with verifier hooks', async () => {
  const flowSource = await readRepoFile('lib/reactions/reaction-flow.js');
  assert.match(flowSource, /getVerifierMeta/);
  assert.match(flowSource, /getGoldenPath/);
  assert.match(flowSource, /runVerifierStep/);
  assert.match(flowSource, /onAfterFinishUpdate/);

  const reactionFiles = [
    'lib/reactions/pour-into-vessel.js',
    'lib/reactions/acid-base-indicator.js',
    'lib/reactions/metal-displacement.js',
    'lib/reactions/dehydration-carbonization.js',
    'lib/reactions/acid-metal-gas.js',
    'lib/reactions/methane-combustion.js',
  ];
  for (const filePath of reactionFiles) {
    const source = await readRepoFile(filePath);
    assert.match(source, /createReactionFlow/);
    assert.match(source, /export function create/);
  }

  const methaneSource = await readRepoFile('lib/reactions/methane-combustion.js');
  assert.match(methaneSource, /onAfterFinishUpdate/);
  assert.match(methaneSource, /sustained: true/);
});

test('anchor motion runtime exposes reusable placement, autoplay, and label policies', async () => {
  const source = await readRepoFile('lib/runtime/anchor-motion.js');
  assert.match(source, /export function computeAnchorPlacementPose/);
  assert.match(source, /export function applyAnchorPlacement/);
  assert.match(source, /export function createGuidedAnchorMotion/);
  assert.match(source, /export function createContextualLabelPolicy/);
  assert.match(source, /sourceAnchor/);
  assert.match(source, /targetAnchor/);
  assert.match(source, /smoothstep/);
  assert.doesNotMatch(source, /addEventListener\s*\(\s*['"]pointer/);
});
