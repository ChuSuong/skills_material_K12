export function normalizeRecipeDefinition(recipe = {}) {
  return {
    ...recipe,
    requiredApparatus: Array.isArray(recipe.requiredApparatus) ? recipe.requiredApparatus : [],
    effects: Array.isArray(recipe.effects) ? recipe.effects : [],
    resultSustainEffects: Array.isArray(recipe.resultSustainEffects) ? recipe.resultSustainEffects : null,
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    verifier: recipe.verifier || 'run-reaction-golden-path',
  };
}

const STEP_TYPES = new Set([
  'drag-drop-anchor',
  'drag-pour-anchor',
  'drag-heat-anchor',
  'reaction-progress',
  'observe-result',
]);

const DRAG_STEP_TYPES = new Set([
  'drag-drop-anchor',
  'drag-pour-anchor',
  'drag-heat-anchor',
]);

const REQUIRED_SUSTAIN_EFFECTS = new Set([
  'flame-plume',
  'steam-field',
]);

function parseAnchorRef(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const [apparatus, anchor, ...rest] = value.split('.');
  if (!apparatus || !anchor || rest.length > 0) {
    return null;
  }
  return { apparatus, anchor };
}

export function validateRecipeDefinition(input = {}) {
  const recipe = normalizeRecipeDefinition(input);
  const errors = [];
  const requiredApparatus = new Set(recipe.requiredApparatus);
  const stepIds = new Set();

  if (!recipe.id) errors.push('recipe.id is required');
  if (!recipe.theme) errors.push('recipe.theme is required');
  if (!recipe.cameraPreset) errors.push('recipe.cameraPreset is required');
  if (recipe.requiredApparatus.length === 0) errors.push('recipe.requiredApparatus must be non-empty');
  if (!recipe.interaction) errors.push('recipe.interaction is required');
  if (!recipe.reaction) errors.push('recipe.reaction is required');
  if (recipe.effects.length === 0) errors.push('recipe.effects must be non-empty');
  if (!Array.isArray(recipe.resultSustainEffects)) {
    errors.push('recipe.resultSustainEffects must be an array');
  }
  if (!recipe.verifier) errors.push('recipe.verifier is required');
  if (recipe.steps.length === 0) errors.push('recipe.steps must be non-empty');

  if (Array.isArray(recipe.resultSustainEffects)) {
    const effects = new Set(recipe.effects);
    for (const effect of recipe.resultSustainEffects) {
      if (!effects.has(effect)) {
        errors.push(`recipe.resultSustainEffects uses effect not listed in recipe.effects: ${effect}`);
      }
    }
    for (const effect of recipe.effects) {
      if (REQUIRED_SUSTAIN_EFFECTS.has(effect) && !recipe.resultSustainEffects.includes(effect)) {
        errors.push(`recipe.resultSustainEffects must include ${effect} when recipe.effects includes it`);
      }
    }
  }

  recipe.steps.forEach((step, index) => {
    const prefix = `recipe.steps[${index}]`;
    if (!step || typeof step !== 'object') {
      errors.push(`${prefix} must be an object`);
      return;
    }

    if (!step.id) {
      errors.push(`${prefix}.id is required`);
    } else if (stepIds.has(step.id)) {
      errors.push(`${prefix}.id must be unique`);
    } else {
      stepIds.add(step.id);
    }

    if (!STEP_TYPES.has(step.type)) {
      errors.push(`${prefix}.type must be one of ${Array.from(STEP_TYPES).join(', ')}`);
    }

    if (DRAG_STEP_TYPES.has(step.type)) {
      for (const field of ['source', 'target']) {
        const ref = parseAnchorRef(step[field]);
        if (!ref) {
          errors.push(`${prefix}.${field} must use "apparatus.anchor"`);
        } else if (!requiredApparatus.has(ref.apparatus)) {
          errors.push(`${prefix}.${field} uses apparatus not listed in requiredApparatus: ${ref.apparatus}`);
        }
      }

      if (step.sourcePlacementAnchor) {
        const ref = parseAnchorRef(step.sourcePlacementAnchor);
        if (!ref) {
          errors.push(`${prefix}.sourcePlacementAnchor must use "apparatus.anchor"`);
        } else if (!requiredApparatus.has(ref.apparatus)) {
          errors.push(`${prefix}.sourcePlacementAnchor uses apparatus not listed in requiredApparatus: ${ref.apparatus}`);
        }
      }

      if (/free-drag/.test(recipe.interaction || '')) {
        if (!Number.isFinite(step.overlapPadding) || step.overlapPadding < 0) {
          errors.push(`${prefix}.overlapPadding must be a non-negative number for free-drag steps`);
        }
      }
    }

    if (step.type === 'reaction-progress') {
      if (!step.reaction) {
        errors.push(`${prefix}.reaction is required`);
      } else if (step.reaction !== recipe.reaction) {
        errors.push(`${prefix}.reaction must match recipe.reaction`);
      }
      if (!step.successPhase) {
        errors.push(`${prefix}.successPhase is required`);
      }
    }
  });

  return { ok: errors.length === 0, errors, recipe };
}
