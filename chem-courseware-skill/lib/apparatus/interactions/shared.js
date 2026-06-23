import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getApparatusId } from '../core.js';

export const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function toParentSpace(object3D, worldPoint) {
  if (!object3D?.parent) {
    return worldPoint;
  }
  return object3D.parent.worldToLocal(worldPoint.clone());
}

export function resolveTargetAnchor(target) {
  return target?.anchors?.pourTarget || target?.anchors?.mouth || null;
}

export function resolveInteractionId(kind, source, target) {
  const sourceId = getApparatusId(source);
  const targetId = target ? getApparatusId(target) : kind;
  return `${kind}:${sourceId}->${targetId}`;
}
