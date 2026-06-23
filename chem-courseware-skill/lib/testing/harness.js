import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function getCanvasBox(renderer) {
  return renderer.domElement.getBoundingClientRect();
}

export function canvasPoint(renderer, nx, ny) {
  const rect = getCanvasBox(renderer);
  return {
    x: rect.left + rect.width * nx,
    y: rect.top + rect.height * ny,
  };
}

export function projectWorldToCanvas(target, camera, renderer, offset = new THREE.Vector3()) {
  const rect = getCanvasBox(renderer);
  const anchor = typeof target.getWorldPosition === 'function'
    ? target.getWorldPosition(new THREE.Vector3())
    : target.clone();
  const projected = anchor.add(offset).project(camera);
  return {
    x: rect.left + ((projected.x + 1) * 0.5) * rect.width,
    y: rect.top + ((-projected.y + 1) * 0.5) * rect.height,
  };
}

export function installFlameTestHarness({ state, mapState, getPaths }) {
  window.__flameTestApi = {
    getState() {
      return mapState(state);
    },
    ...getPaths(),
  };

  return window.__flameTestApi;
}
