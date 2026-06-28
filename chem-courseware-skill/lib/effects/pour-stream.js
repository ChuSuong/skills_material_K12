import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function resolveWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

export function createPourStream({
  parent,
  color = 0xbcecff,
  radius = 0.055,
  opacity = 0.72,
  emissive = 0x67d8ff,
  name = 'pour-stream',
} = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.5, 1, 18),
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity,
      emissive,
      emissiveIntensity: 0.42,
      roughness: 0.08,
      transmission: 0.25,
    }),
  );
  mesh.name = name;
  mesh.visible = false;
  mesh.castShadow = false;
  parent?.add(mesh);

  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  function setEndpoints(source, target, intensity = 1) {
    resolveWorldPosition(source, start);
    resolveWorldPosition(target, end);
    direction.copy(end).sub(start);
    const length = direction.length();
    if (length <= 0.01 || intensity <= 0.01) {
      mesh.visible = false;
      return false;
    }
    midpoint.copy(start).lerp(end, 0.5);
    mesh.position.copy(midpoint);
    mesh.scale.set(1, length, 1);
    mesh.quaternion.setFromUnitVectors(yAxis, direction.normalize());
    mesh.material.opacity = opacity * Math.min(1, intensity);
    mesh.visible = true;
    return true;
  }

  function reset() {
    mesh.visible = false;
    mesh.scale.set(1, 1, 1);
    mesh.quaternion.identity();
  }

  return { mesh, setEndpoints, reset };
}
