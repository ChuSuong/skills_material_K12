import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { compileSemanticDraft } from '../scripts/compile-semantic-draft.mjs';
import { assembleCourseware } from '../scripts/assemble-courseware.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const exampleDraftPath = path.join(
  repoRoot,
  'examples/drafts/experiment/iron-cuso4-recipe-builder/semantic-draft.json'
);

test('assembleCourseware writes metadata.json with pending verify status', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-assemble-'));
  const draftsDir = path.join(tempDir, 'drafts');
  const generatedDir = path.join(tempDir, 'generated');

  await compileSemanticDraft({
    slug: 'iron-cuso4-recipe-builder',
    draftsDir,
    draft: JSON.parse(await fs.readFile(exampleDraftPath, 'utf8')),
  });

  await assembleCourseware({
    kind: 'experiment',
    slug: 'iron-cuso4-recipe-builder',
    draftsDir,
    generatedDir,
  });

  const outputDir = path.join(generatedDir, 'experiment', 'iron-cuso4-recipe-builder');
  const metadata = JSON.parse(
    await fs.readFile(path.join(outputDir, 'metadata.json'), 'utf8')
  );
  const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');
  const hud = await fs.readFile(path.join(outputDir, 'hud.html'), 'utf8');

  assert.equal(metadata.verify_status, 'pending');
  assert.equal(metadata.skill, 'chem-3d-experiment');
  assert.equal(metadata.renderMode, 'threejs');
  assert.equal(metadata.recipe, 'iron-cuso4-displacement');
  assert.equal(metadata.reaction, 'metal-displacement');
  assert.equal(metadata.generatedBy, 'recipe-scene-builder');
  assert.match(metadata.created_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(html, /<div id="hud-root">/);
  assert.match(html, /Đinh sắt thả vào dung dịch CuSO4/);
  assert.match(html, /recipeStepContract/);
  assert.match(html, /recipeCapabilities/);
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /"three": "https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.165\.0\/build\/three\.module\.js"/);
  assert.match(html, /globalThis\.ChemSharedLib/);
  assert.match(html, /globalThis\.ChemApparatusLib/);
  assert.match(html, /createIronNailApparatus/);
  assert.match(html, /createBeakerApparatus/);
  assert.match(html, /id="statusText"/);
  assert.match(html, /data-action="autoplay"/);
  assert.match(html, /data-action="reset"/);
  assert.doesNotMatch(html, /fetch\('\.\/hud\.html'\)/);
  assert.match(hud, /id="statusText"/);

  const scene = await fs.readFile(path.join(outputDir, 'scene.js'), 'utf8');
  assert.doesNotMatch(scene, /lib\/runtime\/scene-shell\.js/);
  assert.doesNotMatch(scene, /lib\/testing\/harness\.js/);
  assert.doesNotMatch(scene, /\.\.\/\.\.\/lib\//);
  assert.match(scene, /const \{ installCoursewareTestHarness \} = globalThis\.ChemSharedLib;/);
  if (/createSceneShell/.test(scene)) {
    assert.match(scene, /const \{ createSceneShell \} = globalThis\.ChemSharedLib;/);
  }
});
