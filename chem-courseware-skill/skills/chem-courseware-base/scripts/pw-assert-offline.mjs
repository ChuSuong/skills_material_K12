import path from 'node:path';
import { chromium } from 'playwright';

const [, , htmlPath] = process.argv;

if (!htmlPath) {
  console.error('Usage: node pw-assert-offline.mjs <html-path>');
  process.exit(1);
}

const resolvedHtmlPath = path.resolve(htmlPath);
const browser = await chromium.launch({
  headless: true,
  args: ['--allow-file-access-from-files'],
});
const context = await browser.newContext();

await context.route('**/*', (route) => {
  const url = route.request().url();
  if (url.startsWith('file://')) {
    route.continue();
  } else {
    route.abort();
  }
});

const page = await context.newPage();
const consoleMessages = [];
const pageErrors = [];
page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (error) => pageErrors.push({ message: error.message }));

try {
  await page.goto(`file://${resolvedHtmlPath}`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(1000);

  const canvasFound = await page.evaluate(() => !!document.querySelector('canvas'));
  const consoleErrors = consoleMessages.filter((entry) => entry.type === 'error');
  const ok = pageErrors.length === 0 && consoleErrors.length === 0 && canvasFound;

  console.log(JSON.stringify({
    check: 'pw-assert-offline',
    ok,
    canvasFound,
    pageErrors,
    consoleErrors,
  }, null, 2));

  process.exit(ok ? 0 : 1);
} finally {
  await context.close();
  await browser.close();
}
