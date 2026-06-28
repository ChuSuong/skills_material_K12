import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { clamp01, smoothstep01 } from '../runtime/timeline.js';

export function updatePointerFromEvent(event, domElement, pointer) {
  const rect = domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return pointer;
}

export function setPointerCaptureSafe(domElement, pointerId) {
  if (pointerId == null || typeof domElement.setPointerCapture !== 'function') {
    return;
  }
  domElement.setPointerCapture(pointerId);
}

export function releasePointerCaptureSafe(domElement, pointerId) {
  if (pointerId == null || typeof domElement.releasePointerCapture !== 'function') {
    return;
  }
  try {
    domElement.releasePointerCapture(pointerId);
  } catch {}
}

export function setControlsDragging(controls, dragging) {
  if (!controls) {
    return;
  }
  controls.enabled = !dragging;
}

export function intersectPointerPlane({ raycaster, pointer, camera, plane, out }) {
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray.intersectPlane(plane, out);
}

export function getWorldBounds(group, padding = 0) {
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  if (padding > 0) {
    bounds.expandByScalar(padding);
  }
  return bounds;
}

export function modelsOverlapOrNear(sourceGroup, targetGroup, padding = 0.12) {
  const sourceBounds = getWorldBounds(sourceGroup, padding);
  const targetBounds = getWorldBounds(targetGroup, padding);
  return sourceBounds.intersectsBox(targetBounds)
    || sourceBounds.distanceToPoint(targetGroup.position) <= padding
    || targetBounds.distanceToPoint(sourceGroup.position) <= padding;
}

export function canAttemptOrderedStep(key, order = [], completed = {}) {
  if (!key) {
    return false;
  }
  const stepIndex = order.indexOf(key);
  if (stepIndex === -1) {
    return false;
  }
  if (completed[key]) {
    return false;
  }
  for (let index = 0; index < stepIndex; index += 1) {
    if (!completed[order[index]]) {
      return false;
    }
  }
  return true;
}

export function hasActiveCompletion(state, key) {
  return Boolean(state && (state.pendingCompletedStep === key || state.completingStep === key));
}

export function isStepBusy(state, key) {
  return Boolean(state && (state.dragging === key || hasActiveCompletion(state, key)));
}

export function lerpObjectPose(object, fromPosition, fromRotation, toPose, t) {
  object.position.lerpVectors(fromPosition, toPose.position, t);
  object.rotation.set(
    fromRotation.x + (toPose.rotation.x - fromRotation.x) * t,
    fromRotation.y + (toPose.rotation.y - fromRotation.y) * t,
    fromRotation.z + (toPose.rotation.z - fromRotation.z) * t,
  );
}

export function beginStepCompletion(state, key, object, pose, duration = 0.25) {
  if (!state || !object || !pose || hasActiveCompletion(state, key)) {
    return false;
  }
  state.completingStep = key;
  state.completionT = 0;
  state.completionDuration = duration;
  state.completionFromPosition = object.position.clone();
  state.completionFromRotation = object.rotation.clone();
  state.pendingCompletedStep = null;
  state.dragging = null;
  return true;
}

export function clearStepCompletion(state) {
  if (!state) {
    return;
  }
  state.pendingCompletedStep = null;
  state.completingStep = null;
  state.completionT = 0;
  state.completionDuration = 0;
  state.completionFromPosition = null;
  state.completionFromRotation = null;
}

export function runStepCompletion(state, dt, getCurrent, onComplete) {
  if (!state?.completingStep) {
    return false;
  }
  const current = getCurrent?.(state.completingStep);
  if (!current?.object || !current?.pose || !state.completionFromPosition || !state.completionFromRotation) {
    clearStepCompletion(state);
    return false;
  }
  state.completionT += dt;
  const duration = Math.max(0.001, state.completionDuration || current.duration || 0.25);
  const t = smoothstep01(clamp01(state.completionT / duration));
  lerpObjectPose(current.object, state.completionFromPosition, state.completionFromRotation, current.pose, t);
  if (state.completionT >= duration) {
    const completedKey = state.completingStep;
    clearStepCompletion(state);
    onComplete?.(completedKey, current);
  }
  return true;
}

export function completeOrderedOverlapStep({
  key,
  state,
  order = [],
  completed = {},
  isReady,
  getCompletion,
}) {
  if (!canAttemptOrderedStep(key, order, completed)) {
    return false;
  }
  if (typeof isReady === 'function' && !isReady(key)) {
    return false;
  }
  const current = getCompletion?.(key);
  if (!current?.object || !current?.pose) {
    return false;
  }
  return beginStepCompletion(state, key, current.object, current.pose, current.duration);
}
