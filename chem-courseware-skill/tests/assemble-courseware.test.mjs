import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { assembleCourseware } from '../skills/chem-courseware-base/scripts/assemble-courseware.mjs';

function writeDraft(draftsDir, slug, { hud, scene, meta }) {
  fs.mkdirSync(draftsDir, { recursive: true });
  fs.writeFileSync(path.join(draftsDir, `${slug}.hud.html`), hud);
  fs.writeFileSync(path.join(draftsDir, `${slug}.scene.js`), scene);
  fs.writeFileSync(path.join(draftsDir, `${slug}.meta.json`), JSON.stringify(meta));
}

function makeTempDirs() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'assemble-courseware-test-'));
  return {
    draftsDir: path.join(root, 'drafts'),
    generatedDir: path.join(root, 'generated'),
  };
}

test('assembleCourseware writes index.html, scene.js, and metadata.json for renderMode "threejs"', async () => {
  const { draftsDir, generatedDir } = makeTempDirs();
  const slugDraftsDir = path.join(draftsDir, '3d-experiment', 'demo-lesson');
  writeDraft(slugDraftsDir, 'demo-lesson', {
    hud: '<div class="panel"><h1>Demo</h1></div>',
    scene: "import * as THREE from 'three';\nexport function init() {}\n",
    meta: { topic: 'Demo lesson', level: 'lop9', skill: 'chem-3d-experiment', renderMode: 'threejs', themeVersion: '1.0.0' },
  });

  const result = await assembleCourseware({
    kind: '3d-experiment',
    slug: 'demo-lesson',
    draftsDir: slugDraftsDir,
    generatedDir,
  });

  const outDir = path.join(generatedDir, '3d-experiment', 'demo-lesson');
  assert.equal(result.outputDir, outDir);

  const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, /<title>Demo lesson<\/title>/);
  assert.match(html, /<h1>Demo<\/h1>/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /three\.module\.js/);
  assert.match(html, /<script type="module" src="\.\/scene\.js">/);

  const scene = fs.readFileSync(path.join(outDir, 'scene.js'), 'utf8');
  assert.equal(scene, "import * as THREE from 'three';\nexport function init() {}\n");

  const metadata = JSON.parse(fs.readFileSync(path.join(outDir, 'metadata.json'), 'utf8'));
  assert.equal(metadata.topic, 'Demo lesson');
  assert.equal(metadata.level, 'lop9');
  assert.equal(metadata.skill, 'chem-3d-experiment');
  assert.equal(metadata.renderMode, 'threejs');
  assert.equal(metadata.themeVersion, '1.0.0');
  assert.equal(metadata.verify_status, 'pending');
  assert.ok(!Number.isNaN(Date.parse(metadata.created_at)), 'created_at should be a valid ISO timestamp');
});

test('assembleCourseware omits the importmap entirely for renderMode "dom"', async () => {
  const { draftsDir, generatedDir } = makeTempDirs();
  const slugDraftsDir = path.join(draftsDir, 'process-storyboard', 'demo-dom');
  writeDraft(slugDraftsDir, 'demo-dom', {
    hud: '<div class="panel"><h1>Demo DOM</h1></div>',
    scene: 'export function init() {}\n',
    meta: { topic: 'Demo DOM lesson', level: 'lop8', skill: 'chem-process-storyboard', renderMode: 'dom', themeVersion: '1.0.0' },
  });

  await assembleCourseware({
    kind: 'process-storyboard',
    slug: 'demo-dom',
    draftsDir: slugDraftsDir,
    generatedDir,
  });

  const html = fs.readFileSync(path.join(generatedDir, 'process-storyboard', 'demo-dom', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /type="importmap"/);
  assert.doesNotMatch(html, /three\.module\.js/);
});

test('assembleCourseware rejects a meta.json missing a required field', async () => {
  const { draftsDir, generatedDir } = makeTempDirs();
  const slugDraftsDir = path.join(draftsDir, '3d-experiment', 'bad-meta');
  writeDraft(slugDraftsDir, 'bad-meta', {
    hud: '<div class="panel"></div>',
    scene: 'export function init() {}\n',
    meta: { topic: 'Missing fields', level: 'lop9', renderMode: 'threejs', themeVersion: '1.0.0' },
  });

  await assert.rejects(
    () => assembleCourseware({ kind: '3d-experiment', slug: 'bad-meta', draftsDir: slugDraftsDir, generatedDir }),
    /skill/
  );
});

test('assembleCourseware rejects an invalid renderMode', async () => {
  const { draftsDir, generatedDir } = makeTempDirs();
  const slugDraftsDir = path.join(draftsDir, '3d-experiment', 'bad-mode');
  writeDraft(slugDraftsDir, 'bad-mode', {
    hud: '<div class="panel"></div>',
    scene: 'export function init() {}\n',
    meta: { topic: 'Bad mode', level: 'lop9', skill: 'chem-3d-experiment', renderMode: 'svg', themeVersion: '1.0.0' },
  });

  await assert.rejects(
    () => assembleCourseware({ kind: '3d-experiment', slug: 'bad-mode', draftsDir: slugDraftsDir, generatedDir }),
    /renderMode/
  );
});
