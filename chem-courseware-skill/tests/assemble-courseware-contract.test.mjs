import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { assembleCourseware } from '../scripts/assemble-courseware.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const examplesDir = path.join(__dirname, 'fixtures');

async function copyDraftArtifacts(slug, draftsDir) {
  await fs.mkdir(draftsDir, { recursive: true });
  const srcDir = path.join(examplesDir, slug);
  await Promise.all([
    fs.copyFile(path.join(srcDir, `${slug}.hud.html`), path.join(draftsDir, `${slug}.hud.html`)),
    fs.copyFile(path.join(srcDir, `${slug}.scene.js`), path.join(draftsDir, `${slug}.scene.js`)),
    fs.copyFile(path.join(srcDir, `${slug}.meta.json`), path.join(draftsDir, `${slug}.meta.json`)),
  ]);
}

test('assembleCourseware writes metadata.json with pending verify status', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-assemble-'));
  const draftsDir = path.join(tempDir, 'drafts');
  const generatedDir = path.join(tempDir, 'generated');

  await copyDraftArtifacts('zinc-copper-hcl-compare', draftsDir);

  await assembleCourseware({
    kind: 'experiment',
    slug: 'zinc-copper-hcl-compare',
    draftsDir,
    generatedDir,
  });

  const outputDir = path.join(generatedDir, 'experiment', 'zinc-copper-hcl-compare');
  const metadata = JSON.parse(
    await fs.readFile(path.join(outputDir, 'metadata.json'), 'utf8')
  );
  const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');
  const hud = await fs.readFile(path.join(outputDir, 'hud.html'), 'utf8');

  assert.equal(metadata.verify_status, 'pending');
  assert.equal(metadata.skill, 'chem-3d-experiment');
  assert.equal(metadata.renderMode, 'threejs');
  assert.equal(metadata.recipe, 'zinc-copper-hcl-compare');
  assert.equal(metadata.reaction, 'acid-metal-gas');
  assert.match(metadata.created_at, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(html, /<div id="hud-root">/);
  assert.match(html, /Dung dịch HCl tác dụng với kim loại/);
  assert.match(html, /recipeStepContract/);
  assert.match(html, /recipeCapabilities/);
  assert.match(html, /<script type="importmap">/);
  assert.match(html, /"three": "https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.165\.0\/build\/three\.module\.js"/);
  assert.match(html, /globalThis\.ChemSharedLib/);
  assert.match(html, /globalThis\.ChemApparatusLib/);
  assert.match(html, /createClassicTestTubeApparatus/);
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

test('assembleCourseware uses the classic-only apparatus bundle for active classic recipes', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-assemble-active-'));
  const draftsDir = path.join(tempDir, 'drafts');
  const generatedDir = path.join(tempDir, 'generated');

  await copyDraftArtifacts('zinc-copper-hcl-compare', draftsDir);

  await assembleCourseware({
    kind: 'experiment',
    slug: 'zinc-copper-hcl-compare',
    draftsDir,
    generatedDir,
  });

  const outputDir = path.join(generatedDir, 'experiment', 'zinc-copper-hcl-compare');
  const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

  assert.match(html, /createClassicTestTubeApparatus/);
  assert.match(html, /createClassicSolidReagentJarApparatus/);
  assert.match(html, /createClassicCopperPieceApparatus/);
  assert.match(html, /createZincGranulesApparatus/);
  assert.doesNotMatch(html, /\bcreateBeakerApparatus\b/);
  assert.doesNotMatch(html, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(html, /\bcreateDropperApparatus\b/);
  assert.doesNotMatch(html, /\bcreateGasJarApparatus\b/);
  assert.doesNotMatch(html, /\bcreateClassicTestTubeRackApparatus\b/);
});

test('assembleCourseware uses the classic-only bundle for moist chlorine bleaching', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-assemble-moist-classic-'));
  const draftsDir = path.join(tempDir, 'drafts');
  const generatedDir = path.join(tempDir, 'generated');

  await copyDraftArtifacts('moist-chlorine-bleaches-colored-paper', draftsDir);

  await assembleCourseware({
    kind: 'experiment',
    slug: 'moist-chlorine-bleaches-colored-paper',
    draftsDir,
    generatedDir,
  });

  const outputDir = path.join(generatedDir, 'experiment', 'moist-chlorine-bleaches-colored-paper');
  const html = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

  assert.match(html, /createClassicErlenmeyerApparatus/);
  assert.match(html, /createClassicMoistPaperApparatus/);
  assert.doesNotMatch(html, /\bcreateErlenmeyerApparatus\b/);
  assert.doesNotMatch(html, /\bcreateLitmusPaperApparatus\b/);
  assert.doesNotMatch(html, /\bcreateBeakerApparatus\b/);
  assert.doesNotMatch(html, /\bcreateDropperApparatus\b/);
  assert.doesNotMatch(html, /\bcreateGasJarApparatus\b/);
});
