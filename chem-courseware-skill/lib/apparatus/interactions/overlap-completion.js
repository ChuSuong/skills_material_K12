import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { getApparatusId } from '../core.js';
import { modelsOverlapOrNear, canAttemptOrderedStep, completeOrderedOverlapStep, hasActiveCompletion, isStepBusy, runStepCompletion, clearStepCompletion } from '../../interaction/direct-manipulation.js';
import { resolveInteractionId } from './shared.js';

const WORLD_POINT = new THREE.Vector3();

const FALLBACK_SOURCE = { kind: 'source', meta: { id: 'source' } };
const FALLBACK_TARGET = { kind: 'target', meta: { id: 'target' } };

function getWorldPoint(object3D) {
  return object3D.getWorldPosition(WORLD_POINT.clone());
}

function makeInteractionRef(entry, fallbackKind, fallbackId) {
  return entry ?? { kind: fallbackKind, meta: { id: fallbackId } };
}

function resolveTargetAnchorObject(target, anchorName) {
  return resolveAnchor(target, anchorName)
    ?? target?.anchors?.interactionZone
    ?? target?.anchors?.pourTarget
    ?? target?.anchors?.sampleZone
    ?? target?.anchors?.mouth
    ?? null;
}

function getCurrentCompleted(options) {
  return typeof options.getCompleted === 'function' ? options.getCompleted() : {};
}

function getCurrentCompletion(source, getCompletionPose, duration) {
  return resolveCompletionEntry({
    source,
    getCompletionPose,
    duration,
  });
}

function canStartStep(stepKey, order, options) {
  return canAttemptOrderedStep(stepKey, order, getCurrentCompleted(options));
}

function buildCompletionHandler(stepKey, state, order, options, getCompletion) {
  return completeOrderedOverlapStep({
    key: stepKey,
    state,
    order,
    completed: getCurrentCompleted(options),
    isReady: (currentKey) => currentKey === stepKey && (typeof options.isReady !== 'function' || options.isReady(currentKey)),
    getCompletion,
  });
}

function updateCompletion(state, getCompletion, options, dt) {
  return runStepCompletion(state, dt, getCompletion, (completedKey, current) => {
    options.onComplete?.(completedKey, current);
  });
}

function getVisibilityPoints(id, sourceGroup, targetGroup, sourceId, targetId, targetAnchorObject) {
  const points = [];
  if (sourceGroup) {
    points.push({
      label: `${id}:source`,
      interactionId: id,
      apparatusId: sourceId,
      point: getWorldPoint(sourceGroup),
    });
  }
  if (targetAnchorObject) {
    points.push({
      label: `${id}:target`,
      interactionId: id,
      apparatusId: targetId,
      point: getWorldPoint(targetAnchorObject),
    });
  } else if (targetGroup) {
    points.push({
      label: `${id}:target`,
      interactionId: id,
      apparatusId: targetId,
      point: getWorldPoint(targetGroup),
    });
  }
  return points;
}

function createInteractionId(source, target, sourceId, targetId) {
  return resolveInteractionId(
    'overlap-completion',
    makeInteractionRef(source, FALLBACK_SOURCE.kind, sourceId || FALLBACK_SOURCE.meta.id),
    makeInteractionRef(target, FALLBACK_TARGET.kind, targetId || FALLBACK_TARGET.meta.id),
  );
}

function resolveStepKey(key, sourceId) {
  return key ?? sourceId;
}

function resolvePadding(options) {
  return options.padding ?? 0.12;
}

function resolveDuration(options) {
  return options.duration ?? 0.25;
}

function resolveOrder(options) {
  return Array.isArray(options.order) ? options.order : [];
}

function resolveState(options) {
  return options.state ?? {};
}

function canOverlap(sourceGroup, targetGroup, padding) {
  if (!sourceGroup || !targetGroup) {
    return false;
  }
  return modelsOverlapOrNear(sourceGroup, targetGroup, padding);
}

function resetCompletion(state) {
  clearStepCompletion(state);
}

function hasCompletion(state, stepKey) {
  return hasActiveCompletion(state, stepKey);
}

function isInteractionBusy(state, stepKey) {
  return isStepBusy(state, stepKey);
}

function getTargetId(key, target) {
  return target ? getApparatusId(target) : key || FALLBACK_TARGET.meta.id;
}

function getSourceId(source) {
  return getApparatusId(source);
}

function resolveSourceGroup(source) {
  return resolveGroup(source);
}

function resolveTargetGroup(target) {
  return resolveGroup(target);
}

function createCompletionGetter(source, options, duration) {
  return () => getCurrentCompletion(source, options.getCompletionPose, duration);
}

function startCompletion(stepKey, state, order, options, getCompletion) {
  return buildCompletionHandler(stepKey, state, order, options, getCompletion);
}

function updateStepCompletion(state, getCompletion, options, dt) {
  return updateCompletion(state, getCompletion, options, dt);
}

function getInteractionVisibilityPoints(id, sourceGroup, targetGroup, sourceId, targetId, targetAnchorObject) {
  return getVisibilityPoints(id, sourceGroup, targetGroup, sourceId, targetId, targetAnchorObject);
}

function getTargetAnchor(target, targetAnchor) {
  return resolveTargetAnchorObject(target, targetAnchor);
}

function canAttempt(stepKey, order, options) {
  return canStartStep(stepKey, order, options);
}

function overlap(sourceGroup, targetGroup, padding) {
  return canOverlap(sourceGroup, targetGroup, padding);
}

function getBusyState(state, stepKey) {
  return isInteractionBusy(state, stepKey);
}

function getActiveState(state, stepKey) {
  return hasCompletion(state, stepKey);
}

function doReset(state) {
  return resetCompletion(state);
}

function buildId(source, target, sourceId, targetId) {
  return createInteractionId(source, target, sourceId, targetId);
}

function pickStepKey(key, sourceId) {
  return resolveStepKey(key, sourceId);
}

function pickState(options) {
  return resolveState(options);
}

function pickOrder(options) {
  return resolveOrder(options);
}

function pickDuration(options) {
  return resolveDuration(options);
}

function pickPadding(options) {
  return resolvePadding(options);
}

function pickSourceId(source) {
  return getSourceId(source);
}

function pickTargetId(key, target) {
  return getTargetId(key, target);
}

function pickSourceGroup(source) {
  return resolveSourceGroup(source);
}

function pickTargetGroup(target) {
  return resolveTargetGroup(target);
}

function pickTargetAnchor(target, targetAnchor) {
  return getTargetAnchor(target, targetAnchor);
}

function pickCompletion(source, options, duration) {
  return createCompletionGetter(source, options, duration);
}

function resolveAnchor(apparatus, anchorName) {
  if (!anchorName) {
    return null;
  }
  return apparatus?.anchors?.[anchorName] ?? null;
}

function resolveGroup(entry) {
  return entry?.group || entry?.apparatus?.group || null;
}

function resolveCompletionEntry({ source, getCompletionPose, duration }) {
  const object = resolveGroup(source);
  const pose = getCompletionPose?.();
  if (!object || !pose) {
    return null;
  }
  return {
    object,
    pose,
    duration,
  };
}

export function createOverlapCompletionInteraction({
  key,
  source,
  target,
  targetAnchor,
  options = {},
} = {}) {
  const sourceId = pickSourceId(source);
  const targetId = pickTargetId(key, target);
  const id = buildId(source, target, sourceId, targetId);
  const sourceGroup = pickSourceGroup(source);
  const targetGroup = pickTargetGroup(target);
  const state = pickState(options);
  const order = pickOrder(options);
  const stepKey = pickStepKey(key, sourceId);
  const duration = pickDuration(options);
  const padding = pickPadding(options);
  const targetAnchorObject = pickTargetAnchor(target, targetAnchor);
  const getCompletion = pickCompletion(source, options, duration);

  return {
    id,
    kind: 'overlap-completion',
    key: stepKey,
    source,
    target,
    state,
    canAttempt() {
      return canAttempt(stepKey, order, options);
    },
    isOverlapping() {
      return overlap(sourceGroup, targetGroup, padding);
    },
    tryStart() {
      return startCompletion(stepKey, state, order, options, getCompletion);
    },
    update(dt) {
      return updateStepCompletion(state, getCompletion, options, dt);
    },
    reset() {
      return doReset(state);
    },
    hasActiveCompletion() {
      return getActiveState(state, stepKey);
    },
    isBusy() {
      return getBusyState(state, stepKey);
    },
    getVisibilityPoints() {
      return getInteractionVisibilityPoints(id, sourceGroup, targetGroup, sourceId, targetId, targetAnchorObject);
    },
  };
}
