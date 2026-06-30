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
import { createTestTubeRackApparatus } from './presets/test-tube-rack.js';
import { createGlassStirringRodApparatus } from './presets/glass-stirring-rod.js';
import { createSpatulaApparatus } from './presets/spatula.js';
import { createTripodGauzeApparatus } from './presets/tripod-gauze.js';
import { createEvaporatingDishApparatus } from './presets/evaporating-dish.js';
import { createRoundBottomFlaskApparatus } from './presets/round-bottom-flask.js';
import { createWatchGlassApparatus } from './presets/watch-glass.js';
import { createFilterPaperApparatus } from './presets/filter-paper.js';
import { createGasJarApparatus } from './presets/gas-jar.js';
import { createRetortStandClampApparatus } from './presets/retort-stand-clamp.js';
import { createElectrodePairApparatus } from './presets/electrode-pair.js';
import { createDcPowerSupplyApparatus } from './presets/dc-power-supply.js';

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
  createTestTubeRackApparatus,
  createGlassStirringRodApparatus,
  createSpatulaApparatus,
  createTripodGauzeApparatus,
  createEvaporatingDishApparatus,
  createRoundBottomFlaskApparatus,
  createWatchGlassApparatus,
  createFilterPaperApparatus,
  createGasJarApparatus,
  createRetortStandClampApparatus,
  createElectrodePairApparatus,
  createDcPowerSupplyApparatus,
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
  {
    key: 'test-tube-rack',
    kind: 'test-tube-rack',
    family: 'support-holder',
    capabilities: ['support-target', 'tube-holder', 'slot-layout', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'dropZone', 'supportPlane'],
    interactionMode: 'manual-placement',
    create: createTestTubeRackApparatus,
    meta: { defaultSlots: 6, dynamicAnchors: 'slot0..slotN-1' },
  },
  {
    key: 'glass-stirring-rod',
    kind: 'glass-stirring-rod',
    family: 'mixing-tool',
    capabilities: ['mixing-tool', 'indicator-contact', 'grip-point', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'tipAnchor', 'sampleZone', 'stirPathCenter', 'interactionZone'],
    interactionMode: 'manual-placement',
    create: createGlassStirringRodApparatus,
  },
  {
    key: 'spatula',
    kind: 'spatula',
    family: 'solid-transfer-tool',
    capabilities: ['solid-transfer', 'scoop-source', 'scoop-target', 'transfer-source', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'scoopBowl', 'tipAnchor', 'dropAnchor', 'interactionZone'],
    interactionMode: 'manual-placement',
    create: createSpatulaApparatus,
  },
  {
    key: 'tripod-gauze',
    kind: 'tripod-gauze',
    family: 'heat-support',
    capabilities: ['support-target', 'heat-support', 'vessel-seat', 'heat-zone', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'supportPlane', 'vesselSeat', 'burnerAlign', 'heatZone'],
    interactionMode: 'manual-placement',
    create: createTripodGauzeApparatus,
  },
  {
    key: 'evaporating-dish',
    kind: 'evaporating-dish',
    family: 'heated-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'pourTarget', 'steamOrigin', 'heatZone'],
    interactionMode: 'manual-placement',
    create: createEvaporatingDishApparatus,
  },
  {
    key: 'round-bottom-flask',
    kind: 'round-bottom-flask',
    family: 'narrow-neck-vessel',
    capabilities: ['liquid-container', 'pour-target', 'heatable', 'steam-origin', 'effect-origin', 'label-anchor', 'interaction-anchor', 'overlap-target', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'pourTarget', 'steamOrigin', 'heatZone'],
    interactionMode: 'manual-placement',
    create: createRoundBottomFlaskApparatus,
  },
  {
    key: 'watch-glass',
    kind: 'watch-glass',
    family: 'sample-dish',
    capabilities: ['sample-holder', 'evaporation-surface', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'sampleZone', 'effectOrigin'],
    interactionMode: 'manual-placement',
    create: createWatchGlassApparatus,
  },
  {
    key: 'filter-paper',
    kind: 'filter-paper',
    family: 'separation-tool',
    capabilities: ['filter-medium', 'pour-target', 'transfer-source', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'pourTarget', 'entry', 'exit', 'nozzle', 'filtrateDrop'],
    interactionMode: 'manual-placement',
    create: createFilterPaperApparatus,
  },
  {
    key: 'gas-jar',
    kind: 'gas-jar',
    family: 'gas-collection-vessel',
    capabilities: ['gas-container', 'gas-collection-target', 'gas-inlet', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'mouth', 'gasInlet', 'gasVolume', 'effectOrigin'],
    interactionMode: 'manual-placement',
    create: createGasJarApparatus,
  },
  {
    key: 'retort-stand-clamp',
    kind: 'retort-stand-clamp',
    family: 'support-holder',
    capabilities: ['support-target', 'clamp-holder', 'vessel-holder', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'clampCenter', 'supportPlane', 'baseCenter'],
    interactionMode: 'manual-placement',
    create: createRetortStandClampApparatus,
  },
  {
    key: 'electrode-pair',
    kind: 'electrode-pair',
    family: 'electrolysis-tool',
    capabilities: ['electrode-pair', 'cathode', 'anode', 'gas-evolution-origin', 'effect-origin', 'grip-point', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'cathodeTip', 'anodeTip', 'cathodeBubbleOrigin', 'anodeBubbleOrigin', 'cathodeTerminal', 'anodeTerminal'],
    interactionMode: 'manual-placement',
    create: createElectrodePairApparatus,
  },
  {
    key: 'dc-power-supply',
    kind: 'dc-power-supply',
    family: 'power-source',
    capabilities: ['power-source', 'dc-source', 'positive-terminal', 'negative-terminal', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    interactionAnchors: ['gripAnchor', 'interactionZone', 'positiveTerminal', 'negativeTerminal', 'wireExit'],
    interactionMode: 'manual-placement',
    create: createDcPowerSupplyApparatus,
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
