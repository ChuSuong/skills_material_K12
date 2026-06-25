import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(skillDir, '..', '..');

const REQUIRED_META_FIELDS = ['topic', 'level', 'skill', 'renderMode', 'themeVersion'];
const VALID_RENDER_MODES = ['threejs', 'dom'];

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function buildImportmapBlock(outputDir) {
  const vendorDir = path.join(skillDir, 'vendor', 'three');
  const threeRelative = toPosix(path.relative(outputDir, path.join(vendorDir, 'three.module.js')));
  const controlsRelative = toPosix(path.relative(outputDir, path.join(vendorDir, 'OrbitControls.js')));
  return [
    '  <script type="importmap">',
    '    {',
    '      "imports": {',
    `        "three": "${threeRelative}",`,
    `        "three/addons/controls/OrbitControls.js": "${controlsRelative}"`,
    '      }',
    '    }',
    '  </script>',
  ].join('\n');
}

export async function assembleCourseware({ kind, slug, draftsDir, generatedDir } = {}) {
  if (!kind) throw new Error('kind is required');
  if (!slug) throw new Error('slug is required');

  const resolvedDraftsDir = draftsDir || path.join(repoRoot, 'drafts', kind, slug);
  const resolvedGeneratedDir = generatedDir || path.join(repoRoot, 'generated');
  const outputDir = path.join(resolvedGeneratedDir, kind, slug);

  const hudPath = path.join(resolvedDraftsDir, `${slug}.hud.html`);
  const scenePath = path.join(resolvedDraftsDir, `${slug}.scene.js`);
  const metaPath = path.join(resolvedDraftsDir, `${slug}.meta.json`);

  for (const [label, filePath] of [['hud', hudPath], ['scene', scenePath], ['meta', metaPath]]) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required ${label} input: ${filePath}`);
    }
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  for (const field of REQUIRED_META_FIELDS) {
    if (!meta[field]) {
      throw new Error(`meta.json is missing required field "${field}"`);
    }
  }
  if (!VALID_RENDER_MODES.includes(meta.renderMode)) {
    throw new Error(`meta.json renderMode must be one of ${VALID_RENDER_MODES.join(', ')}, got "${meta.renderMode}"`);
  }

  const hudFragment = fs.readFileSync(hudPath, 'utf8');
  const sceneSource = fs.readFileSync(scenePath, 'utf8');
  const themeCss = fs.readFileSync(path.join(skillDir, 'templates', 'theme.css'), 'utf8');
  const shellTemplate = fs.readFileSync(path.join(skillDir, 'templates', 'shell.html'), 'utf8');

  const importmapBlock = meta.renderMode === 'threejs' ? buildImportmapBlock(outputDir) : '';

  const html = shellTemplate
    .replace('{{TITLE}}', escapeHtml(meta.topic))
    .replace('{{THEME_CSS}}', themeCss)
    .replace('{{HUD}}', hudFragment)
    .replace('{{IMPORTMAP}}', importmapBlock);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  fs.writeFileSync(path.join(outputDir, 'scene.js'), sceneSource);

  const metadata = {
    topic: meta.topic,
    level: meta.level,
    skill: meta.skill,
    renderMode: meta.renderMode,
    themeVersion: meta.themeVersion,
    created_at: new Date().toISOString(),
    verify_status: 'pending',
  };
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

  return { outputDir, html, metadata };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isCli) {
  const [, , kind, slug, draftsDirArg] = process.argv;
  if (!kind || !slug) {
    console.error('Usage: node assemble-courseware.mjs <kind> <slug> [draftsDir]');
    process.exit(1);
  }
  try {
    const result = await assembleCourseware({
      kind,
      slug,
      draftsDir: draftsDirArg ? path.resolve(draftsDirArg) : undefined,
    });
    console.log(JSON.stringify({ check: 'assemble-courseware', outputDir: result.outputDir, metadata: result.metadata }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
