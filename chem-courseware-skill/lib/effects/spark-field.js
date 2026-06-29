import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createSparkField({
  parent,
  count = 72,
  color = 0xffb84f,
  size = 0.18,
  opacity = 0.72,
  name = 'spark-field',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(255,247,212,1)',
    middle: 'rgba(255,184,79,0.84)',
    outer: 'rgba(255,184,79,0)',
  });
  const pool = createParticlePool({
    parent,
    count,
    texture,
    color,
    size,
    opacity,
    blending: THREE.AdditiveBlending,
    name,
  });

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((0.4 + intensity * 3.2) * dt * 18));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: new THREE.Vector3(0.8, 0.12, 0.8),
        velocity: new THREE.Vector3(0.35, 0.35 + intensity * 0.32, 0.35),
        lifetime: [0.25, 0.6],
      });
    }
  }

  function update(dt = 1 / 60) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.velocity.y -= dt * 0.7;
      pool.scales[index] = (1 - t) * 0.85;
      pool.alphas[index] = (1 - t) * 0.9;
    });
  }

  return { ...pool, burst, update };
}
