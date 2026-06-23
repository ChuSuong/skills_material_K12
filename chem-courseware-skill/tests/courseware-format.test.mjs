import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import {
  collectFormatSnapshot,
  detectRectOverlaps,
  openCoursewarePage,
} from './helpers/courseware-page.mjs';

const targetHtml = path.resolve(
  process.env.COURSEWARE_HTML ||
    '/home/ding/chem-courseware-skill-base/examples/sugar-h2so4/sugar-h2so4.html'
);

test('courseware renders without hard runtime failures', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml });
  try {
    const { consoleMessages, pageErrors } = session.getMessages();
    const responseStatus = session.response?.status() ?? 200;
    const severeConsoleErrors = consoleMessages.filter((entry) => entry.type === 'error');

    assert.ok(responseStatus < 400, `Expected HTTP status < 400, got ${responseStatus}`);
    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${JSON.stringify(pageErrors, null, 2)}`);
    assert.equal(
      severeConsoleErrors.length,
      0,
      `Unexpected console errors: ${JSON.stringify(severeConsoleErrors, null, 2)}`
    );
  } finally {
    await session.close();
  }
});

test('courseware keeps a near full-screen render stage with no accidental page scroll', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml });
  try {
    const snapshot = await collectFormatSnapshot(session.page);

    assert.ok(snapshot.canvas.found, 'Expected a <canvas> render stage');
    assert.ok(snapshot.canvas.rect.width >= snapshot.viewport.width * 0.9, `Canvas width too small: ${snapshot.canvas.rect.width}`);
    assert.ok(snapshot.canvas.rect.height >= snapshot.viewport.height * 0.9, `Canvas height too small: ${snapshot.canvas.rect.height}`);
    assert.ok(snapshot.canvas.rect.left <= 2, `Canvas should start near the left edge: ${snapshot.canvas.rect.left}`);
    assert.ok(snapshot.canvas.rect.top <= 2, `Canvas should start near the top edge: ${snapshot.canvas.rect.top}`);
    assert.ok(snapshot.scroll.width <= snapshot.viewport.width + 4, `Unexpected horizontal scroll: ${snapshot.scroll.width} > ${snapshot.viewport.width}`);
    assert.ok(snapshot.scroll.height <= snapshot.viewport.height + 4, `Unexpected vertical scroll: ${snapshot.scroll.height} > ${snapshot.viewport.height}`);
  } finally {
    await session.close();
  }
});

test('courseware exposes the default UI contract for status, action, and reset', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml });
  try {
    const snapshot = await collectFormatSnapshot(session.page);

    assert.equal(snapshot.required.statusText, true, 'Missing required #statusText element');
    assert.equal(snapshot.required.statusSub, true, 'Missing required #statusSub element');
    assert.equal(snapshot.required.primaryAction, true, 'Missing primary action button');
    assert.equal(snapshot.required.resetAction, true, 'Missing reset action button');
    assert.ok(snapshot.statusText.length > 0, 'Expected non-empty status text');
    assert.ok(snapshot.statusSub.length > 0, 'Expected non-empty status subtext');
  } finally {
    await session.close();
  }
});

test('courseware overlay panels do not overlap and do not consume too much of the viewport', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml });
  try {
    const snapshot = await collectFormatSnapshot(session.page);
    const overlaps = detectRectOverlaps(snapshot.overlays);
    const totalOverlayArea = snapshot.overlays.reduce(
      (sum, item) => sum + item.rect.width * item.rect.height,
      0
    );
    const viewportArea = snapshot.viewport.width * snapshot.viewport.height;
    const overlayRatio = viewportArea > 0 ? totalOverlayArea / viewportArea : 1;

    assert.equal(overlaps.length, 0, `Overlay blocks overlap: ${JSON.stringify(overlaps, null, 2)}`);
    assert.ok(overlayRatio <= 0.45, `Overlay footprint too large: ${(overlayRatio * 100).toFixed(1)}%`);
  } finally {
    await session.close();
  }
});

test('courseware primary action changes the visible learner state', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml, timeoutMs: 25000 });
  try {
    const before = await collectFormatSnapshot(session.page);
    await session.page.click('[data-action="autoplay"], button[data-action="autoplay"], #pourBtn');
    await session.page.waitForTimeout(1400);
    const after = await collectFormatSnapshot(session.page);

    const statusChanged = before.statusText !== after.statusText || before.statusSub !== after.statusSub;
    const bodyChanged = before.bodyText !== after.bodyText;

    assert.equal(after.required.resetAction, true, 'Reset action should still be present after interaction');
    assert.ok(statusChanged || bodyChanged, 'Expected visible learner state to change after the primary action');
  } finally {
    await session.close();
  }
});
