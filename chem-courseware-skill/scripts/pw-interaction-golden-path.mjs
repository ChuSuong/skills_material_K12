import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/pw-interaction-golden-path.mjs <html-path>');
  process.exit(1);
}

async function runCase(name, actions) {
  const result = await runPlaywrightPage({
    htmlPath: path.resolve(htmlPath),
    actions,
    timeoutMs: 25000,
  });

  const interactionAvailable = result.canvasFound && result.buttonSelectors.reset > 0;
  const stateChanged = result.statusTextChanged || result.statusSubChanged || result.hudChanged;
  const reactionStarted = Boolean(result.pageState?.activeSampleId === 'Li' && result.pageState?.phase && result.pageState.phase !== 'idle' && result.pageState.phase !== 'result');
  const missedDrop = result.statusTextAfter === 'Thả chưa đúng vị trí';
  const skippedDueToWebgl = interactionAvailable && !reactionStarted && result.webglCreationFailed;
  const passed = interactionAvailable && reactionStarted && !missedDrop;

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
    webglCreationFailed: result.webglCreationFailed,
  };
}

const cases = await Promise.all([
  runCase('jar-drag', [
    { type: 'dragFromPageApi', sampleId: 'Li', afterMs: 1800 },
  ]),
  runCase('wire-drag', [
    { type: 'dragWireFromPageApi', sampleId: 'Li', afterMs: 1800 },
  ]),
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
