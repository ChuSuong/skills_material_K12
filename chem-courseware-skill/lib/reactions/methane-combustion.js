import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

function getMethaneCombustionWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

export function createMethaneCombustionReaction({
  vessel,
  ignitionSource,
  bubbleField,
  steamField,
  sparkField,
  glowRing,
  flamePlume,
  duration = 5.2,
} = {}) {
  const gasOrigin = new THREE.Vector3();
  const flameOrigin = new THREE.Vector3();

  function updateCombustionEffects({ progress = 1, dt = 1 / 60, elapsed = 0, sustained = false } = {}) {
    const ignition = sustained ? 1 : Math.max(0, Math.min(1, (progress - 0.18) / 0.82));
    getMethaneCombustionWorldPosition(vessel?.anchors?.effectOrigin || vessel?.group, gasOrigin);
    getMethaneCombustionWorldPosition(vessel?.anchors?.steamOrigin || ignitionSource?.anchors?.flameOrigin || gasOrigin, flameOrigin);

    if (!sustained) {
      bubbleField?.burst?.(gasOrigin, Math.max(0.12, 1 - progress * 0.45), dt);
    }
    bubbleField?.update?.(dt, elapsed);
    steamField?.burst?.(flameOrigin, sustained ? 0.28 : ignition * 0.82, dt);
    steamField?.update?.(dt, elapsed);
    sparkField?.burst?.(flameOrigin, sustained ? 0.12 : (ignition > 0.08 ? ignition : 0), dt);
    sparkField?.update?.(dt, elapsed);
    glowRing?.mesh?.position?.copy?.(flameOrigin);
    glowRing?.setIntensity?.(sustained ? 0.82 : ignition, elapsed);
    flamePlume?.positionAt?.(flameOrigin);
    flamePlume?.setIntensity?.(sustained ? 0.92 : ignition, elapsed);
  }

  return createReactionFlow({
    id: 'methane-combustion',
    duration,
    effects: [bubbleField, steamField, sparkField, glowRing, flamePlume].filter(Boolean),
    onUpdate({ state, dt, elapsed }) {
      updateCombustionEffects({ progress: state.progress, dt, elapsed });
    },
    onAfterFinishUpdate({ dt, elapsed }) {
      updateCombustionEffects({ progress: 1, dt, elapsed, sustained: true });
    },
    onReset() {
      glowRing?.reset?.();
      flamePlume?.reset?.();
    },
  });
}
