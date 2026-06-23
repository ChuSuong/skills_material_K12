import path from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from './local-static-server.mjs';

function trimText(value, max = 600) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function hasWebglFailure(messages = []) {
  return messages.some((entry) => {
    const msg = String(entry?.text || entry?.message || '');
    return msg.includes('WebGL context') || msg.includes('Error creating WebGL context') || msg.includes('could not be created');
  });
}

export function detectWebglFailure(result) {
  return hasWebglFailure([...(result.consoleMessages || []), ...(result.pageErrors || [])]);
}

export async function runPlaywrightPage({ htmlPath, actions = [], timeoutMs = 20000, viewport = { width: 1440, height: 960 }, screenshotPath = null }) {
  const absoluteHtmlPath = path.resolve(htmlPath);
  const serverRoot = '/home/ding';
  const server = await startStaticServer(serverRoot);
  const relativePath = path.relative(serverRoot, absoluteHtmlPath).replace(/\\/g, '/');

  if (!relativePath || relativePath.startsWith('..')) {
    await server.close();
    throw new Error(`HTML path must be under ${serverRoot}: ${absoluteHtmlPath}`);
  }

  const pageUrl = `${server.origin}/${relativePath}`;
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=egl',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--allow-file-access-from-files',
      '--enable-logging=stderr',
      '--v=1',
    ],
  });

  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(timeoutMs);

  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', async (msg) => {
    let args = [];
    try {
      args = await Promise.all(msg.args().map(async (arg) => {
        try {
          return await arg.jsonValue();
        } catch {
          return await arg.evaluate((value) => String(value)).catch(() => '[unserializable]');
        }
      }));
    } catch {
      args = [];
    }
    consoleMessages.push({
      type: msg.type(),
      text: trimText(msg.text()),
      args: args.map((value) => trimText(typeof value === 'string' ? value : JSON.stringify(value))),
    });
  });
  page.on('pageerror', (error) => {
    pageErrors.push({ message: trimText(error.message, 1000) });
  });

  try {
    const response = await page.goto(pageUrl, { waitUntil: 'load', timeout: timeoutMs });
    await page.waitForTimeout(1500);

    const hudTextBefore = trimText(await page.locator('body').innerText().catch(() => ''), 1000);
    const statusTextBefore = trimText(await page.locator('#statusText').innerText().catch(() => ''), 400);
    const statusSubBefore = trimText(await page.locator('#statusSub').innerText().catch(() => ''), 400);

    for (const action of actions) {
      if (action.type === 'wait') {
        await page.waitForTimeout(action.ms || 500);
      } else if (action.type === 'click') {
        const clicked = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          element.click();
          return true;
        }, action.selector);
        if (!clicked) {
          throw new Error(`Clickable element not found: ${action.selector}`);
        }
      } else if (action.type === 'dragCanvas') {
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if (!box) {
          throw new Error('Canvas not found for dragCanvas action');
        }
        const fromX = box.x + box.width * action.from.x;
        const fromY = box.y + box.height * action.from.y;
        const toX = box.x + box.width * action.to.x;
        const toY = box.y + box.height * action.to.y;
        const steps = action.steps || 18;
        await page.mouse.move(fromX, fromY);
        await page.mouse.down();
        await page.mouse.move(toX, toY, { steps });
        await page.mouse.up();
      } else if (action.type === 'dragFromPageApi') {
        const path = await page.evaluate((sampleId) => window.__flameTestApi?.getDragPath?.(sampleId) ?? null, action.sampleId || 'Li');
        if (!path?.from || !path?.to) {
          throw new Error(`Drag path not available for sample: ${action.sampleId || 'Li'}`);
        }
        const steps = action.steps || 20;
        await page.mouse.move(path.from.x, path.from.y);
        await page.mouse.down();
        await page.mouse.move(path.to.x, path.to.y, { steps });
        await page.mouse.up();
      } else if (action.type === 'dragWireFromPageApi') {
        const loadPath = await page.evaluate((sampleId) => window.__flameTestApi?.getWireLoadPath?.(sampleId) ?? null, action.sampleId || 'Li');
        if (!loadPath?.from || !loadPath?.to) {
          throw new Error(`Wire load path not available for sample: ${action.sampleId || 'Li'}`);
        }
        const steps = action.steps || 20;
        await page.mouse.move(loadPath.from.x, loadPath.from.y);
        await page.mouse.down();
        await page.mouse.move(loadPath.to.x, loadPath.to.y, { steps });
        await page.mouse.up();
        await page.waitForTimeout(action.afterLoadMs || 700);

        const flamePath = await page.evaluate(() => window.__flameTestApi?.getWireFlamePath?.() ?? null);
        if (!flamePath?.from || !flamePath?.to) {
          throw new Error('Wire flame path not available after loading sample');
        }
        await page.mouse.move(flamePath.from.x, flamePath.from.y);
        await page.mouse.down();
        await page.mouse.move(flamePath.to.x, flamePath.to.y, { steps });
        await page.mouse.up();
      } else {
        throw new Error(`Unsupported action: ${action.type}`);
      }
      await page.waitForTimeout(action.afterMs || 600);
    }

    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return { found: false, rect: null };
      }
      const rect = canvas.getBoundingClientRect();
      return {
        found: true,
        rect: { width: rect.width, height: rect.height },
      };
    });

    const buttonSelectors = {
      autoplay: await page.locator('[data-action="autoplay"], button[data-action="autoplay"], #pourBtn').count(),
      reset: await page.locator('[data-action="reset"], button[data-action="reset"], #resetBtn').count(),
    };

    const hudTextAfter = trimText(await page.locator('body').innerText().catch(() => ''), 1000);
    const statusTextAfter = trimText(await page.locator('#statusText').innerText().catch(() => ''), 400);
    const statusSubAfter = trimText(await page.locator('#statusSub').innerText().catch(() => ''), 400);
    const pageState = await page.evaluate(() => window.__flameTestApi?.getState?.() ?? null).catch(() => null);

    if (screenshotPath) {
      await page.screenshot({ path: path.resolve(screenshotPath), fullPage: true });
    }

    return {
      ok: pageErrors.length === 0,
      status: response?.status() ?? null,
      url: page.url(),
      title: await page.title(),
      canvasFound: canvasInfo.found,
      canvasRect: canvasInfo.rect,
      hudTextBefore,
      hudTextAfter,
      hudChanged: hudTextBefore !== hudTextAfter,
      statusTextBefore,
      statusTextAfter,
      statusTextChanged: statusTextBefore !== statusTextAfter,
      statusSubBefore,
      statusSubAfter,
      statusSubChanged: statusSubBefore !== statusSubAfter,
      pageState,
      buttonSelectors,
      consoleMessages,
      pageErrors,
      webglCreationFailed: hasWebglFailure([...consoleMessages, ...pageErrors]),
      screenshotPath: screenshotPath ? path.resolve(screenshotPath) : null,
    };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
