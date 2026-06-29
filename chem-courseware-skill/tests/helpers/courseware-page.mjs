import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { startStaticServer } from '../../scripts/local-static-server.mjs';

const DEFAULT_VIEWPORT = { width: 1440, height: 960 };
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const SERVER_ROOT = repoRoot;

function trimText(value, max = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function openCoursewarePage({
  htmlPath,
  viewport = DEFAULT_VIEWPORT,
  timeoutMs = 20000,
  openMode = 'http',
  blockNetworkOutsideThree = false,
} = {}) {
  const absoluteHtmlPath = path.resolve(htmlPath);

  let server = null;
  let url;

  if (openMode === 'file') {
    url = `file://${absoluteHtmlPath}`;
  } else {
    server = await startStaticServer(SERVER_ROOT);
    const relativePath = path.relative(SERVER_ROOT, absoluteHtmlPath).replace(/\\/g, '/');

    if (!relativePath || relativePath.startsWith('..')) {
      await server.close();
      throw new Error(`HTML path must be under ${SERVER_ROOT}: ${absoluteHtmlPath}`);
    }

    url = `${server.origin}/${relativePath}`;
  }

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
    consoleMessages.push({
      type: msg.type(),
      text: trimText(msg.text(), 1000),
    });
  });
  page.on('pageerror', (error) => {
    pageErrors.push({ message: trimText(error.message, 1000) });
  });

  if (blockNetworkOutsideThree) {
    await page.route('**/*', async (route) => {
      const reqUrl = route.request().url();
      const isDataUri = reqUrl.startsWith('data:');
      const isFile = reqUrl.startsWith('file://');

      const isThree =
        reqUrl.includes('cdn.jsdelivr.net/npm/three@') ||
        reqUrl.includes('cdn.jsdelivr.net/npm/three@0.') ||
        reqUrl.includes('cdn.jsdelivr.net/npm/three/examples/jsm/controls/OrbitControls');

      const isHttp = reqUrl.startsWith('http://') || reqUrl.startsWith('https://');

      // Always allow local file/data requests (scene is standalone).
      if (isDataUri || isFile) {
        return route.continue();
      }

      // Only allow network requests that are part of Three.js / OrbitControls.
      if (isHttp && !isThree) {
        return route.abort();
      }

      return route.continue();
    });
  }

  const response = await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
  await page.waitForTimeout(1500);

  return {
    browser,
    context,
    page,
    server,
    response,
    htmlPath: absoluteHtmlPath,
    openMode,
    async close() {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
      if (server) {
        await server.close().catch(() => {});
      }
    },
    getMessages() {
      return { consoleMessages: [...consoleMessages], pageErrors: [...pageErrors] };
    },
  };
}

export async function collectFormatSnapshot(page) {
  return await page.evaluate(() => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const canvas = document.querySelector('canvas');
    const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

    const statusText = document.querySelector('#statusText');
    const statusSub = document.querySelector('#statusSub');
    const primaryAction = document.querySelector(
      '[data-action="autoplay"], button[data-action="autoplay"], #pourBtn'
    );
    const resetAction = document.querySelector(
      '[data-action="reset"], button[data-action="reset"], #resetBtn'
    );

    const overlaySelectors = [
      '.panel',
      '.legend',
      '.status',
      '.controls',
      '[data-courseware-role="intro"]',
      '[data-courseware-role="legend"]',
      '[data-courseware-role="status"]',
      '[data-courseware-role="controls"]',
    ];

    const overlays = overlaySelectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)).map((el) => ({ selector, el })))
      .filter(({ el }, index, arr) => arr.findIndex((item) => item.el === el) === index)
      .map(({ selector, el }) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          selector,
          text: (el.textContent || '').trim().slice(0, 120),
          rect: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          },
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
        };
      })
      .filter((item) => item.visible);

    const scroll = {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };

    const coursewareApi = window.__coursewareTestApi;
    const flameApi = window.__flameTestApi;

    return {
      viewport,
      title: document.title,
      bodyText: (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 800),
      canvas: {
        found: Boolean(canvas),
        rect: canvasRect
          ? {
              left: canvasRect.left,
              top: canvasRect.top,
              width: canvasRect.width,
              height: canvasRect.height,
            }
          : null,
      },
      scroll,
      required: {
        statusText: Boolean(statusText),
        statusSub: Boolean(statusSub),
        primaryAction: Boolean(primaryAction),
        resetAction: Boolean(resetAction),
      },
      statusText: statusText ? statusText.textContent.trim() : '',
      statusSub: statusSub ? statusSub.textContent.trim() : '',
      overlays,
      runtimeApi: {
        hasCoursewareApi: Boolean(coursewareApi),
        hasFlameApi: Boolean(flameApi),
        supportsGoldenPath: Boolean(coursewareApi?.getGoldenPath?.()?.length),
        supportsManualPath: Boolean(
          typeof coursewareApi?.dragFromPageApi === 'function'
          || typeof flameApi?.dragFromPageApi === 'function'
          || coursewareApi?.getDragPath?.('Li')?.from
          || flameApi?.getDragPath?.('Li')?.from
        ),
      },
    };
  });
}

export async function runRuntimeManualPath(page, sampleId = 'Li') {
  const dragInstruction = await page.evaluate(async (resolvedSampleId) => {
    const coursewareApi = window.__coursewareTestApi;
    const flameApi = window.__flameTestApi;
    const getPath = (api) => api?.getDragPath?.(resolvedSampleId) ?? api?.getDragPathForSampleId?.(resolvedSampleId) ?? null;
    const path = getPath(coursewareApi) ?? getPath(flameApi);
    if (path?.from && path?.to) {
      return { kind: 'path', path };
    }

    const dragDriver = coursewareApi?.dragFromPageApi ?? flameApi?.dragFromPageApi;
    if (typeof dragDriver === 'function') {
      await dragDriver.call(coursewareApi?.dragFromPageApi ? coursewareApi : flameApi, { sampleId: resolvedSampleId });
      return { kind: 'pageApiCall' };
    }

    return null;
  }, sampleId);

  if (!dragInstruction) {
    return false;
  }

  if (dragInstruction.kind === 'path') {
    const { path } = dragInstruction;
    await page.mouse.move(path.from.x, path.from.y);
    await page.mouse.down();
    await page.mouse.move(path.to.x, path.to.y, { steps: 20 });
    await page.mouse.up();
  }

  await page.waitForTimeout(1400);
  return true;
}

export async function runRuntimeGoldenPath(page) {
  const goldenPath = await page.evaluate(() => window.__coursewareTestApi?.getGoldenPath?.() ?? null);
  if (!Array.isArray(goldenPath) || goldenPath.length === 0) {
    return false;
  }

  for (const step of goldenPath) {
    if (step?.type === 'click' && step.selector) {
      await page.locator(step.selector).first().click();
    } else if (step?.type === 'drag' && step.from && step.to) {
      await page.mouse.move(step.from.x, step.from.y);
      await page.mouse.down();
      await page.mouse.move(step.to.x, step.to.y, { steps: step.steps || 20 });
      await page.mouse.up();
    } else if (step?.type === 'wait') {
      await page.waitForTimeout(step.ms || 500);
    } else if (step?.type === 'pageApiCall' && step.method) {
      await page.evaluate(({ method, args }) => {
        const api = window.__coursewareTestApi;
        const fn = api?.[method];
        if (typeof fn !== 'function') {
          throw new Error(`Page API method not found: ${method}`);
        }
        return fn(...(Array.isArray(args) ? args : []));
      }, { method: step.method, args: step.args || [] });
    } else {
      const handled = await page.evaluate((verifierStep) => {
        return window.__coursewareTestApi?.runVerifierStep?.(verifierStep) ?? false;
      }, step);
      if (!handled) {
        throw new Error(`Unsupported golden path step: ${JSON.stringify(step)}`);
      }
    }

    await page.waitForTimeout(step?.afterMs || 400);
  }

  await page.waitForTimeout(600);
  return true;
}

export async function readRuntimeState(page) {
  return await page.evaluate(() => {
    return window.__coursewareTestApi?.getState?.() ?? window.__flameTestApi?.getState?.() ?? null;
  });
}

export function hasVisibleLearnerStateChange(before, after) {
  return before.statusText !== after.statusText
    || before.statusSub !== after.statusSub
    || before.bodyText !== after.bodyText;
}

export function hasMeaningfulRuntimeProgression(beforeState, afterState) {
  if (!afterState) {
    return false;
  }

  return JSON.stringify(beforeState) !== JSON.stringify(afterState);
}

export function detectRectOverlaps(rects) {
  const overlaps = [];

  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const width = Math.max(0, Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left));
      const height = Math.max(0, Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top));
      const area = width * height;
      if (area > 4) {
        overlaps.push({
          first: a.selector,
          second: b.selector,
          area,
        });
      }
    }
  }

  return overlaps;
}
