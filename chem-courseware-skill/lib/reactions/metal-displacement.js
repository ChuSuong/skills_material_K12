import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

export function createMetalDisplacementReaction({
  metalSample,
  solution,
  bubbleField = null,
  depositEffects = [],
  duration = 1.85,
  solutionFrom = 0x3f87df,
  solutionTo = 0xbfd8f5,
} = {}) {
  const fromColor = new THREE.Color(solutionFrom);
  const toColor = new THREE.Color(solutionTo);
  const scratch = new THREE.Color();
  const effectOrigin = new THREE.Vector3();

  return createReactionFlow({
    id: 'metal-displacement',
    duration,
    effects: [bubbleField, ...depositEffects].filter(Boolean),
    onUpdate({ state, dt, elapsed }) {
      const progress = state.progress;
      metalSample?.controllers?.setCopperCoating?.(progress);
      if (solution?.material?.color) {
        scratch.copy(fromColor).lerp(toColor, progress);
        solution.material.color.copy(scratch);
      }
      const source = metalSample?.anchors?.effectOrigin || metalSample?.group;
      if (typeof source?.getWorldPosition === 'function') {
        source.getWorldPosition(effectOrigin);
      } else if (source?.isVector3) {
        effectOrigin.copy(source);
      }
      bubbleField?.burst?.(effectOrigin, progress, dt);
      bubbleField?.update?.(dt, elapsed);
      for (const effect of depositEffects) {
        effect.setProgress?.(progress, elapsed, state);
      }
    },
    onReset() {
      metalSample?.controllers?.setCopperCoating?.(0);
      if (solution?.material?.color) {
        solution.material.color.copy(fromColor);
      }
    },
  });
}
