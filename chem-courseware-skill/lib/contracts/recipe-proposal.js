import { validateRecipeDefinition } from './recipe.js';

export function normalizePatternCatalog(catalog = {}) {
  return {
    ...catalog,
    version: catalog.version ?? 1,
    patterns: Array.isArray(catalog.patterns) ? catalog.patterns : [],
  };
}

export function normalizeRecipeProposal(proposal = {}) {
  return {
    ...proposal,
    kind: proposal.kind || 'recipe-proposal',
    status: proposal.status || 'needs-builder',
    referenceCases: Array.isArray(proposal.referenceCases) ? proposal.referenceCases : [],
    builder: {
      supported: false,
      ...(proposal.builder || {}),
    },
    verification: {
      validateOnly: true,
      mustNotGenerateHtml: true,
      ...(proposal.verification || {}),
    },
  };
}

function ids(items = []) {
  return items.map((item) => item?.id).filter(Boolean);
}

function findPattern(catalog, patternId) {
  return normalizePatternCatalog(catalog).patterns.find((pattern) => pattern.id === patternId) ?? null;
}

function stepTypes(recipe) {
  return new Set((recipe?.steps || []).map((step) => step?.type).filter(Boolean));
}

export function validatePatternCatalog(input = {}) {
  const catalog = normalizePatternCatalog(input);
  const errors = [];
  const seenIds = new Set();

  if (!Number.isInteger(catalog.version) || catalog.version < 1) {
    errors.push('pattern catalog version must be a positive integer');
  }
  if (catalog.patterns.length === 0) {
    errors.push('pattern catalog must contain patterns');
  }

  catalog.patterns.forEach((pattern, index) => {
    const prefix = `patterns[${index}]`;
    if (!pattern?.id) {
      errors.push(`${prefix}.id is required`);
    } else if (seenIds.has(pattern.id)) {
      errors.push(`${prefix}.id must be unique`);
    } else {
      seenIds.add(pattern.id);
    }
    if (!pattern?.description) errors.push(`${prefix}.description is required`);
    if (!Array.isArray(pattern?.referenceCases) || pattern.referenceCases.length === 0) {
      errors.push(`${prefix}.referenceCases must be non-empty`);
    }
    if (!pattern?.interaction) errors.push(`${prefix}.interaction is required`);
    if (!Array.isArray(pattern?.requiredStepTypes) || pattern.requiredStepTypes.length === 0) {
      errors.push(`${prefix}.requiredStepTypes must be non-empty`);
    }
    if (!pattern?.recipeSkeleton) {
      errors.push(`${prefix}.recipeSkeleton is required`);
    } else {
      const recipeResult = validateRecipeDefinition({
        id: `${pattern.id}-skeleton`,
        ...pattern.recipeSkeleton,
      });
      if (!recipeResult.ok) {
        errors.push(`${prefix}.recipeSkeleton invalid: ${recipeResult.errors.join(', ')}`);
      } else {
        const actualStepTypes = stepTypes(recipeResult.recipe);
        for (const requiredType of pattern.requiredStepTypes || []) {
          if (!actualStepTypes.has(requiredType)) {
            errors.push(`${prefix}.recipeSkeleton missing required step type: ${requiredType}`);
          }
        }
      }
    }
  });

  return { ok: errors.length === 0, errors, catalog };
}

export function validateRecipeProposal(input = {}, { patternCatalog = null } = {}) {
  const proposal = normalizeRecipeProposal(input);
  const errors = [];
  const catalog = patternCatalog ? normalizePatternCatalog(patternCatalog) : null;
  const matchedPattern = catalog ? findPattern(catalog, proposal.matchedPattern) : null;

  if (proposal.kind !== 'recipe-proposal') errors.push('kind must be recipe-proposal');
  if (proposal.status !== 'needs-builder') errors.push('status must be needs-builder');
  if (!proposal.topic) errors.push('topic is required');
  if (!proposal.level) errors.push('level is required');
  if (!proposal.language) errors.push('language is required');
  if (!proposal.matchedPattern) errors.push('matchedPattern is required');
  if (proposal.referenceCases.length === 0) errors.push('referenceCases must be non-empty');
  if (proposal.builder.supported !== false) errors.push('builder.supported must be false for proposals');
  if (proposal.verification.validateOnly !== true) errors.push('verification.validateOnly must be true');
  if (proposal.verification.mustNotGenerateHtml !== true) errors.push('verification.mustNotGenerateHtml must be true');

  if (catalog && !matchedPattern) {
    errors.push(`matchedPattern not found in pattern catalog: ${proposal.matchedPattern}`);
  }

  const recipeResult = validateRecipeDefinition(proposal.proposedRecipe || {});
  if (!recipeResult.ok) {
    errors.push(`proposedRecipe invalid: ${recipeResult.errors.join(', ')}`);
  } else if (matchedPattern) {
    if (recipeResult.recipe.interaction !== matchedPattern.interaction) {
      errors.push(`proposedRecipe.interaction must match pattern interaction: ${matchedPattern.interaction}`);
    }

    const actualStepTypes = stepTypes(recipeResult.recipe);
    for (const requiredType of matchedPattern.requiredStepTypes || []) {
      if (!actualStepTypes.has(requiredType)) {
        errors.push(`proposedRecipe.steps missing required step type: ${requiredType}`);
      }
    }

    const overlapsReference = proposal.referenceCases.some((caseId) => matchedPattern.referenceCases.includes(caseId));
    if (!overlapsReference) {
      errors.push('referenceCases must include at least one case from the matched pattern');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    proposal,
    pattern: matchedPattern,
    proposedRecipe: recipeResult.recipe,
  };
}

export function listPatternIds(catalog = {}) {
  return ids(normalizePatternCatalog(catalog).patterns);
}
