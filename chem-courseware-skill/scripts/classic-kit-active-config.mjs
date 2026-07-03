export const ACTIVE_CLASSIC_RECIPE_IDS = [
  'zinc-copper-hcl-compare',
  'hcl-nahco3-gas-release',
  'halogen-halide-displacement-compare',
  'moist-chlorine-bleaches-colored-paper',
  'agno3-halide-identification',
];

export const ACTIVE_CLASSIC_APPARATUS_EXPORTS = [
  'THREE',
  'APPARATUS_THREE_CDN',
  'clamp',
  'makeAnchor',
  'getAnchorWorld',
  'getApparatusId',
  'composeApparatus',
  'computeCylinderLiquidMetrics',
  'setCylinderLiquidLevel',
  'createCylinderLiquidController',
  'clearWater',
  'diluteAcid',
  'createClassicTestTubeApparatus',
  'createClassicSolidReagentJarApparatus',
  'createClassicCopperPieceApparatus',
  'createClassicReagentBottleApparatus',
  'createZincGranulesApparatus',
  'createClassicErlenmeyerApparatus',
  'createClassicMoistPaperApparatus',
];

export const ACTIVE_CLASSIC_PRESET_KEYS = [
  'classic-test-tube',
  'classic-reagent-bottle',
  'classic-solid-reagent-jar',
  'classic-copper-piece',
  'zinc-granules',
  'classic-erlenmeyer',
  'classic-moist-paper',
];

export function isActiveClassicRecipeId(recipeId = '') {
  return ACTIVE_CLASSIC_RECIPE_IDS.includes(String(recipeId || ''));
}
