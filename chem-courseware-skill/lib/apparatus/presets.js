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
import { createIronNailApparatus } from './presets/iron-nail.js';
import { createCopperPieceApparatus } from './presets/copper-piece.js';
import { createGasGeneratorApparatus } from './presets/gas-generator.js';
import { createGasDeliveryTubeApparatus } from './presets/gas-delivery-tube.js';

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
  createIronNailApparatus,
  createCopperPieceApparatus,
  createGasGeneratorApparatus,
  createGasDeliveryTubeApparatus,
};

const presetDefinitions = [
  {
    key: 'beaker',
    kind: 'beaker',
    family: 'open-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'pourTarget', 'steamOrigin', 'heatZone'],
    interactionMode: 'manual-placement',
    create: createBeakerApparatus,
  },
  {
    key: 'bottle',
    kind: 'bottle',
    family: 'transfer-tool',
    capabilities: ['liquid-container', 'transfer-source', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'pourAlign', 'nozzle'],
    interactionMode: 'manual-placement',
    create: createBottleApparatus,
  },
  {
    key: 'reagent-bottle',
    kind: 'reagent-bottle',
    family: 'transfer-tool',
    capabilities: ['liquid-container', 'transfer-source', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'pourAlign', 'nozzle'],
    interactionMode: 'manual-placement',
    create: createReagentBottleApparatus,
  },
  {
    key: 'erlenmeyer',
    kind: 'erlenmeyer',
    family: 'narrow-neck-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'pourTarget'],
    interactionMode: 'manual-placement',
    create: createErlenmeyerApparatus,
  },
  {
    key: 'test-tube',
    kind: 'test-tube',
    family: 'heated-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'pourTarget'],
    interactionMode: 'manual-placement',
    create: createTestTubeApparatus,
  },
  {
    key: 'dropper',
    kind: 'dropper',
    family: 'transfer-tool',
    capabilities: ['transfer-source', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'tipAnchor', 'interactionZone', 'nozzle'],
    interactionMode: 'manual-placement',
    create: createDropperApparatus,
  },
  {
    key: 'alcohol-burner',
    kind: 'alcohol-burner',
    family: 'heat-source',
    capabilities: ['heat-source', 'effect-origin', 'label-anchor', 'interaction-anchor', 'ignition-contact', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'ignitionTip', 'heatZone', 'flameOrigin'],
    interactionMode: 'manual-placement',
    create: createAlcoholBurnerApparatus,
  },
  {
    key: 'solid-reagent-jar',
    kind: 'solid-reagent-jar',
    family: 'solid-reagent-container',
    capabilities: ['solid-fill', 'scoop-target', 'transfer-source', 'grip-point', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'dropAnchor', 'scoopTarget'],
    interactionMode: 'manual-placement',
    create: createSolidReagentJarApparatus,
  },
  {
    key: 'litmus-paper',
    kind: 'litmus-paper',
    family: 'indicator-tool',
    capabilities: ['indicator-contact', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'tipAnchor', 'sampleZone'],
    interactionMode: 'manual-placement',
    create: createLitmusPaperApparatus,
  },
  {
    key: 'funnel',
    kind: 'funnel',
    family: 'transfer-tool',
    capabilities: ['pour-target', 'transfer-source', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'entry', 'exit', 'nozzle'],
    interactionMode: 'manual-placement',
    create: createFunnelApparatus,
  },
  {
    key: 'iron-nail',
    kind: 'iron-nail',
    family: 'solid-metal-sample',
    capabilities: ['solid-sample', 'metal-sample', 'indicator-contact', 'grip-point', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'tipAnchor', 'sampleZone', 'interactionZone', 'effectOrigin'],
    interactionMode: 'manual-placement',
    create: createIronNailApparatus,
  },
  {
    key: 'copper-piece',
    kind: 'copper-piece',
    family: 'solid-metal-sample',
    capabilities: ['solid-sample', 'metal-sample', 'grip-point', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'labelAnchor'],
    interactionMode: 'manual-placement',
    create: createCopperPieceApparatus,
  },
  {
    key: 'gas-generator',
    kind: 'gas-generator',
    family: 'gas-source',
    capabilities: ['gas-source', 'gas-outlet', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'outletAnchor', 'gasOutlet'],
    interactionMode: 'manual-placement',
    create: createGasGeneratorApparatus,
  },
  {
    key: 'gas-delivery-tube',
    kind: 'gas-delivery-tube',
    family: 'gas-transfer-tool',
    capabilities: ['gas-transfer', 'transfer-source', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'inletAnchor', 'outletAnchor', 'tipAnchor'],
    interactionMode: 'manual-placement',
    create: createGasDeliveryTubeApparatus,
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
