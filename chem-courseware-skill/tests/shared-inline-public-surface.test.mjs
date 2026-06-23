import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repoRoot = '/home/ding/skills_material_K12/chem-courseware-skill';
const inlineBundlePath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const generatedExperimentDir = path.join(repoRoot, 'generated/experiment');

const sharedExports = [
  'THREE',
  'updatePointerFromEvent',
  'setPointerCaptureSafe',
  'releasePointerCaptureSafe',
  'setControlsDragging',
  'intersectPointerPlane',
  'clamp01',
  'lerp',
  'smoothstep01',
  'segment',
  'sequenceProgress',
  'getCanvasBox',
  'canvasPoint',
  'projectWorldToCanvas',
  'installFlameTestHarness',
];

const generatedHtmlFiles = [
  path.join(generatedExperimentDir, 'rate-applications-3d/index.html'),
  path.join(generatedExperimentDir, 'reaction-rate-specimens/index.html'),
];

test('shared inline bundle exposes the shared public surface', async () => {
  const inlineSource = await readFile(inlineBundlePath, 'utf8');

  assert.match(inlineSource, /const ChemSharedLib = \{/);
  for (const key of sharedExports) {
    assert.match(inlineSource, new RegExp(`\\b${key}\\b`), `Expected inline bundle to expose ${key}`);
  }
});

test('affected generated experiment HTML files avoid repo-local helper imports', async () => {
  const localImportPattern = /\.\.\/\.\.\/\.\.\/lib\//;

  for (const filePath of generatedHtmlFiles) {
    const source = await readFile(filePath, 'utf8');
    assert.doesNotMatch(source, localImportPattern, `Expected ${filePath} to avoid repo-local helper imports`);
    assert.match(source, /globalThis\.ChemSharedLib/, `Expected ${filePath} to install or consume ChemSharedLib`);
  }
});
