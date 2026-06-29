import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  collectFormatSnapshot,
  detectRectOverlaps,
  hasMeaningfulRuntimeProgression,
  hasVisibleLearnerStateChange,
  openCoursewarePage,
  readRuntimeState,
  runRuntimeGoldenPath,
  runRuntimeManualPath,
} from './helpers/courseware-page.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const defaultFixtureHtml = path.join(repoRoot, 'examples/sugar-h2so4.html');
const targetHtml = path.resolve(process.env.COURSEWARE_HTML || defaultFixtureHtml);

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

test('courseware renders under file://, avoids file-origin/frame warnings, and only loads three from CDN', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml, openMode: 'file', blockNetworkOutsideThree: true });
  try {
    const { consoleMessages, pageErrors } = session.getMessages();

    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${JSON.stringify(pageErrors, null, 2)}`);

    const severeConsoleErrors = consoleMessages.filter((entry) => entry.type === 'error');
    assert.equal(
      severeConsoleErrors.length,
      0,
      `Unexpected console errors: ${JSON.stringify(severeConsoleErrors, null, 2)}`
    );

    const referenceErrors = consoleMessages
      .filter((entry) => entry.type === 'error')
      .map((entry) => entry.text)
      .filter((text) => /ReferenceError: .* is not defined/.test(text));
    assert.equal(referenceErrors.length, 0, `Unexpected ReferenceErrors: ${JSON.stringify(referenceErrors, null, 2)}`);

    const fileFrameWarnings = consoleMessages
      .map((entry) => entry.text)
      .filter((text) => /Unsafe attempt to load URL file:\/\//.test(text) && /from frame/.test(text));

    assert.equal(
      fileFrameWarnings.length,
      0,
      `Unexpected file:// frame-origin warnings: ${JSON.stringify(fileFrameWarnings, null, 2)}`
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
    const beforeState = await readRuntimeState(session.page);
    await session.page.click('[data-action="autoplay"], button[data-action="autoplay"], #pourBtn');
    await session.page.waitForTimeout(1400);
    const after = await collectFormatSnapshot(session.page);
    const afterState = await readRuntimeState(session.page);

    assert.equal(after.required.resetAction, true, 'Reset action should still be present after interaction');
    assert.ok(hasVisibleLearnerStateChange(before, after), 'Expected visible learner state to change after the primary action');
    if (beforeState || afterState) {
      assert.ok(
        hasMeaningfulRuntimeProgression(beforeState, afterState),
        `Expected primary action to advance runtime state: before=${JSON.stringify(beforeState)} after=${JSON.stringify(afterState)}`
      );
    }
  } finally {
    await session.close();
  }
});

test('courseware runtime keeps manual interaction and autoplay available together when exposed', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml, timeoutMs: 25000 });
  try {
    const baseline = await collectFormatSnapshot(session.page);
    const baselineState = await readRuntimeState(session.page);

    if (!baseline.runtimeApi.supportsManualPath || !baseline.runtimeApi.supportsGoldenPath) {
      return;
    }

    const manualRan = await runRuntimeManualPath(session.page, 'H2');
    assert.equal(manualRan, true, 'Expected runtime manual path to be available');

    const afterManual = await collectFormatSnapshot(session.page);
    assert.equal(afterManual.required.primaryAction, true, 'Primary action should still be present after manual interaction');
    assert.equal(afterManual.required.resetAction, true, 'Reset action should still be present after manual interaction');

    await session.page.click('[data-action="reset"], button[data-action="reset"], #resetBtn');
    await session.page.waitForTimeout(300);
    const afterReset = await collectFormatSnapshot(session.page);
    assert.ok(
      !hasVisibleLearnerStateChange(baseline, afterReset),
      'Expected reset to restore the baseline learner-visible state before autoplay replay'
    );

    const goldenPathRan = await runRuntimeGoldenPath(session.page);
    assert.equal(goldenPathRan, true, 'Expected runtime golden path to be available');
    const afterAutoplay = await collectFormatSnapshot(session.page);
    const afterAutoplayState = await readRuntimeState(session.page);

    assert.ok(hasVisibleLearnerStateChange(baseline, afterAutoplay), 'Expected autoplay to change the learner-visible state after reset');
    assert.ok(
      hasMeaningfulRuntimeProgression(baselineState, afterAutoplayState),
      `Expected autoplay to advance runtime state after reset: before=${JSON.stringify(baselineState)} after=${JSON.stringify(afterAutoplayState)}`
    );
  } finally {
    await session.close();
  }
});

test('courseware manual drag works under file:// without runtime errors', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml, openMode: 'file', timeoutMs: 25000 });
  try {
    const before = await collectFormatSnapshot(session.page);
    const beforeState = await readRuntimeState(session.page);

    if (!before.runtimeApi.supportsManualPath) {
      return;
    }

    const manualRan = await runRuntimeManualPath(session.page, 'H2');
    assert.equal(manualRan, true, 'Expected runtime manual path to be available');

    const after = await collectFormatSnapshot(session.page);
    const afterState = await readRuntimeState(session.page);

    // Some standalone outputs may not implement a true pointer-driven manual drag.
    // This regression test focuses on ensuring manual-path execution does not cause runtime errors.
    // If the scene does implement manual interaction, it should still advance visible learner state.
    if (hasVisibleLearnerStateChange(before, after)) {
      assert.ok(
        hasMeaningfulRuntimeProgression(beforeState, afterState),
        `Expected manual drag to advance runtime state: before=${JSON.stringify(beforeState)} after=${JSON.stringify(afterState)}`
      );
    }

    const { consoleMessages, pageErrors } = session.getMessages();
    assert.equal(pageErrors.length, 0, `Unexpected page errors: ${JSON.stringify(pageErrors, null, 2)}`);

    const severeConsoleErrors = consoleMessages.filter((entry) => entry.type === 'error');
    assert.equal(severeConsoleErrors.length, 0, `Unexpected console errors: ${JSON.stringify(severeConsoleErrors, null, 2)}`);
  } finally {
    await session.close();
  }
});

test('assembled output reset returns to baseline and autoplay still works afterward', async () => {
  const session = await openCoursewarePage({ htmlPath: targetHtml, timeoutMs: 25000 });
  try {
    const baseline = await collectFormatSnapshot(session.page);

    await session.page.click('[data-action="autoplay"], button[data-action="autoplay"], #pourBtn');
    await session.page.waitForTimeout(2600);
    const afterAutoplay = await collectFormatSnapshot(session.page);

    assert.notEqual(afterAutoplay.statusText, baseline.statusText, 'Expected autoplay to change the assembled output status text');
    assert.notEqual(afterAutoplay.statusSub, baseline.statusSub, 'Expected autoplay to change the assembled output status subtext');

    await session.page.click('[data-action="reset"], button[data-action="reset"], #resetBtn');
    await session.page.waitForTimeout(200);
    const afterReset = await collectFormatSnapshot(session.page);

    assert.equal(afterReset.statusText, baseline.statusText, 'Expected reset to restore the baseline status text');
    assert.equal(afterReset.statusSub, baseline.statusSub, 'Expected reset to restore the baseline status subtext');
    assert.equal(afterReset.bodyText, baseline.bodyText, 'Expected reset to restore the baseline learner-facing text');

    await session.page.click('[data-action="autoplay"], button[data-action="autoplay"], #pourBtn');
    await session.page.waitForTimeout(2600);
    const afterReplay = await collectFormatSnapshot(session.page);

    assert.notEqual(afterReplay.statusText, baseline.statusText, 'Expected autoplay to work after reset');
    assert.notEqual(afterReplay.statusSub, baseline.statusSub, 'Expected autoplay subtext to work after reset');
  } finally {
    await session.close();
  }
});
