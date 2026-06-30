import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createSmokeField({
  parent,
  count = 150,
  color = 0x9aa0a6,
  size = 1.15,
  opacity = 0.34,
  name = 'smoke-field',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(238,238,232,0.58)',
    middle: 'rgba(128,134,142,0.34)',
    outer: 'rgba(50,55,62,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((2 + intensity * 9) * dt * 24));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: new THREE.Vector3(0.7, 0.12, 0.7),
        velocity: new THREE.Vector3(0.14, 0.16 + intensity * 0.24, 0.14),
        lifetime: [2.2, 4.6],
      });
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 0.55 + index * 0.7) * dt * 0.1;
      particle.origin.z += Math.cos(elapsed * 0.42 + index * 0.5) * dt * 0.1;
      particle.velocity.y *= 0.992;
      pool.scales[index] = 0.55 + t * 2.4;
      pool.alphas[index] = (1 - t) * (0.58 + Math.sin(index) * 0.08);
    });
  }

  return { ...pool, burst, update };
}
