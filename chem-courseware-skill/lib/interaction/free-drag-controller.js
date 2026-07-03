import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createManipulationController } from './manipulation-controller.js';
import { modelsOverlapOrNear } from './direct-manipulation.js';

function getFreeDragWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

function clonePose(object) {
  return {
    position: object.position.clone(),
    rotation: object.rotation.clone(),
    visible: object.visible,
  };
}

function applyPose(object, pose) {
  object.position.copy(pose.position);
  object.rotation.copy(pose.rotation);
  if (typeof pose.visible === 'boolean') {
    object.visible = pose.visible;
  }
}

function isPoseAtHome(object, pose) {
  return object.position.distanceTo(pose.position) < 0.015
    && Math.abs(object.rotation.x - pose.rotation.x) < 0.01
    && Math.abs(object.rotation.y - pose.rotation.y) < 0.01
    && Math.abs(object.rotation.z - pose.rotation.z) < 0.01
    && object.visible === pose.visible;
}

function getApparatusRef(target) {
  return target?.apparatus
    || target?.meta?.coursewareApparatus
    || target?.userData?.coursewareApparatus
    || target?.group?.userData?.coursewareApparatus
    || target?.anchor?.userData?.coursewareApparatus
    || target?.object?.userData?.coursewareApparatus
    || null;
}

function isVesselFamily(family = '') {
  return /vessel|open-vessel|heated-vessel|narrow-neck-vessel|gas-collection-vessel/i.test(String(family || ''));
}

function resolveSuccessBehavior({
  sourceApparatus = null,
  targetApparatus = null,
  successBehavior = null,
  successReturnDelayMs = null,
} = {}) {
  if (typeof successBehavior === 'string') {
    return { type: successBehavior, delayMs: successReturnDelayMs ?? 0 };
  }
  if (successBehavior && typeof successBehavior === 'object') {
    return {
      type: successBehavior.type || 'return-home',
      delayMs: successBehavior.delayMs ?? successReturnDelayMs ?? 0,
    };
  }

  const sourceFamily = sourceApparatus?.family || '';
  const targetFamily = targetApparatus?.family || '';

  if ([
    'transfer-tool',
    'solid-reagent-container',
    'showcase-solid-jar',
    'showcase-bottle',
    'gas-source',
    'gas-transfer-tool',
    'solid-transfer-tool',
  ].includes(sourceFamily)) {
    return { type: 'return-home', delayMs: successReturnDelayMs ?? 0 };
  }

  if ([
    'solid-metal-sample',
    'showcase-metal-sample',
    'indicator-tool',
    'mixing-tool',
    'sample-dish',
    'separation-tool',
  ].includes(sourceFamily)) {
    return { type: 'stay-at-target', delayMs: 0 };
  }

  if (isVesselFamily(targetFamily)) {
    return { type: 'stay-at-target', delayMs: 0 };
  }

  return { type: 'return-home', delayMs: successReturnDelayMs ?? 0 };
}

function normalizeTarget(target, fallbackRadius = 0.35) {
  if (!target) {
    return null;
  }
  if (typeof target.getWorldPosition === 'function' || target.isVector3) {
    return {
      id: target.name || 'target',
      anchor: target,
      apparatus: getApparatusRef(target),
      radius: fallbackRadius,
      successBehavior: null,
      successReturnDelayMs: 0,
    };
  }
  return {
    id: target.id || target.key || target.anchor?.name || 'target',
    anchor: target.anchor || target.object || target,
    apparatus: getApparatusRef(target),
    overlapObject: target.overlapObject || target.targetObject || target.object || null,
    overlapPadding: target.overlapPadding ?? target.padding ?? 0,
    radius: target.radius ?? fallbackRadius,
    successBehavior: target.successBehavior || null,
    successReturnDelayMs: target.successReturnDelayMs ?? 0,
    onNearTarget: target.onNearTarget,
    onDropTarget: target.onDropTarget,
  };
}

function findClosestTarget(entry, position = new THREE.Vector3()) {
  const dragAnchor = entry.dragAnchor || entry.anchors?.gripAnchor || entry.object;
  getFreeDragWorldPosition(dragAnchor, position);

  let closest = null;
  const targetPosition = new THREE.Vector3();
  for (const target of entry.validTargets) {
    getFreeDragWorldPosition(target.anchor, targetPosition);
    const distance = position.distanceTo(targetPosition);
    const overlapsTarget = Boolean(
      target.overlapObject
        && entry.object
        && modelsOverlapOrNear(entry.object, target.overlapObject, target.overlapPadding),
    );
    const withinRange = distance <= target.radius || overlapsTarget;
    if (!closest || distance < closest.distance) {
      closest = {
        ...target,
        distance,
        overlapsTarget,
        withinRange,
        position: targetPosition.clone(),
      };
    }
  }
  return closest;
}

function easeToPose(object, pose, dt, speed) {
  const alpha = 1 - Math.exp(-Math.max(dt, 0) * speed);
  object.position.lerp(pose.position, alpha);
  object.rotation.x = THREE.MathUtils.lerp(object.rotation.x, pose.rotation.x, alpha);
  object.rotation.y = THREE.MathUtils.lerp(object.rotation.y, pose.rotation.y, alpha);
  object.rotation.z = THREE.MathUtils.lerp(object.rotation.z, pose.rotation.z, alpha);
  return object.position.distanceTo(pose.position) < 0.015
    && Math.abs(object.rotation.x - pose.rotation.x) < 0.01
    && Math.abs(object.rotation.y - pose.rotation.y) < 0.01
    && Math.abs(object.rotation.z - pose.rotation.z) < 0.01;
}

export function createFreeDragController({
  camera,
  renderer,
  controls,
  dragPlane,
  bounds,
  returnSpeed = 8,
  targetRadius = 0.35,
} = {}) {
  const manipulation = createManipulationController({
    camera,
    renderer,
    controls,
    defaultDragPlane: dragPlane,
    defaultBounds: bounds,
  });

  const entries = new Map();
  const returning = new Set();
  const pendingReturns = new Map();

  function clearPendingReturn(id) {
    const timerId = pendingReturns.get(id);
    if (timerId !== undefined) {
      globalThis.clearTimeout?.(timerId);
      pendingReturns.delete(id);
    }
  }

  function markEntryState(entry, next = {}) {
    Object.assign(entry.state, next, {
      hidden: entry.object.visible === false,
    });
  }

  function scheduleReturnHome(entry, delayMs = 0) {
    const delay = Math.max(0, Number(delayMs) || 0);
    clearPendingReturn(entry.id);
    returning.delete(entry.id);
    markEntryState(entry, {
      phase: delay > 0 ? 'success-pending-return' : 'returning-home',
      pendingReturn: true,
      isAtHome: false,
    });

    const activateReturn = () => {
      pendingReturns.delete(entry.id);
      returning.add(entry.id);
      markEntryState(entry, {
        phase: 'returning-home',
        pendingReturn: true,
        isAtHome: false,
      });
    };

    if (delay > 0 && typeof globalThis.setTimeout === 'function') {
      const timerId = globalThis.setTimeout(activateReturn, delay);
      pendingReturns.set(entry.id, timerId);
      return true;
    }

    activateReturn();
    return true;
  }

  function commitSuccess(id, { target = null, successBehavior = null, successReturnDelayMs = null } = {}) {
    const entry = entries.get(id);
    if (!entry) {
      return false;
    }

    clearPendingReturn(id);
    returning.delete(id);
    const behavior = resolveSuccessBehavior({
      sourceApparatus: entry.sourceApparatus,
      targetApparatus: target?.apparatus || null,
      successBehavior: successBehavior || target?.successBehavior || entry.successBehavior,
      successReturnDelayMs: successReturnDelayMs ?? target?.successReturnDelayMs ?? entry.successReturnDelayMs,
    });

    markEntryState(entry, {
      lastTargetId: target?.id || null,
      lastSuccessBehavior: behavior.type,
    });

    if (behavior.type === 'consume-and-hide') {
      entry.object.visible = false;
      markEntryState(entry, {
        phase: 'consumed',
        pendingReturn: false,
        isAtHome: false,
      });
      return true;
    }

    if (behavior.type === 'return-home') {
      return scheduleReturnHome(entry, behavior.delayMs);
    }

    markEntryState(entry, {
      phase: behavior.type === 'restore-home-on-reset-only' ? 'placed-reset-only' : 'placed',
      pendingReturn: false,
      isAtHome: isPoseAtHome(entry.object, entry.homePose),
    });
    return true;
  }

  function registerDraggable({
    id,
    object,
    pickObjects = null,
    anchors = null,
    dragAnchor = null,
    homePose = null,
    successBehavior = null,
    successReturnDelayMs = 0,
    validTargets = [],
    autoTiltTarget = null,
    autoTiltRange = [-0.32, -1.18],
    autoTiltAxis = 'z',
    onNearTarget,
    onDropTarget,
    onReturnHome,
    onDragStart,
    onDrag,
    onDragEnd,
  } = {}) {
    if (!id || !object) {
      return null;
    }

    const entry = {
      id,
      object,
      pickObjects,
      anchors,
      dragAnchor,
      sourceApparatus: getApparatusRef(object),
      homePose: homePose || clonePose(object),
      successBehavior,
      successReturnDelayMs,
      validTargets: validTargets.map((target) => normalizeTarget(target, targetRadius)).filter(Boolean),
      autoTiltTarget: normalizeTarget(autoTiltTarget, Number.POSITIVE_INFINITY),
      autoTiltRange,
      autoTiltAxis,
      onNearTarget,
      onDropTarget,
      onReturnHome,
      state: {
        phase: 'idle',
        isAtHome: isPoseAtHome(object, homePose || clonePose(object)),
        hidden: object.visible === false,
        pendingReturn: false,
        lastTargetId: null,
        lastSuccessBehavior: null,
      },
    };
    entries.set(id, entry);

    const registered = manipulation.register({
      id,
      object,
      pickObjects,
      anchors,
      dragAnchor,
      bounds,
      dragPlane,
      onDragStart(args) {
        clearPendingReturn(id);
        returning.delete(id);
        markEntryState(entry, {
          phase: 'dragging',
          pendingReturn: false,
          isAtHome: false,
        });
        onDragStart?.({ ...args, freeDragEntry: entry });
      },
      onDrag(args) {
        const closest = findClosestTarget(entry);
        if (closest?.withinRange) {
          entry.onNearTarget?.({ ...args, target: closest, freeDragEntry: entry });
          closest.onNearTarget?.({ ...args, target: closest, freeDragEntry: entry });
        }

        if (entry.autoTiltTarget?.anchor) {
          const target = getFreeDragWorldPosition(entry.autoTiltTarget.anchor, new THREE.Vector3());
          const current = getFreeDragWorldPosition(entry.dragAnchor || entry.object, new THREE.Vector3());
          const distance = Math.abs(current.x - target.x);
          const closeness = 1 - Math.min(distance / 3.2, 1);
          object.rotation[entry.autoTiltAxis] = THREE.MathUtils.lerp(
            entry.autoTiltRange[0],
            entry.autoTiltRange[1],
            closeness,
          );
        }

        onDrag?.({ ...args, target: closest, freeDragEntry: entry });
      },
      onDragEnd(args) {
        const closest = findClosestTarget(entry);
        if (closest?.withinRange) {
          const payload = { ...args, target: closest, freeDragEntry: entry };
          entry.onDropTarget?.(payload);
          closest.onDropTarget?.(payload);
          commitSuccess(id, { target: closest });
        } else {
          returning.add(id);
          markEntryState(entry, {
            phase: 'returning-home',
            pendingReturn: true,
            isAtHome: false,
          });
        }
        onDragEnd?.({ ...args, target: closest, freeDragEntry: entry });
      },
    });

    return { ...registered, freeDragEntry: entry };
  }

  function update(dt = 1 / 60) {
    for (const id of Array.from(returning)) {
      const entry = entries.get(id);
      if (!entry) {
        returning.delete(id);
        continue;
      }
      const complete = easeToPose(entry.object, entry.homePose, dt, returnSpeed);
      if (complete) {
        applyPose(entry.object, entry.homePose);
        returning.delete(id);
        markEntryState(entry, {
          phase: 'idle',
          pendingReturn: false,
          isAtHome: true,
        });
        entry.onReturnHome?.({ id, entry: entry.freeDragEntry || entry });
      }
    }
  }

  function reset(id = null) {
    const targetEntries = id ? [[id, entries.get(id)]] : Array.from(entries.entries());
    for (const [entryId, entry] of targetEntries) {
      if (!entry) {
        continue;
      }
      clearPendingReturn(entryId);
      applyPose(entry.object, entry.homePose);
      returning.delete(entryId);
      markEntryState(entry, {
        phase: 'idle',
        pendingReturn: false,
        isAtHome: true,
        lastTargetId: null,
        lastSuccessBehavior: null,
      });
    }
  }

  return {
    state: manipulation.state,
    registerDraggable,
    commitSuccess,
    getEntryState(id) {
      const entry = entries.get(id);
      return entry ? { ...entry.state } : null;
    },
    isAtHome(id) {
      return entries.get(id)?.state?.isAtHome ?? false;
    },
    // Test-harness helper: simulate a drag-drop without pointer events.
    // Sets isAtHome = false (as a real drag would), then fires onDropTarget for targetId.
    simulateDrop(sourceId, targetId) {
      const entry = entries.get(sourceId);
      if (!entry) return false;
      markEntryState(entry, { phase: 'dragging', pendingReturn: false, isAtHome: false });
      const target = entry.validTargets.find((t) => t.id === targetId) || null;
      if (!target) {
        returning.add(sourceId);
        markEntryState(entry, { phase: 'returning-home', pendingReturn: true, isAtHome: false });
        return false;
      }
      const payload = { freeDragEntry: entry, target };
      entry.onDropTarget?.(payload);
      target.onDropTarget?.(payload);
      commitSuccess(sourceId, { target });
      return true;
    },
    canStartSequencedMotion(id, { allowStaged = false } = {}) {
      if (!id || !entries.has(id)) {
        return false;
      }
      if (allowStaged) {
        return !this.hasActiveTransition(id);
      }
      return this.isAtHome(id) && !this.hasActiveTransition(id);
    },
    hasActiveTransition(id = null) {
      if (id) {
        const entry = entries.get(id);
        return Boolean(
          entry
          && (
            returning.has(id)
            || pendingReturns.has(id)
            || entry.state?.phase === 'returning-home'
            || entry.state?.phase === 'success-pending-return'
          )
        );
      }
      for (const [entryId, entry] of entries.entries()) {
        if (
          returning.has(entryId)
          || pendingReturns.has(entryId)
          || entry.state?.phase === 'returning-home'
          || entry.state?.phase === 'success-pending-return'
        ) {
          return true;
        }
      }
      return false;
    },
    update,
    reset,
    dispose: manipulation.dispose,
    setEnabled: manipulation.setEnabled,
  };
}
