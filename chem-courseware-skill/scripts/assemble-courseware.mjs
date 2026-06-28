import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sharedInlineSnippetPath = path.join(repoRoot, 'templates/shared-inline-snippet.js');
const apparatusInlineSnippetPath = path.join(repoRoot, 'templates/apparatus-inline-snippet.js');

function resolveWithinRepo(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(repoRoot, inputPath);
}

function sanitizeSceneSource(sceneSource) {
  return sceneSource
    .replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"]three['"];?\n?/m, 'const THREE = globalThis.THREE;\n')
    .replace(/^import\s+\{\s*([^}]+?)\s*\}\s+from\s+['"].*?(?:lib\/apparatus\/index|templates\/apparatus-scaffold)\.js['"];?\n?/m, 'const { $1 } = globalThis.ChemApparatusLib;\n')
    .replace(/^import\s+\{\s*createSceneShell\s*\}\s+from\s+['"].*?lib\/runtime\/scene-shell\.js['"];?\n?/m, '')
    .replace(/^import\s+\{\s*installCoursewareTestHarness\s*\}\s+from\s+['"].*?lib\/testing\/harness\.js['"];?\n?/m, '')
    .replace(/(^|\n)const\s+(\w+)\s*=\s*createSceneShell\(/, '$1const { createSceneShell } = globalThis.ChemSharedLib;\n\nconst $2 = createSceneShell(')
    .replace(/(^|\n)installCoursewareTestHarness\(/, '$1const { installCoursewareTestHarness } = globalThis.ChemSharedLib;\n\ninstallCoursewareTestHarness(')
    .trimStart();
}

function buildHtml({ topic, hudMarkup, sceneInlineCode, sharedInlineSnippet, apparatusInlineSnippet }) {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${topic}</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: radial-gradient(circle at top, #1f2a44 0%, #0b1220 48%, #05070d 100%);
        color: var(--text, #f7f7f7);
      }
      #stage {
        position: fixed;
        inset: 0;
        display: block;
        width: 100vw;
        height: 100vh;
        touch-action: none;
        z-index: 0;
      }
      #hud-root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2;
      }
      .panel, .legend, .status {
        position: absolute;
        border-radius: 18px;
        background: var(--panel, rgba(12, 18, 32, 0.72));
        border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(18px);
      }
      .panel {
        left: 24px;
        top: 24px;
        max-width: 380px;
        padding: 18px 20px;
        pointer-events: auto;
      }
      .panel .lesson-title {
        margin: 0 0 8px;
        font-size: 24px;
        line-height: 1.1;
        letter-spacing: -0.03em;
      }
      .panel .lesson-desc {
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.5;
        font-size: 14px;
      }
      .panel .lesson-hint {
        margin-top: 12px;
        color: #d7f4ff;
      }
      .legend {
        right: 24px;
        top: 24px;
        width: 280px;
        padding: 16px 18px;
      }
      .legend-title {
        margin: 0 0 10px;
        font-size: 15px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: #c3d7ff;
      }
      .legend ul {
        margin: 0;
        padding-left: 18px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 13px;
        line-height: 1.55;
      }
      .status {
        left: 24px;
        bottom: 24px;
        min-width: 320px;
        max-width: 440px;
        padding: 16px 18px;
        background: rgba(7, 10, 18, 0.72);
      }
      .status-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #84d8ff;
        margin-bottom: 8px;
      }
      #statusText {
        font-size: 17px;
        line-height: 1.45;
        color: #fff;
      }
      #statusSub {
        margin-top: 8px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.72);
      }
      .controls {
        position: absolute;
        right: 24px;
        bottom: 24px;
        display: flex;
        gap: 12px;
        pointer-events: auto;
        z-index: 3;
      }
      button {
        border: 0;
        min-width: 126px;
        height: 46px;
        padding: 0 18px;
        border-radius: 999px;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
        color: #08111c;
        background: var(--button-primary, linear-gradient(135deg, #8ce3ff, #58c3ff));
        box-shadow: 0 12px 30px rgba(72, 175, 255, 0.3);
        transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
      }
      button.secondary {
        color: #fff;
        background: var(--button-secondary, rgba(255, 255, 255, 0.08));
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: none;
      }
      button:hover { transform: translateY(-1px); }
      button:active { transform: translateY(1px) scale(0.99); }
      @media (max-width: 900px) {
        .panel, .legend, .status {
          max-width: calc(100vw - 28px);
          left: 14px;
          right: 14px;
        }
        .legend {
          top: auto;
          bottom: 94px;
          width: auto;
        }
        .controls {
          left: 14px;
          right: 14px;
          bottom: 14px;
          justify-content: space-between;
        }
        button {
          flex: 1;
          min-width: 0;
        }
      }
    </style>
  </head>
  <body>
    <canvas id="stage"></canvas>
    <div id="hud-root">${hudMarkup}</div>
    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js"
        }
      }
    </script>
    <script type="module">
      import * as THREE from 'three';
      import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';

      globalThis.THREE = THREE;
      globalThis.OrbitControls = OrbitControls;
      ${sharedInlineSnippet.trim()}
      ${apparatusInlineSnippet.trim()}
    </script>
    <script type="module">
${sceneInlineCode.trim()}
    </script>
  </body>
</html>
`;
}

async function loadSharedInlineSnippet() {
  return fs.readFile(sharedInlineSnippetPath, 'utf8');
}

async function loadApparatusInlineSnippet() {
  return fs.readFile(apparatusInlineSnippetPath, 'utf8');
}

function withTrailingNewline(value) {
  return `${value.replace(/\s+$/, '')}\n`;
}

export async function assembleCourseware({ kind, slug, draftsDir, generatedDir } = {}) {
  if (!kind) throw new Error('kind is required');
  if (!slug) throw new Error('slug is required');
  if (!draftsDir) throw new Error('draftsDir is required');
  if (!generatedDir) throw new Error('generatedDir is required');

  const absoluteDraftsDir = resolveWithinRepo(draftsDir);
  const absoluteGeneratedDir = resolveWithinRepo(generatedDir);
  const hudFileName = `${slug}.hud.html`;
  const sceneFileName = `${slug}.scene.js`;
  const metaFileName = `${slug}.meta.json`;

  const [hud, scene, metaRaw, sharedInlineSnippet, apparatusInlineSnippet] = await Promise.all([
    fs.readFile(path.join(absoluteDraftsDir, hudFileName), 'utf8'),
    fs.readFile(path.join(absoluteDraftsDir, sceneFileName), 'utf8'),
    fs.readFile(path.join(absoluteDraftsDir, metaFileName), 'utf8'),
    loadSharedInlineSnippet(),
    loadApparatusInlineSnippet(),
  ]);
  const meta = JSON.parse(metaRaw);

  const outputDir = path.join(absoluteGeneratedDir, kind, slug);
  await fs.mkdir(outputDir, { recursive: true });

  const trimmedHud = `${hud.trim()}\n`;
  const sanitizedScene = withTrailingNewline(sanitizeSceneSource(scene));

  await Promise.all([
    fs.writeFile(
      path.join(outputDir, 'index.html'),
      buildHtml({
        topic: meta.topic,
        hudMarkup: trimmedHud.trim(),
        sceneInlineCode: sanitizedScene,
        sharedInlineSnippet,
        apparatusInlineSnippet,
      })
    ),
    fs.writeFile(path.join(outputDir, 'hud.html'), trimmedHud),
    fs.writeFile(path.join(outputDir, 'scene.js'), sanitizedScene),
    fs.writeFile(
      path.join(outputDir, 'metadata.json'),
      `${JSON.stringify({ ...meta, created_at: new Date().toISOString(), verify_status: 'pending' }, null, 2)}\n`
    ),
  ]);

  return { outputDir, htmlPath: path.join(outputDir, 'index.html') };
}

async function main() {
  const [kind, slug, draftsDirArg, generatedDirArg = 'generated'] = process.argv.slice(2);
  if (!kind) throw new Error('kind is required');
  if (!slug) throw new Error('slug is required');
  if (!draftsDirArg) throw new Error('draftsDir is required');

  await assembleCourseware({
    kind,
    slug,
    draftsDir: draftsDirArg,
    generatedDir: generatedDirArg,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
