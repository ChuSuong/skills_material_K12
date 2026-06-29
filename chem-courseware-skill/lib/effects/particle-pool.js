import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function createSpriteTexture(draw, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSoftCircleTexture({
  inner = 'rgba(255,255,255,0.95)',
  middle = 'rgba(196,239,255,0.65)',
  outer = 'rgba(127,205,255,0)',
} = {}) {
  return createSpriteTexture((ctx, size) => {
    const gradient = ctx.createRadialGradient(
      size * 0.48,
      size * 0.42,
      size * 0.06,
      size * 0.5,
      size * 0.5,
      size * 0.48,
    );
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.48, middle);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });
}

export function createParticlePool({
  parent,
  count = 96,
  texture = null,
  color = 0xffffff,
  size = 0.22,
  opacity = 0.7,
  blending = THREE.NormalBlending,
  name = 'particle-pool',
} = {}) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const alphas = new Float32Array(count);
  positions.fill(9999);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const material = new THREE.PointsMaterial({
    map: texture,
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = name;
  points.frustumCulled = false;
  parent?.add(points);

  const particles = Array.from({ length: count }, () => ({
    active: false,
    life: 0,
    maxLife: 1,
    origin: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
  }));

  function reset() {
    positions.fill(9999);
    scales.fill(0);
    alphas.fill(0);
    for (const particle of particles) {
      particle.active = false;
      particle.life = 0;
      particle.maxLife = 1;
      particle.origin.set(0, 0, 0);
      particle.velocity.set(0, 0, 0);
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aScale.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }

  function spawn({
    origin = new THREE.Vector3(),
    spread = new THREE.Vector3(0.2, 0.2, 0.2),
    velocity = new THREE.Vector3(0.1, 0.5, 0.1),
    lifetime = [0.5, 1.1],
  } = {}) {
    const particle = particles.find((item) => !item.active);
    if (!particle) {
      return null;
    }
    particle.active = true;
    particle.life = 0;
    particle.maxLife = THREE.MathUtils.randFloat(lifetime[0], lifetime[1]);
    particle.origin.copy(origin).add(new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(spread.x),
      THREE.MathUtils.randFloatSpread(spread.y),
      THREE.MathUtils.randFloatSpread(spread.z),
    ));
    particle.velocity.set(
      THREE.MathUtils.randFloatSpread(velocity.x),
      velocity.y + Math.random() * velocity.y,
      THREE.MathUtils.randFloatSpread(velocity.z),
    );
    return particle;
  }

  function update(dt = 1 / 60, behavior = null) {
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const ix = index * 3;
      if (!particle.active) {
        positions[ix] = 9999;
        positions[ix + 1] = 9999;
        positions[ix + 2] = 9999;
        scales[index] = 0;
        alphas[index] = 0;
        continue;
      }
      particle.life += dt;
      const t = particle.life / Math.max(particle.maxLife, 0.001);
      if (t >= 1) {
        particle.active = false;
        positions[ix] = 9999;
        positions[ix + 1] = 9999;
        positions[ix + 2] = 9999;
        scales[index] = 0;
        alphas[index] = 0;
        continue;
      }
      if (behavior) {
        behavior(particle, t, index);
      } else {
        particle.origin.addScaledVector(particle.velocity, dt);
        scales[index] = 1 - t;
        alphas[index] = 1 - t;
      }
      positions[ix] = particle.origin.x;
      positions[ix + 1] = particle.origin.y;
      positions[ix + 2] = particle.origin.z;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aScale.needsUpdate = true;
    geometry.attributes.aAlpha.needsUpdate = true;
  }

  reset();

  return {
    points,
    geometry,
    material,
    particles,
    positions,
    scales,
    alphas,
    reset,
    spawn,
    update,
  };
}
