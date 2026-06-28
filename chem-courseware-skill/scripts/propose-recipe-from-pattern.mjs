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

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1]?.startsWith('--') ? true : argv[index + 1];
    args[key] = value ?? true;
    if (value !== true) {
      index += 1;
    }
  }
  return args;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'proposed-recipe';
}

export async function loadPatternCatalog() {
  const catalog = JSON.parse(await fs.readFile(patternCatalogPath, 'utf8'));
  const result = validatePatternCatalog(catalog);
  if (!result.ok) {
    throw new Error(`Invalid pattern catalog: ${result.errors.join(', ')}`);
  }
  return result.catalog;
}

export function buildRecipeProposal({
  catalog,
  patternId,
  recipeId,
  topic,
  level = 'THCS',
  language = 'vi',
} = {}) {
  const pattern = catalog?.patterns?.find((entry) => entry.id === patternId);
  if (!pattern) {
    throw new Error(`Unknown pattern: ${patternId}`);
  }
  if (!topic) {
    throw new Error('topic is required');
  }

  const proposedRecipe = {
    id: recipeId || slugify(topic),
    ...structuredClone(pattern.recipeSkeleton),
  };

  const proposal = {
    kind: 'recipe-proposal',
    status: 'needs-builder',
    topic,
    level,
    language,
    matchedPattern: pattern.id,
    referenceCases: pattern.referenceCases,
    proposedRecipe,
    builder: {
      supported: false,
      reason: 'No recipe-scene-builder implementation has been confirmed for this proposed recipe.',
      nextActions: [
        'Review and edit proposedRecipe for the exact chemistry.',
        'Add or update apparatus presets/anchors if required.',
        'Implement recipe support in scripts/build-recipe-scene.mjs.',
        'Add recipe contract, source audit, Playwright contract smoke, and interaction tests.',
      ],
    },
    verification: {
      validateOnly: true,
      mustNotGenerateHtml: true,
      requiredChecksBeforeHtml: [
        'validateRecipeProposal',
        'validateRecipeDefinition',
        'recipe-scene-builder support',
        'verify:pw:contract',
      ],
    },
  };

  const result = validateRecipeProposal(proposal, { patternCatalog: catalog });
  if (!result.ok) {
    throw new Error(`Invalid recipe proposal: ${result.errors.join(', ')}`);
  }

  return proposal;
}

export async function writeRecipeProposal({ outputPath, ...options } = {}) {
  if (!outputPath) {
    throw new Error('outputPath is required');
  }
  const catalog = options.catalog || await loadPatternCatalog();
  const proposal = buildRecipeProposal({ ...options, catalog });
  const absoluteOutputPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(repoRoot, outputPath);
  await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
  await fs.writeFile(absoluteOutputPath, `${JSON.stringify(proposal, null, 2)}\n`);
  return { outputPath: absoluteOutputPath, proposal };
}

async function main() {
  const args = parseArgs();
  if (!args.pattern || !args.topic || !args.out) {
    throw new Error('Usage: node scripts/propose-recipe-from-pattern.mjs --pattern <pattern-id> --topic <topic> --out <recipe-proposal.json> [--id <recipe-id>] [--level THCS]');
  }

  const result = await writeRecipeProposal({
    patternId: args.pattern,
    recipeId: args.id,
    topic: args.topic,
    level: args.level || 'THCS',
    language: args.language || 'vi',
    outputPath: args.out,
  });

  console.log(JSON.stringify({
    check: 'propose-recipe-from-pattern',
    outputPath: result.outputPath,
    recipe: result.proposal.proposedRecipe.id,
    matchedPattern: result.proposal.matchedPattern,
    status: result.proposal.status,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
