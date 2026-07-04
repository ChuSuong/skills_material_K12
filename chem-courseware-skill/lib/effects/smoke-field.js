import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createSmokeField({
  parent,
  count = 150,
  color = 0x9aa0a6,
  size = 1.15,
  opacity = 0.34,
  spread = [0.7, 0.12, 0.7],
  velocity = [0.14, 0.16, 0.14],
  lifetime = [2.2, 4.6],
  driftStrength = 0.1,
  scaleRange = [0.55, 2.95],
  alphaRange = [0.58, 0.08],
  name = 'smoke-field',
} = {}) {
  const texture = createSoftCircleTexture({
    inner: 'rgba(238,238,232,0.58)',
    middle: 'rgba(128,134,142,0.34)',
    outer: 'rgba(50,55,62,0)',
  });
  const pool = createParticlePool({ parent, count, texture, color, size, opacity, name });
  const spreadVector = new THREE.Vector3(...spread);
  const velocityVector = new THREE.Vector3(...velocity);

  function burst(origin, intensity = 1, dt = 1 / 60) {
    const amount = Math.max(0, Math.round((2 + intensity * 9) * dt * 24));
    for (let index = 0; index < amount; index += 1) {
      pool.spawn({
        origin,
        spread: spreadVector,
        velocity: new THREE.Vector3(
          velocityVector.x,
          velocityVector.y + intensity * velocityVector.y * 1.5,
          velocityVector.z,
        ),
        lifetime,
      });
    }
  }

  function update(dt = 1 / 60, elapsed = 0) {
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 0.55 + index * 0.7) * dt * driftStrength;
      particle.origin.z += Math.cos(elapsed * 0.42 + index * 0.5) * dt * driftStrength;
      particle.velocity.y *= 0.992;
      pool.scales[index] = scaleRange[0] + t * Math.max(0.01, scaleRange[1] - scaleRange[0]);
      pool.alphas[index] = (1 - t) * (alphaRange[0] + Math.sin(index) * alphaRange[1]);
    });
  }

  return { ...pool, burst, update };
}
