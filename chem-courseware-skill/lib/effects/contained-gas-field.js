import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createParticlePool, createSoftCircleTexture } from './particle-pool.js';

export function createContainedGasField({
  parent,
  count = 96,
  color = 0xdce870,
  size = 0.16,
  opacity = 0.28,
  name = 'contained-gas-field',
  radius = 0.28,
  halfHeight = 0.46,
  visualPadding = size * 0.7,
  scaleFrom = 0.36,
  scaleTo = 0.74,
  emitRate = 22,
  rise = 0.035,
  texture = null,
  textureOptions = {},
} = {}) {
  const gasTexture = texture || createSoftCircleTexture({
    inner: 'rgba(245,248,184,0.34)',
    middle: 'rgba(216,232,106,0.18)',
    outer: 'rgba(216,232,106,0)',
    ...textureOptions,
  });
  const pool = createParticlePool({ parent, count, texture: gasTexture, color, size, opacity, name });
  const lastCenter = new THREE.Vector3();

  function clampToVessel(particle, center) {
    const safeRadius = Math.max(0.01, radius - visualPadding);
    const safeHalfHeight = Math.max(0.01, halfHeight - visualPadding);
    const dx = particle.origin.x - center.x;
    const dz = particle.origin.z - center.z;
    const radial = Math.hypot(dx, dz);
    if (radial > safeRadius) {
      const scale = safeRadius / Math.max(radial, 0.001);
      particle.origin.x = center.x + dx * scale;
      particle.origin.z = center.z + dz * scale;
    }
    particle.origin.y = Math.max(center.y - safeHalfHeight, Math.min(center.y + safeHalfHeight, particle.origin.y));
  }

  function emit(origin, intensity = 0.3, dt = 1 / 60) {
    lastCenter.copy(origin);
    const amount = Math.max(0, Math.round((1 + intensity * 6) * dt * emitRate));
    for (let index = 0; index < amount; index += 1) {
      const particle = pool.spawn({
        origin,
        spread: new THREE.Vector3(Math.max(0.01, radius - visualPadding) * 1.7, Math.max(0.01, halfHeight - visualPadding), Math.max(0.01, radius - visualPadding) * 1.7),
        velocity: new THREE.Vector3(0.028, rise + intensity * 0.035, 0.028),
        lifetime: [1.2, 2.6],
      });
      if (particle) {
        clampToVessel(particle, lastCenter);
      }
    }
  }

  function update(dt = 1 / 60, elapsed = 0, center = lastCenter) {
    lastCenter.copy(center);
    pool.update(dt, (particle, t, index) => {
      particle.origin.addScaledVector(particle.velocity, dt);
      particle.origin.x += Math.sin(elapsed * 0.7 + index * 0.41) * dt * 0.035;
      particle.origin.z += Math.cos(elapsed * 0.62 + index * 0.37) * dt * 0.035;
      clampToVessel(particle, lastCenter);
      particle.velocity.y *= 0.988;
      pool.scales[index] = scaleFrom + t * (scaleTo - scaleFrom);
      pool.alphas[index] = (1 - t) * 0.72;
    });
  }

  return { ...pool, emit, update };
}
