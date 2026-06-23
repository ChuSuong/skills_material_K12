import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export const APPARATUS_THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export { normalizeCapabilities, hasCapabilities } from './capabilities.js';
export { normalizeContract, makeContract } from './contract.js';
export { ApparatusContractRegistry, defaultApparatusContractRegistry } from './registry.js';
export {
  clamp,
  makeAnchor,
  getAnchorWorld,
  getApparatusId,
  composeApparatus,
} from './core/anchors.js';
export {
  computeCylinderLiquidMetrics,
  setCylinderLiquidLevel,
  createCylinderLiquidController,
} from './core/liquids.js';
export {
  validatePourAlignment,
  validateFillLevel,
  validateEffectContainment,
  validateVisibility,
  runApparatusValidators,
  createSceneValidatorGate,
} from './core/validation.js';

export { THREE };
