import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isActiveClassicRecipeId } from './classic-kit-active-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const generatedRoot = path.join(repoRoot, 'generated');
const examplesRoot = path.join(repoRoot, 'examples');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(rootDir) {
  async function walk(currentDir, acc) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const nextPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath, acc);
      } else if (entry.isFile()) {
        acc.push(nextPath);
      }
    }
  }

  const files = [];
  if (await pathExists(rootDir)) {
    await walk(rootDir, files);
  }
  return files.sort();
}

function toRepoRelative(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

async function classifyGenerated(filePath) {
  const relativePath = toRepoRelative(filePath);
  const relativeDir = path.dirname(relativePath);

  if (/^generated\/legacy\/.+\.html$/.test(relativePath)) {
    return { category: 'legacy-reference', reason: 'top-level standalone legacy artifact moved under generated/legacy/' };
  }

  if (/^generated\/[^/]+\/[^/]+\/[^/]+\//.test(`${relativeDir}/`)) {
    return { category: 'stale-generated', reason: 'nested generated output tree is not a canonical assembled artifact path' };
  }

  if (/^generated\/[^/]+\/[^/]+\/index\.html$/.test(relativePath)) {
    const hasCanonicalSiblings = await Promise.all([
      pathExists(path.join(repoRoot, relativeDir, 'hud.html')),
      pathExists(path.join(repoRoot, relativeDir, 'scene.js')),
      pathExists(path.join(repoRoot, relativeDir, 'metadata.json')),
    ]);

    if (hasCanonicalSiblings.every(Boolean)) {
      const slug = relativeDir.split('/').at(-1) || '';
      return {
        category: isActiveClassicRecipeId(slug) ? 'active-contract' : 'legacy-reference',
        reason: isActiveClassicRecipeId(slug)
          ? 'matches canonical assembled output for an active classic recipe'
          : 'canonical assembled output exists, but recipe is not in the active classic set',
      };
    }

    return { category: 'legacy-reference', reason: 'generated HTML exists outside the active compiler metadata contract' };
  }

  if (/^generated\/[^/]+\/[^/]+\/(hud\.html|scene\.js|metadata\.json)$/.test(relativePath)) {
    const slug = relativeDir.split('/').at(-1) || '';
    return {
      category: isActiveClassicRecipeId(slug) ? 'active-contract' : 'legacy-reference',
      reason: isActiveClassicRecipeId(slug)
        ? 'matches canonical assembled output companion file for an active classic recipe'
        : 'assembled companion file belongs to a non-active generated output',
    };
  }

  if (/^generated\/verify\//.test(relativePath)) {
    return { category: 'verification-artifact', reason: 'verification evidence or screenshot output' };
  }

  return { category: 'unknown', reason: 'not matched by the current generated artifact inventory rules' };
}

function classifyExample(filePath) {
  const relativePath = toRepoRelative(filePath);

  if (/^examples\/drafts\/.+\/semantic-draft\.json$/.test(relativePath)) {
    return { category: 'active-draft-fixture', reason: 'semantic draft fixture for compiler tests' };
  }

  if (/^examples\/drafts\/.+\/recipe-proposal\.json$/.test(relativePath)) {
    return { category: 'proposal-fixture', reason: 'recipe proposal fixture for unsupported experiment planning tests' };
  }

  if (/^examples\/drafts\/.+\/[^/]+\.(scene\.js|hud\.html|meta\.json)$/.test(relativePath)) {
    return { category: 'compiled-draft-fixture', reason: 'compiled draft fixture emitted by the semantic draft compiler' };
  }

  if (/^examples\/.+\.html$/.test(relativePath)) {
    return { category: 'stable-fixture', reason: 'manual regression fixture outside generated/' };
  }

  return { category: 'unknown', reason: 'example file not yet classified' };
}

function printSection(title, records) {
  console.log(`\n[${title}]`);
  if (records.length === 0) {
    console.log('- none');
    return;
  }

  for (const record of records) {
    console.log(`- ${record.path} :: ${record.reason}`);
  }
}

async function main() {
  const generatedFiles = await Promise.all((await listFiles(generatedRoot)).map(async (filePath) => ({
    path: toRepoRelative(filePath),
    ...(await classifyGenerated(filePath)),
  })));

  const exampleFiles = (await listFiles(examplesRoot)).map((filePath) => ({
    path: toRepoRelative(filePath),
    ...classifyExample(filePath),
  }));

  const sections = [
    ['active-contract', generatedFiles.filter((item) => item.category === 'active-contract')],
    ['legacy-reference', generatedFiles.filter((item) => item.category === 'legacy-reference')],
    ['stale-generated', generatedFiles.filter((item) => item.category === 'stale-generated')],
    ['verification-artifact', generatedFiles.filter((item) => item.category === 'verification-artifact')],
    ['stable-fixture', exampleFiles.filter((item) => item.category === 'stable-fixture')],
    ['active-draft-fixture', exampleFiles.filter((item) => item.category === 'active-draft-fixture')],
    ['compiled-draft-fixture', exampleFiles.filter((item) => item.category === 'compiled-draft-fixture')],
    ['proposal-fixture', exampleFiles.filter((item) => item.category === 'proposal-fixture')],
    ['unknown', [...generatedFiles, ...exampleFiles].filter((item) => item.category === 'unknown')],
  ];

  console.log('Generated artifact audit');
  console.log(`Repo root: ${repoRoot}`);

  for (const [title, records] of sections) {
    printSection(title, records);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
