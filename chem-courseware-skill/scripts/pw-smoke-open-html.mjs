import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/pw-smoke-open-html.mjs <html-path>');
  process.exit(1);
}

const result = await runPlaywrightPage({ htmlPath: path.resolve(htmlPath) });
const severeConsoleErrors = result.consoleMessages.filter((entry) => entry.type === 'error');

if ((result.status && result.status >= 400) || result.pageErrors.length > 0 || severeConsoleErrors.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  check: 'pw-smoke-open-html',
  htmlPath: path.resolve(htmlPath),
  title: result.title,
  status: result.status,
  canvasFound: result.canvasFound,
  webglCreationFailed: result.webglCreationFailed,
  buttonSelectors: result.buttonSelectors,
  pageErrors: result.pageErrors,
  consoleMessages: result.consoleMessages.slice(-10),
}, null, 2));

process.exit(0);
