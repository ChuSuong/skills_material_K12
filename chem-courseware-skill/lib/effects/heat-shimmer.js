import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function createHeatShimmer({
  parent,
  radius = 0.42,
  height = 0.85,
  color = 0xffd18a,
  opacity = 0.2,
  name = 'heat-shimmer',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  group.visible = false;
  parent?.add(group);

  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const ribbons = [];
  for (let index = 0; index < 4; index += 1) {
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(radius * 0.42, height, 8, 1), material.clone());
    ribbon.position.y = height * 0.5;
    ribbon.rotation.y = (Math.PI / 4) * index;
    ribbon.userData.phase = index * 1.7;
    group.add(ribbon);
    ribbons.push(ribbon);
  }

  function setIntensity(intensity = 0, elapsed = 0) {
    const value = Math.max(0, Math.min(1, intensity));
    group.visible = value > 0.01;
    for (const ribbon of ribbons) {
      const wave = Math.sin(elapsed * 4.2 + ribbon.userData.phase);
      ribbon.scale.set(1 + wave * 0.18, 1 + value * 0.22, 1);
      ribbon.position.x = Math.sin(elapsed * 2.5 + ribbon.userData.phase) * radius * 0.08;
      ribbon.material.opacity = opacity * value * (0.72 + wave * 0.16);
    }
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

  return { group, ribbons, setIntensity, positionAt, reset };
}
