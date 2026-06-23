import path from 'node:path';
import { chromium } from 'playwright';

import { startStaticServer } from '../../scripts/local-static-server.mjs';

const DEFAULT_VIEWPORT = { width: 1440, height: 960 };
const SERVER_ROOT = '/home/ding';

function trimText(value, max = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function openCoursewarePage({
  htmlPath,
  viewport = DEFAULT_VIEWPORT,
  timeoutMs = 20000,
} = {}) {
  const absoluteHtmlPath = path.resolve(htmlPath);
  const server = await startStaticServer(SERVER_ROOT);
  const relativePath = path.relative(SERVER_ROOT, absoluteHtmlPath).replace(/\\/g, '/');

  if (!relativePath || relativePath.startsWith('..')) {
    await server.close();
    throw new Error(`HTML path must be under ${SERVER_ROOT}: ${absoluteHtmlPath}`);
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

  const url = `${server.origin}/${relativePath}`;
  const response = await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
  await page.waitForTimeout(1500);

  return {
    browser,
    context,
    page,
    server,
    response,
    htmlPath: absoluteHtmlPath,
    async close() {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
      await server.close().catch(() => {});
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
    };
  });
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
