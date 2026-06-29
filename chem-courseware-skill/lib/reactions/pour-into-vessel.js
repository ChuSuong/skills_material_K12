import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

function anchorOf(apparatus, preferred) {
  return apparatus?.anchors?.[preferred] || apparatus?.group || apparatus;
}

export function createPourIntoVesselReaction({
  id = 'pour-into-vessel',
  source,
  target,
  stream,
  duration = 1.4,
  onPourStart,
  onPourUpdate,
  onPourFinish,
} = {}) {
  const flow = createReactionFlow({
    id,
    duration,
    effects: [stream].filter(Boolean),
    onStart(context) {
      onPourStart?.(context);
    },
    onUpdate({ state, dt, elapsed }) {
      const sourceAnchor = anchorOf(source, 'nozzle');
      const targetAnchor = anchorOf(target, 'mouth');
      stream?.setEndpoints?.(sourceAnchor, targetAnchor, Math.max(0.15, state.progress));
      onPourUpdate?.({ state, dt, elapsed });
    },
    onFinish(context) {
      stream?.reset?.();
      onPourFinish?.(context);
    },
    onReset() {
      stream?.reset?.();
    },
  });

  function isAligned(maxDistance = target?.constraints?.safePourRadius ?? 0.5) {
    const sourcePoint = anchorOf(source, 'nozzle').getWorldPosition?.(new THREE.Vector3()) ?? new THREE.Vector3();
    const targetPoint = anchorOf(target, 'mouth').getWorldPosition?.(new THREE.Vector3()) ?? new THREE.Vector3();
    sourcePoint.y = targetPoint.y;
    return sourcePoint.distanceTo(targetPoint) <= maxDistance;
  }

  return { ...flow, isAligned };
}
