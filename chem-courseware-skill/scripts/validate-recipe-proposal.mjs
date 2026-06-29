import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validatePatternCatalog,
  validateRecipeProposal,
} from '../lib/contracts/recipe-proposal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const patternCatalogPath = path.join(repoRoot, 'recipes/pattern-catalog.json');

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    throw new Error('Usage: node scripts/validate-recipe-proposal.mjs <recipe-proposal.json>');
  }

  const proposalPath = path.isAbsolute(inputArg) ? inputArg : path.resolve(repoRoot, inputArg);
  const [proposalRaw, catalogRaw] = await Promise.all([
    fs.readFile(proposalPath, 'utf8'),
    fs.readFile(patternCatalogPath, 'utf8'),
  ]);
  const catalogResult = validatePatternCatalog(JSON.parse(catalogRaw));
  if (!catalogResult.ok) {
    throw new Error(`Invalid pattern catalog: ${catalogResult.errors.join(', ')}`);
  }

  const result = validateRecipeProposal(JSON.parse(proposalRaw), {
    patternCatalog: catalogResult.catalog,
  });

  console.log(JSON.stringify({
    check: 'recipe-proposal-contract',
    proposalPath,
    ok: result.ok,
    errors: result.errors,
    matchedPattern: result.proposal.matchedPattern,
    proposedRecipe: result.proposal.proposedRecipe?.id,
    status: result.proposal.status,
  }, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
