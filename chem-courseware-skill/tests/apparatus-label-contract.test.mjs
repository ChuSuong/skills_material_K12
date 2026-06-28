import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const presetDir = path.join(repoRoot, 'lib/apparatus/presets');

async function readPreset(fileName) {
  return readFile(path.join(presetDir, fileName), 'utf8');
}

const vesselPresets = [
  'beaker.js',
  'bottle.js',
  'erlenmeyer.js',
  'test-tube.js',
  'solid-reagent-jar.js',
  'gas-generator.js',
];

const floatingBadgePresets = [
  'alcohol-burner.js',
  'dropper.js',
  'funnel.js',
  'gas-delivery-tube.js',
  'iron-nail.js',
  'litmus-paper.js',
];

test('container presets use physical body labels controlled by the apparatus library', async () => {
  for (const fileName of vesselPresets) {
    const source = await readPreset(fileName);
    assert.match(source, /attachFixedPlaneLabel/);
    assert.match(source, /attachLabelController/);
    assert.match(source, /role:\s*['"]vessel-body-label['"]/);
  }
});

test('non-container tools and specimens expose readable floating badges from their presets', async () => {
  for (const fileName of floatingBadgePresets) {
    const source = await readPreset(fileName);
    assert.match(source, /attachFixedPlaneLabel/);
    assert.match(source, /attachLabelController/);
    assert.match(source, /role:\s*['"]floating-badge['"]/);
  }
});

test('shared label helper supports body-mounted anchors instead of only vertical floating labels', async () => {
  const source = await readPreset('shared.js');
  assert.match(source, /labelPosition\s*=\s*null/);
  assert.match(source, /labelPoint\s*=\s*labelPosition/);
  assert.match(source, /userData\.labelRole\s*=\s*role/);
});
