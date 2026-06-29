import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export const APPARATUS_THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function makeAnchor(parent, x = 0, y = 0, z = 0, name = '') {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  if (name) {
    anchor.name = name;
  }
  parent.add(anchor);
  return anchor;
}

export function getAnchorWorld(anchor, target = new THREE.Vector3()) {
  return anchor.getWorldPosition(target);
}

export function getApparatusId(apparatus) {
  return apparatus?.meta?.id || apparatus?.group?.name || apparatus?.kind || 'apparatus';
}

export function composeApparatus({
  kind,
  family,
  group,
  meshes = {},
  anchors = {},
  constraints = {},
  controllers = {},
  validators = [],
  state = {},
  meta = {},
}) {
  return {
    kind,
    family,
    group,
    meshes,
    anchors,
    constraints,
    controllers,
    validators,
    state,
    meta,
  };
}
