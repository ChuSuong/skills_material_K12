import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readRepoFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('classic showcase cameras keep close framing families for chemistry scenes', async () => {
  const source = await readRepoFile('lib/runtime/camera-presets.js');

  assert.match(source, /'showcase-close': \{[\s\S]*position: \[0, 3\.6, 7\.6\][\s\S]*target: \[0, 1\.7, 0\][\s\S]*fov: 42/m);
  assert.match(source, /'rack-2tube-front': \{[\s\S]*position: \[0, 4\.55, 9\.8\][\s\S]*target: \[0, 2\.35, 0\][\s\S]*fov: 36/m);
  assert.match(source, /'classic-lab-wide': \{[\s\S]*position: \[0, 4\.55, 9\.8\][\s\S]*target: \[0, 2\.35, 0\][\s\S]*fov: 36/m);
});

test('showcase-bench theme owns the close lab stage and visual policy', async () => {
  const source = await readRepoFile('lib/runtime/theme-presets.js');
  const showcaseBench = /'showcase-bench': \{[\s\S]*?^\s{2}\},/m.exec(source)?.[0] || '';

  assert.match(showcaseBench, /stagePad:\s*\{[\s\S]*visible: true/);
  assert.match(showcaseBench, /benchTopSize:\s*\[11\.5, 0\.4, 5\]/);
  assert.match(showcaseBench, /floorRadius:\s*18/);
  assert.match(showcaseBench, /tube:\s*\{[\s\S]*showcase:\s*\{[\s\S]*liquid:\s*\{[\s\S]*materialType: 'standard'[\s\S]*opacity: 0\.48/);
  assert.match(showcaseBench, /bottle:\s*\{[\s\S]*showcase:\s*\{[\s\S]*liquid:\s*\{[\s\S]*opacity: 0\.78[\s\S]*transmission: 0\.28/);
  assert.match(showcaseBench, /flask:\s*\{[\s\S]*showcase:\s*\{[\s\S]*materials:\s*\{/);
  assert.match(showcaseBench, /tool:\s*\{[\s\S]*showcase:\s*\{[\s\S]*materials:\s*\{/);
});

test('classic showcase tube uses rounded liquid volume with rim geometry and no fake stripe mesh', async () => {
  const [tubeSource, inlineSource] = await Promise.all([
    readRepoFile('lib/apparatus/presets/classic-test-tube.js'),
    readRepoFile('templates/classic-apparatus-inline-snippet.js'),
  ]);

  for (const source of [tubeSource, inlineSource]) {
    assert.match(source, /createRoundedTubeGeometry/);
    assert.match(source, /mouthRim/);
    assert.doesNotMatch(source, /frontHighlight/);
    assert.match(source, /radialSegments: 48/);
    assert.match(source, /curveSegments: 14/);
    assert.match(source, /liquid\.castShadow = true/);
    assert.match(source, /liquid\.receiveShadow = true/);
    assert.match(source, /baseY: 0\.025/);
  }
});

test('classic showcase glass assets share glass and rim grammar without fake highlight overlays', async () => {
  const sources = await Promise.all([
    readRepoFile('lib/apparatus/presets/classic-test-tube.js'),
    readRepoFile('lib/apparatus/presets/classic-widemouth-jar.js'),
    readRepoFile('lib/apparatus/presets/classic-reagent-bottle.js'),
  ]);

  for (const source of sources) {
    assert.match(source, /createClassicGlassMaterial/);
    assert.match(source, /createClassicGlassRimMaterial/);
    assert.doesNotMatch(source, /createClassicGlassHighlightMaterial/);
    assert.doesNotMatch(source, /new THREE\.PlaneGeometry\(radius \* 0\.[0-9]+, height \* 0\.[0-9]+\)/);
    assert.match(source, /visualFamily: 'classic-showcase'/);
  }
});
