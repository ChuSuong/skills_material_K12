import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

function getElectrolysisWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

export function createWaterElectrolysisReaction({
  electrodePair,
  cathodeBubbleField,
  anodeBubbleField,
  duration = 6.2,
} = {}) {
  const cathodeOrigin = new THREE.Vector3();
  const anodeOrigin = new THREE.Vector3();

  function updateElectrolysisEffects({ progress = 1, dt = 1 / 60, elapsed = 0, sustained = false } = {}) {
    const intensity = sustained ? 0.58 : Math.max(0.12, progress);
    getElectrolysisWorldPosition(electrodePair?.anchors?.cathodeBubbleOrigin || electrodePair?.group, cathodeOrigin);
    getElectrolysisWorldPosition(electrodePair?.anchors?.anodeBubbleOrigin || electrodePair?.group, anodeOrigin);

    cathodeBubbleField?.burst?.(cathodeOrigin, intensity * 1.25, dt);
    cathodeBubbleField?.update?.(dt, elapsed);
    anodeBubbleField?.burst?.(anodeOrigin, intensity * 0.68, dt);
    anodeBubbleField?.update?.(dt, elapsed);
  }

  return createReactionFlow({
    id: 'water-electrolysis',
    duration,
    effects: [cathodeBubbleField, anodeBubbleField].filter(Boolean),
    onStart() {
      electrodePair?.controllers?.setPowered?.(true);
    },
    onUpdate({ state, dt, elapsed }) {
      updateElectrolysisEffects({ progress: state.progress, dt, elapsed });
    },
    onAfterFinishUpdate({ dt, elapsed }) {
      updateElectrolysisEffects({ progress: 1, dt, elapsed, sustained: true });
    },
    onReset() {
      electrodePair?.controllers?.setPowered?.(false);
    },
  });
}
