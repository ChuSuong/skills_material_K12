import path from 'node:path';
import { runPlaywrightPage } from './pw-browser-utils.mjs';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/pw-courseware-contract-smoke.mjs <html-path>');
  process.exit(1);
}

function hasStepType(stepContract, type) {
  return Array.isArray(stepContract?.steps)
    && stepContract.steps.some((step) => step?.type === type);
}

const result = await runPlaywrightPage({
  htmlPath: path.resolve(htmlPath),
  timeoutMs: 20000,
});

const errors = [];
const meta = result.coursewareApiMeta;
const capabilities = result.coursewareApiCapabilities;
const stepContract = result.coursewareApiStepContract;

if (!result.canvasFound) {
  errors.push('canvas is missing');
}
if (result.buttonSelectors.autoplay < 1) {
  errors.push('autoplay control is missing');
}
if (result.buttonSelectors.reset < 1) {
  errors.push('reset control is missing');
}
if (!meta?.supportsGoldenPath) {
  errors.push('courseware test API must expose supportsGoldenPath');
}
if (!meta?.successPhase) {
  errors.push('courseware verifier meta must expose successPhase');
}
if (capabilities?.source !== 'recipe-scene-builder') {
  errors.push('recipe courseware must report source=recipe-scene-builder');
}
if (!Array.isArray(capabilities?.steps) || capabilities.steps.length === 0) {
  errors.push('courseware capabilities must expose non-empty steps');
}
if (/free-drag/.test(capabilities?.interaction || '') && (!Array.isArray(capabilities?.draggables) || capabilities.draggables.length === 0)) {
  errors.push('free-drag recipe must expose at least one draggable');
}
if (!Array.isArray(stepContract?.steps) || stepContract.steps.length === 0) {
  errors.push('courseware must expose non-empty recipe step contract');
}
if (!Array.isArray(capabilities?.resultSustainEffects)) {
  errors.push('courseware capabilities must expose resultSustainEffects');
}
if (!Array.isArray(stepContract?.resultSustainEffects)) {
  errors.push('courseware step contract must expose resultSustainEffects');
}
if (/free-drag/.test(stepContract?.interaction || '') && !(
  hasStepType(stepContract, 'drag-drop-anchor')
    || hasStepType(stepContract, 'drag-pour-anchor')
    || hasStepType(stepContract, 'drag-heat-anchor')
)) {
  errors.push('free-drag recipe step contract must include a drag/pour/heat anchor step');
}
if (!hasStepType(stepContract, 'reaction-progress')) {
  errors.push('recipe step contract must include reaction-progress step');
}

if (errors.length > 0) {
  console.error(JSON.stringify({
    check: 'pw-courseware-contract-smoke',
    htmlPath: path.resolve(htmlPath),
    passed: false,
    errors,
    meta,
    capabilities,
    stepContract,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  check: 'pw-courseware-contract-smoke',
  htmlPath: path.resolve(htmlPath),
  passed: true,
  meta,
  capabilities,
  stepContract,
}, null, 2));

process.exit(0);
