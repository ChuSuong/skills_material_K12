import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createSteamField({
  parent,
  count = 120,
  color = 0xffffff,
  size = 1.1,
  opacity = 0.28,
  name = 'steam-field',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(255,255,255,0.78)',
    middle: 'rgba(220,230,235,0.36)',
    outer: 'rgba(220,230,235,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((2 + intensity * 10) * dt * 26));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: new THREE.Vector3(1.2, 0.28, 1.2),
        velocity: new THREE.Vector3(0.18, 0.26 + intensity * 0.32, 0.18),
        lifetime: [1.5, 3.2],
      });
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 0.9 + index) * dt * 0.08;
      particle.origin.z += Math.cos(elapsed * 0.7 + index * 0.7) * dt * 0.08;
      pool.scales[index] = 0.8 + t * 1.8;
      pool.alphas[index] = (1 - t) * 0.6;
    });
  }

  return { ...pool, burst, update };
}
