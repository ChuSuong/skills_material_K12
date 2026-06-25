import path from 'node:path';
import { runPlaywrightPage } from '../../../scripts/pw-browser-utils.mjs';

const [, , htmlPath, triggerSelector, outDir, midMs = '3500', aftermathMs = '9000'] = process.argv;

if (!htmlPath || !triggerSelector || !outDir) {
  console.error('Usage: node pw-capture-checkpoints.mjs <html-path> <trigger-selector> <out-dir> [midMs] [aftermathMs]');
  process.exit(1);
}

const resolvedHtmlPath = path.resolve(htmlPath);

const idle = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  screenshotPath: path.join(outDir, 'idle.png')
});

const mid = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  actions: [{ type: 'click', selector: triggerSelector, afterMs: Number(midMs) }],
  screenshotPath: path.join(outDir, 'mid.png')
});

const aftermath = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  actions: [{ type: 'click', selector: triggerSelector, afterMs: Number(aftermathMs) }],
  screenshotPath: path.join(outDir, 'aftermath.png')
});

console.log(JSON.stringify({
  check: 'pw-capture-checkpoints',
  idle: { ok: idle.ok, screenshot: idle.screenshotPath },
  mid: { ok: mid.ok, screenshot: mid.screenshotPath },
  aftermath: { ok: aftermath.ok, screenshot: aftermath.screenshotPath }
}, null, 2));

process.exit(0);
