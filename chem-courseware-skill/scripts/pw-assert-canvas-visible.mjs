import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/pw-assert-canvas-visible.mjs <html-path>');
  process.exit(1);
}

const result = await runPlaywrightPage({ htmlPath: path.resolve(htmlPath) });
const visible = result.canvasFound && result.canvasRect && result.canvasRect.width > 100 && result.canvasRect.height > 100;

if (!visible || result.webglCreationFailed) {
  console.error(JSON.stringify({ ...result, visible }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  check: 'pw-assert-canvas-visible',
  htmlPath: path.resolve(htmlPath),
  visible,
  canvasRect: result.canvasRect,
  webglCreationFailed: result.webglCreationFailed,
}, null, 2));

process.exit(0);
