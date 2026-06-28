import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function createGlowRing({
  parent,
  radius = 1.2,
  tube = 0.05,
  color = 0x73d7ff,
  opacity = 0.22,
  name = 'glow-ring',
} = {}) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 60),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = name;
  mesh.rotation.x = Math.PI / 2;
  parent?.add(mesh);

  function setIntensity(intensity = 0, elapsed = 0) {
    const value = Math.max(0, Math.min(1, intensity));
    mesh.material.opacity = value <= 0 ? 0 : opacity * value + Math.sin(elapsed * 6.2) * 0.03 * value;
    mesh.scale.setScalar(1 + value * 0.1);
  }

  function reset() {
    mesh.material.opacity = 0;
    mesh.scale.setScalar(1);
  }

  return { mesh, setIntensity, reset };
}
