import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateRecipeDefinition } from '../lib/contracts/recipe.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipesDir = path.join(repoRoot, 'recipes');
const presetsPath = path.join(repoRoot, 'lib/apparatus/presets.js');

async function listRecipeFiles() {
  const entries = await readdir(recipesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.recipe.json'))
    .map((entry) => path.join(recipesDir, entry.name));
}

test('recipe definitions are valid and use registered apparatus keys', async () => {
  const [recipeFiles, presetsSource] = await Promise.all([
    listRecipeFiles(),
    readFile(presetsPath, 'utf8'),
  ]);
  const presetKeys = new Set(
    Array.from(presetsSource.matchAll(/key:\s*['"]([^'"]+)['"]/g)).map((match) => match[1]),
  );

  assert.ok(recipeFiles.length >= 5, 'expected seed recipes');

  for (const filePath of recipeFiles) {
    const recipe = JSON.parse(await readFile(filePath, 'utf8'));
    const result = validateRecipeDefinition(recipe);
    assert.equal(result.ok, true, `${path.basename(filePath)}: ${result.errors.join(', ')}`);
    for (const apparatusKey of result.recipe.requiredApparatus) {
      assert.ok(presetKeys.has(apparatusKey), `${result.recipe.id} uses unregistered apparatus ${apparatusKey}`);
    }
  }
});

test('recipe contract rejects incomplete definitions', () => {
  const result = validateRecipeDefinition({ id: 'missing-fields' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /theme/.test(error)));
  assert.ok(result.errors.some((error) => /reaction/.test(error)));
  assert.ok(result.errors.some((error) => /effects/.test(error)));
  assert.ok(result.errors.some((error) => /resultSustainEffects/.test(error)));
});
