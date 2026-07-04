import {
  COURSEWARE_KINDS,
  RENDER_MODES,
  PRIMARY_MODES,
  DEFAULT_HUD,
  DEFAULT_OUTPUT,
  DEFAULT_VERIFICATION,
} from './semantic-draft-types.js';

export function normalizeSemanticDraft(draft = {}) {
  const inputHud = draft.hud || {};
  return {
    ...draft,
    hud: {
      ...DEFAULT_HUD,
      ...inputHud,
      pedagogy: {
        ...DEFAULT_HUD.pedagogy,
        ...(inputHud.pedagogy || {}),
      },
    },
    output: {
      ...DEFAULT_OUTPUT,
      ...(draft.output || {}),
    },
    scene: draft.scene || {},
    interaction: draft.interaction || {},
    verification: {
      ...DEFAULT_VERIFICATION,
      ...(draft.verification || {}),
    },
  };
}

export function validateSemanticDraft(input = {}) {
  const draft = normalizeSemanticDraft(input);
  const errors = [];
  const inputVerification = input.verification || {};

  if (!COURSEWARE_KINDS.includes(draft.kind)) errors.push('kind is required');
  if (!draft.topic) errors.push('topic is required');
  if (!draft.level) errors.push('level is required');
  if (!draft.skill) errors.push('skill is required');
  if (!draft.language) errors.push('language is required');
  if (!RENDER_MODES.includes(draft.renderMode)) errors.push('renderMode is required');

  if (!Array.isArray(draft.hud.requiredSelectors)) errors.push('hud.requiredSelectors must be an array');
  if (draft.hud.requiredSelectors.length === 0) errors.push('hud.requiredSelectors must be non-empty');

  if (draft.output.selfContained !== true) errors.push('output.selfContained must be true');

  if (!PRIMARY_MODES.includes(draft.interaction.primaryMode)) errors.push('interaction.primaryMode is required');
  if (!Array.isArray(draft.interaction.goldenPath)) errors.push('interaction.goldenPath must be an array');
  if (draft.interaction.goldenPath.length === 0) errors.push('interaction.goldenPath must be non-empty');
  if (draft.interaction.resetRequired !== true) errors.push('interaction.resetRequired must be true');
  if (draft.interaction.autoplayRequired !== true) errors.push('interaction.autoplayRequired must be true');

  if (!Array.isArray(draft.scene.apparatus)) errors.push('scene.apparatus must be an array');
  if (!draft.scene.cameraPreset) errors.push('scene.cameraPreset is required');
  if (!draft.scene.themeVersion) errors.push('scene.themeVersion is required');

  for (const gate of [
    'requiresFormat',
    'requiresSmoke',
    'requiresCanvas',
    'requiresInteraction',
    'requiresVisibility',
    'requiresOffline',
  ]) {
    if (!Object.hasOwn(inputVerification, gate)) errors.push(`verification.${gate} is required`);
    if (draft.verification[gate] !== true) errors.push(`verification.${gate} must be true`);
  }

  return { ok: errors.length === 0, errors, draft };
}
