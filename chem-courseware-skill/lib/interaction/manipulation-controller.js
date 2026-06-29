import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {
  updatePointerFromEvent,
  setPointerCaptureSafe,
  releasePointerCaptureSafe,
  setControlsDragging,
} from './direct-manipulation.js';

function resolveDragAnchor(entry) {
  return entry.dragAnchor
    || entry.anchors?.gripAnchor
    || entry.anchors?.interactionZone
    || entry.object;
}

function normalizeBounds(bounds) {
  if (!bounds) {
    return null;
  }
  if (bounds.isBox3) {
    return { min: bounds.min, max: bounds.max };
  }
  if (bounds.min && bounds.max) {
    return bounds;
  }
  return null;
}

function getWorldPosition(target, out) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  out.set(0, 0, 0);
  return out;
}

export function createManipulationController({
  camera,
  renderer,
  controls,
  defaultDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  defaultBounds = null,
} = {}) {
  const domElement = renderer?.domElement;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPoint = new THREE.Vector3();
  const anchorWorld = new THREE.Vector3();

  const entries = new Map();
  const rootToId = new Map();

  const state = {
    enabled: true,
    hovered: null,
    dragging: null,
    pointerHeld: false,
    pointerId: null,
  };

  function pick(event) {
    if (!camera || !domElement) {
      return null;
    }
    updatePointerFromEvent(event, domElement, pointer);
    raycaster.setFromCamera(pointer, camera);
    const roots = Array.from(rootToId.keys());
    if (!roots.length) {
      return null;
    }
    const hits = raycaster.intersectObjects(roots, true);
    if (!hits.length) {
      return null;
    }
    let node = hits[0].object;
    while (node) {
      const id = rootToId.get(node);
      if (id) {
        return id;
      }
      node = node.parent;
    }
    return null;
  }

  function clampObjectPosition(entry) {
    const bounds = normalizeBounds(entry.bounds ?? defaultBounds);
    if (!bounds) {
      return;
    }
    entry.object.position.clamp(bounds.min, bounds.max);
  }

  function updateDraggedObject(entry, point) {
    const dragAnchor = resolveDragAnchor(entry);
    entry.object.updateMatrixWorld(true);
    getWorldPosition(dragAnchor, anchorWorld);
    entry.object.position.add(point.clone().sub(anchorWorld));
    clampObjectPosition(entry);
  }

  function setHovered(id) {
    state.hovered = id;
    if (!domElement) {
      return;
    }
    if (state.dragging) {
      domElement.style.cursor = 'grabbing';
      return;
    }
    domElement.style.cursor = id ? 'grab' : 'default';
  }

  function onPointerDown(event) {
    if (!state.enabled || state.dragging || !domElement) {
      return;
    }
    const id = pick(event);
    if (!id) {
      return;
    }
    const entry = entries.get(id);
    if (!entry || entry.draggable === false) {
      return;
    }
    if (entry.canDragStart?.({ id, entry, event, state }) === false) {
      setHovered(id);
      return;
    }
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }

    state.pointerHeld = true;
    state.pointerId = event.pointerId ?? null;
    state.dragging = id;

    setControlsDragging(controls, true);
    setPointerCaptureSafe(domElement, event.pointerId);
    setHovered(id);

    entry.onDragStart?.({ id, entry, event });
  }

  function onPointerMove(event) {
    if (!state.enabled || !domElement) {
      return;
    }

    updatePointerFromEvent(event, domElement, pointer);
    raycaster.setFromCamera(pointer, camera);

    if (!state.dragging) {
      if (!state.pointerHeld) {
        setHovered(pick(event));
      }
      return;
    }

    const id = state.dragging;
    const entry = entries.get(id);
    if (!entry) {
      return;
    }

    const plane = entry.dragPlane ?? defaultDragPlane;
    if (!raycaster.ray.intersectPlane(plane, dragPoint)) {
      return;
    }

    updateDraggedObject(entry, dragPoint);
    entry.onDrag?.({ id, entry, event, point: dragPoint });
  }

  function endDrag(event, canceled = false) {
    releasePointerCaptureSafe(domElement, event?.pointerId);

    if (state.pointerId != null && event?.pointerId != null && state.pointerId !== event.pointerId) {
      return;
    }

    state.pointerHeld = false;
    state.pointerId = null;

    if (!state.dragging) {
      setControlsDragging(controls, false);
      setHovered(state.hovered);
      return;
    }

    const id = state.dragging;
    state.dragging = null;
    setControlsDragging(controls, false);
    setHovered(pick(event));

    const entry = entries.get(id);
    entry?.onDragEnd?.({ id, entry, event, canceled });
  }

  function onPointerUp(event) {
    if (!state.enabled || !domElement) {
      return;
    }
    endDrag(event, false);
  }

  function onPointerCancel(event) {
    if (!state.enabled || !domElement) {
      return;
    }
    endDrag(event, true);
  }

  function onLostPointerCapture() {
    if (!state.enabled || !domElement) {
      return;
    }
    endDrag(null, true);
  }

  function onPointerLeave() {
    if (!state.pointerHeld && !state.dragging) {
      setHovered(null);
    }
  }

  function install() {
    if (!domElement) {
      return;
    }
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('pointercancel', onPointerCancel);
    domElement.addEventListener('lostpointercapture', onLostPointerCapture);
    domElement.addEventListener('pointerleave', onPointerLeave);
  }

  function dispose() {
    if (!domElement) {
      return;
    }
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointerup', onPointerUp);
    domElement.removeEventListener('pointercancel', onPointerCancel);
    window.removeEventListener('pointercancel', onPointerCancel);
    domElement.removeEventListener('lostpointercapture', onLostPointerCapture);
    domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  function register({
    id,
    object,
    pickObjects = null,
    anchors = null,
    dragAnchor = null,
    dragPlane = null,
    bounds = null,
    draggable = true,
    canDragStart,
    onDragStart,
    onDrag,
    onDragEnd,
  }) {
    if (!id || !object) {
      return null;
    }
    const entry = {
      id,
      object,
      pickObjects: Array.isArray(pickObjects) && pickObjects.length ? pickObjects : [object],
      anchors,
      dragAnchor,
      dragPlane,
      bounds,
      draggable,
      canDragStart,
      onDragStart,
      onDrag,
      onDragEnd,
    };
    entries.set(id, entry);
    for (const pickObject of entry.pickObjects) {
      rootToId.set(pickObject, id);
    }
    return entry;
  }

  function unregister(id) {
    const entry = entries.get(id);
    if (!entry) {
      return false;
    }
    entries.delete(id);
    for (const pickObject of entry.pickObjects || [entry.object]) {
      rootToId.delete(pickObject);
    }
    if (state.hovered === id) {
      setHovered(null);
    }
    if (state.dragging === id) {
      state.dragging = null;
      setControlsDragging(controls, false);
    }
    return true;
  }

  install();

  return {
    state,
    register,
    unregister,
    dispose,
    setEnabled(enabled) {
      state.enabled = Boolean(enabled);
      if (!state.enabled) {
        setHovered(null);
        setControlsDragging(controls, false);
        state.dragging = null;
        state.pointerHeld = false;
        state.pointerId = null;
        if (domElement) {
          domElement.style.cursor = 'default';
        }
      }
    },
  };
}
