import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeSemanticDraft,
  validateSemanticDraft,
} from '../lib/contracts/semantic-draft.js';

test('validateSemanticDraft accepts a minimal experiment draft', () => {
  const draft = {
    kind: 'experiment',
    topic: 'Giấy quỳ tím thử axit và bazơ',
    level: 'THCS',
    skill: 'chem-3d-experiment',
    language: 'vi',
    renderMode: 'threejs',
    scene: {
      apparatus: ['litmus-paper', 'beaker'],
      cameraPreset: 'bench-3qtr',
      themeVersion: 'chem-lab-v1',
    },
    interaction: {
      primaryMode: 'direct-manipulation',
      goldenPath: ['pick-litmus', 'touch-solution'],
      resetRequired: true,
      autoplayRequired: true,
    },
    verification: {
      requiresFormat: true,
      requiresSmoke: true,
      requiresCanvas: true,
      requiresInteraction: true,
      requiresVisibility: true,
      requiresOffline: true,
    },
  };

  const normalized = normalizeSemanticDraft(draft);
  assert.equal(validateSemanticDraft(normalized).ok, true);
});

test('validateSemanticDraft rejects missing required verify gates', () => {
  const result = validateSemanticDraft({
    kind: 'experiment',
    topic: 'x',
    level: 'THCS',
    skill: 'chem-3d-experiment',
    language: 'vi',
    renderMode: 'threejs',
    scene: {
      apparatus: [],
      cameraPreset: 'bench-3qtr',
      themeVersion: 'chem-lab-v1',
    },
    interaction: {
      primaryMode: 'direct-manipulation',
      goldenPath: [],
      resetRequired: true,
      autoplayRequired: true,
    },
    verification: {
      requiresFormat: true,
      requiresSmoke: true,
      requiresCanvas: true,
      requiresInteraction: true,
      requiresVisibility: true,
    },
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => /requiresOffline/.test(error)),
    `Expected requiresOffline error, got: ${JSON.stringify(result.errors)}`
  );
});
