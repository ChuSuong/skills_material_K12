import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function createFlamePlume({
  parent,
  color = 0x5fd8ff,
  coreColor = 0xd8fbff,
  height = 0.72,
  radius = 0.16,
  opacity = 0.86,
  name = 'flame-plume',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  group.visible = false;
  parent?.add(group);

  const outer = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  outer.position.y = height * 0.5;
  group.add(outer);

  const core = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.48, height * 0.72, 24),
    new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  core.position.y = height * 0.36;
  group.add(core);

  function setIntensity(intensity = 0, elapsed = 0) {
    const value = Math.max(0, Math.min(1, intensity));
    group.visible = value > 0.01;
    const flicker = 1 + Math.sin(elapsed * 15.5) * 0.055 + Math.cos(elapsed * 9.1) * 0.035;
    group.scale.set(radius > 0 ? flicker : 1, 1 + value * 0.18, radius > 0 ? 1 / flicker : 1);
    outer.material.opacity = opacity * value;
    core.material.opacity = Math.min(1, (opacity + 0.08) * value);
  }

  function positionAt(target) {
    if (typeof target?.getWorldPosition === 'function') {
      target.getWorldPosition(group.position);
    } else if (target?.isVector3) {
      group.position.copy(target);
    }
  }

  function reset() {
    setIntensity(0, 0);
  }

  return { group, outer, core, setIntensity, positionAt, reset };
}
