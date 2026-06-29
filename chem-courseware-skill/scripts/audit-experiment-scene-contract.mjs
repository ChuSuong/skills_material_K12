import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const presetsSourcePath = path.join(repoRoot, 'lib/apparatus/presets.js');

function toPascalCase(value) {
  return String(value || '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

async function listRegisteredPresetKeys() {
  const source = await fs.readFile(presetsSourcePath, 'utf8');
  return Array.from(source.matchAll(/key:\s*['"]([^'"]+)['"]/g))
    .map((match) => match[1])
    .sort();
}

function sceneUsesFactoryForKey(sceneSource, key) {
  const factoryName = `create${toPascalCase(key)}Apparatus`;
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${factoryName}\\s*\\(`).test(sceneSource)
    || new RegExp(`\\bcreateApparatusFromPreset\\s*\\(\\s*['"]${escapedKey}['"]`).test(sceneSource);
}

export async function auditExperimentSceneContract({
  draft,
  sceneSource,
  registeredPresetKeys = null,
} = {}) {
  const errors = [];
  const warnings = [];
  const presetKeys = new Set(registeredPresetKeys || await listRegisteredPresetKeys());
  const apparatus = Array.isArray(draft?.scene?.apparatus) ? draft.scene.apparatus : [];

  if (draft?.kind !== 'experiment' || draft?.renderMode !== 'threejs') {
    return { ok: true, errors, warnings };
  }

  if (apparatus.length === 0) {
    errors.push('scene.apparatus must list the required apparatus presets');
  }

  for (const key of apparatus) {
    if (!presetKeys.has(key)) {
      errors.push(`apparatus preset is not registered: ${key}`);
      continue;
    }
    if (!sceneUsesFactoryForKey(sceneSource, key)) {
      errors.push(`scene must instantiate apparatus from library preset: ${key}`);
    }
  }

  if (apparatus.length > 0 && !/\.anchors\.|\banchors\./.test(sceneSource)) {
    errors.push('scene must derive reaction, drag, pour, or effect targets from apparatus anchors');
  }

  if (apparatus.length > 0 && !/\.controllers\.setLabel\s*\(|\bsetLabel\s*\(|\blabelAnchor\b/.test(sceneSource)) {
    errors.push('scene must attach visible apparatus labels through label anchors/controllers');
  }

  if (!/\bgetVerifierMeta\s*\(/.test(sceneSource)) {
    errors.push('scene must expose getVerifierMeta() in installCoursewareTestHarness');
  }
  if (!/\bgetGoldenPath\s*\(/.test(sceneSource)) {
    errors.push('scene must expose getGoldenPath() in installCoursewareTestHarness');
  }
  if (!/\brunVerifierStep\s*\(/.test(sceneSource)) {
    errors.push('scene must expose runVerifierStep() in installCoursewareTestHarness');
  }

  if (/\bconst\s+makeAnchor\s*=|\bfunction\s+makeAnchor\s*\(/.test(sceneSource)) {
    warnings.push('scene defines a local makeAnchor helper; prefer apparatus library anchors');
  }

  return { ok: errors.length === 0, errors, warnings };
}

async function resolveInputs(inputArg, sceneArg) {
  if (!inputArg) {
    throw new Error('Usage: node scripts/audit-experiment-scene-contract.mjs <draft-dir|semantic-draft.json> [scene.js]');
  }

  const inputPath = path.resolve(repoRoot, inputArg);
  const stat = await fs.stat(inputPath);
  if (stat.isDirectory()) {
    const draftPath = path.join(inputPath, 'semantic-draft.json');
    const slug = path.basename(inputPath);
    const scenePath = sceneArg
      ? path.resolve(repoRoot, sceneArg)
      : path.join(inputPath, `${slug}.scene.js`);
    return { draftPath, scenePath };
  }

  const draftPath = inputPath;
  const scenePath = sceneArg
    ? path.resolve(repoRoot, sceneArg)
    : path.join(path.dirname(inputPath), `${path.basename(path.dirname(inputPath))}.scene.js`);
  return { draftPath, scenePath };
}

async function main() {
  const [inputArg, sceneArg] = process.argv.slice(2);
  const { draftPath, scenePath } = await resolveInputs(inputArg, sceneArg);
  const [draftRaw, sceneSource] = await Promise.all([
    fs.readFile(draftPath, 'utf8'),
    fs.readFile(scenePath, 'utf8'),
  ]);
  const result = await auditExperimentSceneContract({
    draft: JSON.parse(draftRaw),
    sceneSource,
  });

  console.log(JSON.stringify({
    check: 'experiment-scene-contract',
    draftPath,
    scenePath,
    ...result,
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
