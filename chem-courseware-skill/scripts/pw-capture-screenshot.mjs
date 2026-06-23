import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
const outputPath = process.argv[3];
if (!htmlPath || !outputPath) {
  console.error('Usage: node scripts/pw-capture-screenshot.mjs <html-path> <output-path>');
  process.exit(1);
}

const result = await runPlaywrightPage({
  htmlPath: path.resolve(htmlPath),
  screenshotPath: path.resolve(outputPath),
});

console.log(JSON.stringify({
  check: 'pw-capture-screenshot',
  htmlPath: path.resolve(htmlPath),
  outputPath: path.resolve(outputPath),
  title: result.title,
  canvasFound: result.canvasFound,
  webglCreationFailed: result.webglCreationFailed,
}, null, 2));

process.exit(0);
