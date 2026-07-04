import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createPrecipitateCloud({
  parent,
  count = 170,
  color = 0xf0da78,
  size = 0.16,
  opacity = 0.72,
  name = 'precipitate-cloud',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(255,246,190,0.92)',
    middle: 'rgba(230,199,94,0.66)',
    outer: 'rgba(230,199,94,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((3 + intensity * 12) * dt * 24));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: new THREE.Vector3(0.72, 0.38, 0.72),
        velocity: new THREE.Vector3(0.06, 0.05 + intensity * 0.04, 0.06),
        lifetime: [2.4, 5.2],
      });
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 1.2 + index) * dt * 0.035;
      particle.origin.z += Math.cos(elapsed * 1.0 + index * 0.6) * dt * 0.035;
      particle.velocity.y -= dt * 0.035;
      pool.scales[index] = 0.55 + Math.sin(elapsed * 1.7 + index) * 0.12;
      pool.alphas[index] = Math.max(0, 1 - t * 0.82);
    });
  }

  return { ...pool, burst, update };
}
