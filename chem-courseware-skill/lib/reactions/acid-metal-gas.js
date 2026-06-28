import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

function getAcidMetalWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

export function createAcidMetalGasReaction({
  metalSample,
  vessel,
  bubbleField,
  sparkField,
  solutionColorTransition,
  duration = 2.4,
} = {}) {
  const origin = new THREE.Vector3();

  return createReactionFlow({
    id: 'acid-metal-gas',
    duration,
    effects: [bubbleField, sparkField, solutionColorTransition].filter(Boolean),
    onUpdate({ state, dt, elapsed }) {
      const progress = state.progress;
      getAcidMetalWorldPosition(vessel?.anchors?.effectOrigin || metalSample?.anchors?.effectOrigin || metalSample?.group, origin);
      bubbleField?.burst?.(origin, progress, dt);
      bubbleField?.update?.(dt, elapsed);
      sparkField?.burst?.(origin, Math.max(0, progress - 0.72), dt);
      sparkField?.update?.(dt, elapsed);
      solutionColorTransition?.setProgress?.(progress);
      metalSample?.controllers?.setCorrosionProgress?.(progress);
    },
    onReset() {
      solutionColorTransition?.reset?.();
      metalSample?.controllers?.setCorrosionProgress?.(0);
    },
  });
}
