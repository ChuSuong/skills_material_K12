import { registerApparatusPreset } from './registry.js';
import { createBeakerApparatus } from './presets/beaker.js';
import { createBottleApparatus, createReagentBottleApparatus } from './presets/bottle.js';
import { createErlenmeyerApparatus } from './presets/erlenmeyer.js';
import { createTestTubeApparatus } from './presets/test-tube.js';
import { createDropperApparatus } from './presets/dropper.js';
import { createAlcoholBurnerApparatus } from './presets/alcohol-burner.js';
import { createSolidReagentJarApparatus } from './presets/solid-reagent-jar.js';
import { createLitmusPaperApparatus } from './presets/litmus-paper.js';
import { createFunnelApparatus } from './presets/funnel.js';

export {
  createBeakerApparatus,
  createBottleApparatus,
  createReagentBottleApparatus,
  createErlenmeyerApparatus,
  createTestTubeApparatus,
  createDropperApparatus,
  createAlcoholBurnerApparatus,
  createSolidReagentJarApparatus,
  createLitmusPaperApparatus,
  createFunnelApparatus,
};

const presetDefinitions = [
  {
    key: 'beaker',
    family: 'open-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor'],
    create: createBeakerApparatus,
  },
  {
    key: 'bottle',
    family: 'transfer-tool',
    capabilities: ['liquid-container', 'transfer-source', 'grip-point', 'label-anchor'],
    create: createBottleApparatus,
  },
  {
    key: 'reagent-bottle',
    family: 'transfer-tool',
    capabilities: ['liquid-container', 'transfer-source', 'grip-point', 'label-anchor'],
    create: createReagentBottleApparatus,
  },
  {
    key: 'erlenmeyer',
    family: 'narrow-neck-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor'],
    create: createErlenmeyerApparatus,
  },
  {
    key: 'test-tube',
    family: 'heated-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor'],
    create: createTestTubeApparatus,
  },
  {
    key: 'dropper',
    family: 'transfer-tool',
    capabilities: ['transfer-source', 'grip-point', 'label-anchor'],
    create: createDropperApparatus,
  },
  {
    key: 'alcohol-burner',
    family: 'heat-source',
    capabilities: ['heat-source', 'effect-origin', 'label-anchor'],
    create: createAlcoholBurnerApparatus,
  },
  {
    key: 'solid-reagent-jar',
    family: 'solid-reagent-container',
    capabilities: ['solid-fill', 'scoop-target', 'transfer-source', 'grip-point', 'effect-origin', 'label-anchor'],
    create: createSolidReagentJarApparatus,
  },
  {
    key: 'litmus-paper',
    family: 'indicator-tool',
    capabilities: ['indicator-contact', 'grip-point', 'label-anchor'],
    create: createLitmusPaperApparatus,
  },
  {
    key: 'funnel',
    family: 'transfer-tool',
    capabilities: ['pour-target', 'transfer-source', 'label-anchor'],
    create: createFunnelApparatus,
  },
];

export const APPARATUS_PRESET_DEFINITIONS = presetDefinitions;

export function listRegisteredApparatusPresets() {
  return presetDefinitions.slice();
}

export function getRegisteredApparatusPresetDefinition(key) {
  return presetDefinitions.find((definition) => definition.key === key) ?? null;
}

export function ensureDefaultApparatusPresetsRegistered() {
  for (const definition of presetDefinitions) {
    registerApparatusPreset(definition);
  }
  return presetDefinitions.slice();
}

ensureDefaultApparatusPresetsRegistered();
