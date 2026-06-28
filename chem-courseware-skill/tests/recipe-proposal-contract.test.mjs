import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  validatePatternCatalog,
  validateRecipeProposal,
} from '../lib/contracts/recipe-proposal.js';
import {
  buildRecipeProposal,
  loadPatternCatalog,
  writeRecipeProposal,
} from '../scripts/propose-recipe-from-pattern.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const patternCatalogPath = path.join(repoRoot, 'recipes/pattern-catalog.json');

test('pattern catalog is valid and covers common experiment interaction families', async () => {
  const catalog = JSON.parse(await fs.readFile(patternCatalogPath, 'utf8'));
  const result = validatePatternCatalog(catalog);

  assert.equal(result.ok, true, result.errors.join(', '));
  const patternIds = new Set(result.catalog.patterns.map((pattern) => pattern.id));
  for (const id of [
    'drag-drop-contact',
    'dip-indicator',
    'drag-pour-reaction',
    'dehydration-carbonization',
    'heat-sample',
    'gas-release-pop-test',
    'precipitation',
  ]) {
    assert.ok(patternIds.has(id), `missing pattern ${id}`);
  }
});

test('recipe proposal generator writes a validated blueprint without generating HTML', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'chem-recipe-proposal-'));
  const proposalPath = path.join(tempDir, 'recipe-proposal.json');
  const catalog = await loadPatternCatalog();

  const { outputPath, proposal } = await writeRecipeProposal({
    catalog,
    patternId: 'drag-pour-reaction',
    recipeId: 'vinegar-baking-soda-gas-release',
    topic: 'Giấm tác dụng với baking soda tạo khí CO2',
    level: 'THCS',
    outputPath: proposalPath,
  });

  const validation = validateRecipeProposal(proposal, { patternCatalog: catalog });
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(outputPath, proposalPath);
  assert.equal(proposal.kind, 'recipe-proposal');
  assert.equal(proposal.status, 'needs-builder');
  assert.equal(proposal.builder.supported, false);
  assert.equal(proposal.verification.mustNotGenerateHtml, true);
  assert.equal(proposal.proposedRecipe.id, 'vinegar-baking-soda-gas-release');
  assert.equal(proposal.proposedRecipe.interaction, 'free-drag-pour');
  assert.ok(proposal.proposedRecipe.steps.some((step) => step.type === 'drag-pour-anchor'));
  assert.ok(proposal.proposedRecipe.steps.some((step) => step.type === 'reaction-progress'));

  const outputEntries = await fs.readdir(tempDir);
  assert.deepEqual(outputEntries.sort(), ['recipe-proposal.json']);
});

test('recipe proposal validation rejects HTML-producing or builder-supported proposals', async () => {
  const catalog = await loadPatternCatalog();
  const proposal = buildRecipeProposal({
    catalog,
    patternId: 'dip-indicator',
    recipeId: 'custom-litmus-case',
    topic: 'Giấy quỳ tím kiểm tra dung dịch chưa xác định',
    level: 'THCS',
  });

  const invalid = {
    ...proposal,
    builder: { ...proposal.builder, supported: true },
    verification: { ...proposal.verification, mustNotGenerateHtml: false },
  };
  const result = validateRecipeProposal(invalid, { patternCatalog: catalog });

  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /builder\.supported/.test(error)));
  assert.ok(result.errors.some((error) => /mustNotGenerateHtml/.test(error)));
});
