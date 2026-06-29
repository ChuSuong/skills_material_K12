import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function classifyGenerated(filePath) {
  const relativePath = toRepoRelative(filePath);

  if (/^generated\/legacy\/.+\.html$/.test(relativePath)) {
    return { category: 'legacy-reference', reason: 'top-level standalone legacy artifact moved under generated/legacy/' };
  }

  if (/^generated\/[^/]+\/[^/]+\/index\.html$/.test(relativePath)) {
    return { category: 'legacy-reference', reason: 'generated HTML exists outside the active compiler metadata contract' };
  }

  if (/^generated\/[^/]+\/[^/]+\/(hud\.html|scene\.js|metadata\.json)$/.test(relativePath)) {
    return { category: 'active-contract', reason: 'matches assembled V1 compiler output contract' };
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
  const generatedFiles = (await listFiles(generatedRoot)).map((filePath) => ({
    path: toRepoRelative(filePath),
    ...classifyGenerated(filePath),
  }));

  const exampleFiles = (await listFiles(examplesRoot)).map((filePath) => ({
    path: toRepoRelative(filePath),
    ...classifyExample(filePath),
  }));

  const sections = [
    ['active-contract', generatedFiles.filter((item) => item.category === 'active-contract')],
    ['legacy-reference', generatedFiles.filter((item) => item.category === 'legacy-reference')],
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
