import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/pw-interaction-golden-path.mjs <html-path>');
  process.exit(1);
}

async function runCase(name, actions, options = {}) {
  const result = await runPlaywrightPage({
    htmlPath: path.resolve(htmlPath),
    actions,
    timeoutMs: 25000,
  });

  const interactionAvailable = result.canvasFound && result.buttonSelectors.reset > 0;
  const stateChanged = result.statusTextChanged || result.statusSubChanged || result.hudChanged;
  const verifierMeta = result.coursewareApiMeta;
  const expectedPhase = verifierMeta?.successPhase;
  const defaultPassedPhase = result.pageState?.phase && result.pageState.phase !== 'idle' && result.pageState.phase !== 'result';
  const reactionStarted = expectedPhase
    ? result.pageState?.phase === expectedPhase
    : Boolean(result.pageState?.activeSampleId === 'Li' && defaultPassedPhase);
  const missedDrop = verifierMeta?.failureStatusText
    ? result.statusTextAfter === verifierMeta.failureStatusText
    : result.statusTextAfter === 'Thả chưa đúng vị trí';
  const skippedDueToWebgl = interactionAvailable && !reactionStarted && result.webglCreationFailed;
  const passed = interactionAvailable && stateChanged && reactionStarted && !missedDrop;

  return {
    name,
    interactionAvailable,
    stateChanged,
    reactionStarted,
    missedDrop,
    skippedDueToWebgl,
    passed,
    statusTextBefore: result.statusTextBefore,
    statusTextAfter: result.statusTextAfter,
    statusSubBefore: result.statusSubBefore,
    statusSubAfter: result.statusSubAfter,
    pageState: result.pageState,
    verifierMeta,
    webglCreationFailed: result.webglCreationFailed,
    options,
  };
}

const detection = await runPlaywrightPage({
  htmlPath: path.resolve(htmlPath),
  timeoutMs: 12000,
});

const cases = detection.coursewareApiMeta?.supportsGoldenPath
  ? await Promise.all([
      runCase('courseware-golden-path', [
        { type: 'runGoldenPathFromPageApi', afterMs: 1800 },
      ], { mode: 'courseware-api' }),
    ])
  : await Promise.all([
      runCase('jar-drag', [
        { type: 'dragFromPageApi', sampleId: 'Li', afterMs: 1800 },
      ], { mode: 'flame-test-fallback' }),
      runCase('wire-drag', [
        { type: 'dragWireFromPageApi', sampleId: 'Li', afterMs: 1800 },
      ], { mode: 'flame-test-fallback' }),
    ]);

const failedCase = cases.find((entry) => !entry.passed);
if (failedCase) {
  console.error(JSON.stringify({
    check: 'pw-interaction-golden-path',
    htmlPath: path.resolve(htmlPath),
    failedCase,
    cases,
  }, null, 2));
  process.exit(failedCase.skippedDueToWebgl ? 2 : 1);
}

console.log(JSON.stringify({
  check: 'pw-interaction-golden-path',
  htmlPath: path.resolve(htmlPath),
  passed: true,
  cases,
}, null, 2));

process.exit(0);
