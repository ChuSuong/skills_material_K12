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
  };
}

function applyPose(object, pose) {
  object.position.copy(pose.position);
  object.rotation.copy(pose.rotation);
}

function normalizeTarget(target, fallbackRadius = 0.35) {
  if (!target) {
    return null;
  }
  if (typeof target.getWorldPosition === 'function' || target.isVector3) {
    return { id: target.name || 'target', anchor: target, radius: fallbackRadius };
  }
  return {
    id: target.id || target.key || target.anchor?.name || 'target',
    anchor: target.anchor || target.object || target,
    overlapObject: target.overlapObject || target.targetObject || target.object || null,
    overlapPadding: target.overlapPadding ?? target.padding ?? 0,
    radius: target.radius ?? fallbackRadius,
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

  function registerDraggable({
    id,
    object,
    pickObjects = null,
    anchors = null,
    dragAnchor = null,
    homePose = null,
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
      homePose: homePose || clonePose(object),
      validTargets: validTargets.map((target) => normalizeTarget(target, targetRadius)).filter(Boolean),
      autoTiltTarget: normalizeTarget(autoTiltTarget, Number.POSITIVE_INFINITY),
      autoTiltRange,
      autoTiltAxis,
      onNearTarget,
      onDropTarget,
      onReturnHome,
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
        returning.delete(id);
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
        } else {
          returning.add(id);
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
      applyPose(entry.object, entry.homePose);
      returning.delete(entryId);
    }
  }

  return {
    state: manipulation.state,
    registerDraggable,
    update,
    reset,
    dispose: manipulation.dispose,
    setEnabled: manipulation.setEnabled,
  };
}
