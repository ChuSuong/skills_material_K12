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
