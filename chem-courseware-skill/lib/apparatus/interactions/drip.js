import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { clamp } from '../core.js';
import { resolveInteractionId, resolveTargetAnchor, toParentSpace } from './shared.js';
import { getAnchorWorld } from '../core.js';

export function createDripInteraction({
  source,
  target,
  dropMesh,
  options = {},
}) {
  const sourceAnchor = source?.anchors?.nozzle;
  const targetAnchor = target?.anchors?.mouth || resolveTargetAnchor(target);
  const id = resolveInteractionId('drip', source, target);
  const visibleFrom = options.visibleFrom ?? 0.1;
  const visibleUntil = options.visibleUntil ?? 0.38;
  const fallWindow = options.fallWindow ?? [0.08, 0.22];

  const state = {
    progress: 0,
  };

  return {
    id,
    kind: 'drip',
    source,
    target,
    state,
    setProgress(progress) {
      const value = clamp(progress, 0, 1);
      state.progress = value;
      if (!dropMesh || !sourceAnchor || !targetAnchor) {
        return;
      }
      const visible = value > visibleFrom && value < visibleUntil;
      dropMesh.visible = visible;
      if (!visible) {
        return;
      }
      const origin = toParentSpace(dropMesh, getAnchorWorld(sourceAnchor));
      const targetPoint = toParentSpace(dropMesh, getAnchorWorld(targetAnchor));
      const fall = THREE.MathUtils.smoothstep(value, fallWindow[0], fallWindow[1]);
      dropMesh.position.copy(origin.lerp(targetPoint, fall));
    },
    reset() {
      state.progress = 0;
      if (dropMesh) {
        dropMesh.visible = false;
      }
    },
    validate() {
      return [];
    },
    getVisibilityPoints() {
      if (!dropMesh || !dropMesh.visible) {
        return [];
      }
      return [{
        label: `${id}:drop`,
        interactionId: id,
        point: dropMesh.position.clone(),
      }];
    },
  };
}
