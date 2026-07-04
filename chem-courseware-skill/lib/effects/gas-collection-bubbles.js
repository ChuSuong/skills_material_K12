import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createGasCollectionBubbles({
  parent,
  count = 130,
  color = 0xdff8ff,
  size = 0.2,
  opacity = 0.78,
  name = 'gas-collection-bubbles',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(255,255,255,0.96)',
    middle: 'rgba(192,238,255,0.72)',
    outer: 'rgba(116,202,255,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });
  const source = new THREE.Vector3(-0.6, 1.5, 0);
  const target = new THREE.Vector3(0.55, 2.05, 0);

  function setEndpoints(from, to) {
    if (typeof from?.getWorldPosition === 'function') {
      from.getWorldPosition(source);
    } else if (from?.isVector3) {
      source.copy(from);
    }
    if (typeof to?.getWorldPosition === 'function') {
      to.getWorldPosition(target);
    } else if (to?.isVector3) {
      target.copy(to);
    }
  }

  function burst(origin = source, intensity = 1, dt = 1 / 60) {
    const direction = target.clone().sub(source).normalize();
    const amount = Math.max(0, Math.round((2 + intensity * 10) * dt * 26));
    for (let index = 0; index < amount; index += 1) {
      const particle = pool.spawn({
        origin,
        spread: new THREE.Vector3(0.14, 0.1, 0.14),
        velocity: new THREE.Vector3(0.02, 0.02, 0.02),
        lifetime: [0.9, 1.8],
      });
      if (particle) {
        particle.velocity.copy(direction).multiplyScalar(0.42 + intensity * 0.55);
        particle.velocity.y += 0.1 + intensity * 0.14;
      }
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 2.2 + index) * dt * 0.05;
      particle.origin.z += Math.cos(elapsed * 2 + index * 0.4) * dt * 0.05;
      particle.velocity.y += dt * 0.05;
      pool.scales[index] = (1 - t) * (0.6 + t * 0.7);
      pool.alphas[index] = 1 - t;
    });
  }

  return { ...pool, source, target, setEndpoints, burst, update };
}
