import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createBubbleField({
  parent,
  count = 120,
  color = 0xd8f5ff,
  size = 0.24,
  opacity = 0.82,
  name = 'bubble-field',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(255,255,255,0.96)',
    middle: 'rgba(196,239,255,0.78)',
    outer: 'rgba(127,205,255,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((3 + intensity * 14) * dt * 30));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: new THREE.Vector3(0.7, 0.12, 0.7),
        velocity: new THREE.Vector3(0.12, 0.45 + intensity * 0.55, 0.12),
        lifetime: [0.45, 1.1],
      });
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.velocity.y += dt * 0.2;
      particle.velocity.x *= 0.98;
      particle.velocity.z *= 0.98;
      pool.scales[index] = (1 - t) * (0.55 + Math.sin((index + elapsed) * 1.7) * 0.08);
      pool.alphas[index] = 1 - t;
    });
  }

  return { ...pool, burst, update };
}
