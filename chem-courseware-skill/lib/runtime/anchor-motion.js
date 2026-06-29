import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function getAnchorMotionAnchor(target, anchorName = null) {
  if (!target) {
    return null;
  }
  if (anchorName && target.anchors?.[anchorName]) {
    return target.anchors[anchorName];
  }
  if (typeof target.getWorldPosition === 'function' || target.isVector3) {
    return target;
  }
  return target.group || null;
}

function getAnchorMotionWorldPoint(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

function toAnchorMotionParentLocal(parent, worldPoint, out = new THREE.Vector3()) {
  out.copy(worldPoint);
  if (typeof parent?.worldToLocal === 'function') {
    parent.worldToLocal(out);
  }
  return out;
}

function cloneAnchorMotionRotation(rotation) {
  return new THREE.Euler(rotation?.x || 0, rotation?.y || 0, rotation?.z || 0, rotation?.order || 'XYZ');
}

function resolveAnchorMotionRotation(rotation) {
  if (!rotation) {
    return null;
  }
  if (rotation.isEuler) {
    return cloneAnchorMotionRotation(rotation);
  }
  if (Array.isArray(rotation)) {
    return new THREE.Euler(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0, rotation[3] || 'XYZ');
  }
  return new THREE.Euler(rotation.x || 0, rotation.y || 0, rotation.z || 0, rotation.order || 'XYZ');
}

export function computeAnchorPlacementPose({
  source,
  sourceAnchor = 'interactionZone',
  target,
  targetAnchor = 'effectOrigin',
  parent = null,
  offset = [0, 0, 0],
  rotation = null,
} = {}) {
  const sourceObject = source?.group || source;
  const sourceAnchorObject = getAnchorMotionAnchor(source, sourceAnchor);
  const targetAnchorObject = getAnchorMotionAnchor(target, targetAnchor);
  if (!sourceObject || !sourceAnchorObject || !targetAnchorObject) {
    throw new Error('computeAnchorPlacementPose requires source object, source anchor, and target anchor');
  }

  const originalPosition = sourceObject.position.clone();
  const originalRotation = cloneAnchorMotionRotation(sourceObject.rotation);
  const placementRotation = resolveAnchorMotionRotation(rotation) || originalRotation.clone();

  sourceObject.rotation.copy(placementRotation);
  sourceObject.updateMatrixWorld(true);

  const targetWorld = getAnchorMotionWorldPoint(targetAnchorObject, new THREE.Vector3());
  const targetLocal = toAnchorMotionParentLocal(parent, targetWorld, new THREE.Vector3()).add(
    new THREE.Vector3(offset[0] || 0, offset[1] || 0, offset[2] || 0),
  );
  const sourceWorld = getAnchorMotionWorldPoint(sourceAnchorObject, new THREE.Vector3());
  const sourceLocal = toAnchorMotionParentLocal(parent, sourceWorld, new THREE.Vector3());
  const position = sourceObject.position.clone().add(targetLocal.sub(sourceLocal));

  sourceObject.position.copy(originalPosition);
  sourceObject.rotation.copy(originalRotation);
  sourceObject.updateMatrixWorld(true);

  return { position, rotation: placementRotation };
}

export function applyAnchorPlacement(options = {}) {
  const sourceObject = options.source?.group || options.source;
  const pose = computeAnchorPlacementPose(options);
  sourceObject.position.copy(pose.position);
  sourceObject.rotation.copy(pose.rotation);
  sourceObject.updateMatrixWorld(true);
  return pose;
}

export function createGuidedAnchorMotion({
  source,
  sourceAnchor,
  target,
  targetAnchor,
  parent = null,
  offset = [0, 0, 0],
  rotation = null,
  duration = 1.2,
  easing = (value) => THREE.MathUtils.smoothstep(value, 0, 1),
  dragController = null,
  onStart,
  onUpdate,
  onComplete,
} = {}) {
  const sourceObject = source?.group || source;
  const state = {
    active: false,
    t: 0,
    duration,
    progress: 0,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromRotation: new THREE.Euler(),
    toRotation: new THREE.Euler(),
  };

  function start(extra = {}) {
    if (!sourceObject || state.active) {
      return false;
    }
    const pose = computeAnchorPlacementPose({
      source,
      sourceAnchor,
      target,
      targetAnchor,
      parent,
      offset,
      rotation,
      ...extra,
    });
    state.active = true;
    state.t = 0;
    state.progress = 0;
    state.fromPosition.copy(sourceObject.position);
    state.toPosition.copy(pose.position);
    state.fromRotation.copy(sourceObject.rotation);
    state.toRotation.copy(pose.rotation);
    dragController?.setEnabled?.(false);
    onStart?.({ state, pose });
    return true;
  }

  function update(dt = 1 / 60) {
    if (!state.active || !sourceObject) {
      return state;
    }

    state.t += dt;
    state.progress = Math.min(1, state.t / Math.max(state.duration, 0.001));
    const eased = easing(state.progress);
    sourceObject.position.lerpVectors(state.fromPosition, state.toPosition, eased);
    sourceObject.rotation.x = THREE.MathUtils.lerp(state.fromRotation.x, state.toRotation.x, eased);
    sourceObject.rotation.y = THREE.MathUtils.lerp(state.fromRotation.y, state.toRotation.y, eased);
    sourceObject.rotation.z = THREE.MathUtils.lerp(state.fromRotation.z, state.toRotation.z, eased);
    onUpdate?.({ state, eased });

    if (state.progress >= 1) {
      state.active = false;
      dragController?.setEnabled?.(true);
      sourceObject.position.copy(state.toPosition);
      sourceObject.rotation.copy(state.toRotation);
      onComplete?.({ state });
    }

    return state;
  }

  function cancel({ restoreDrag = true } = {}) {
    state.active = false;
    state.t = 0;
    state.progress = 0;
    if (restoreDrag) {
      dragController?.setEnabled?.(true);
    }
    return state;
  }

  return {
    state,
    start,
    update,
    cancel,
    get active() {
      return state.active;
    },
  };
}

export function createContextualLabelPolicy({
  apparatus,
  label = {},
} = {}) {
  function show(nextLabel = label) {
    apparatus?.controllers?.setLabel?.(nextLabel);
    return true;
  }

  function hide() {
    apparatus?.controllers?.setLabel?.({});
    return true;
  }

  return { show, hide };
}
