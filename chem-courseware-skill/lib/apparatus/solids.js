import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSolidAppearance(config) {
  return {
    kind: 'solid',
    ...config,
    createGranuleMaterial(overrides = {}) {
      return new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: config.roughness ?? 0.6,
        metalness: config.metalness ?? 0.2,
        flatShading: config.flatShading ?? true,
        ...overrides,
      });
    },
  };
}

export function zincGranules() {
  return buildSolidAppearance({
    name: 'zincGranules',
    color: 0x8f97a2,
    size: 0.11,
    roughness: 0.58,
    metalness: 0.42,
    count: 110,
    mound: 4.5,
  });
}

export function ironFilings() {
  return buildSolidAppearance({
    name: 'ironFilings',
    color: 0x3c4147,
    size: 0.075,
    roughness: 0.72,
    metalness: 0.5,
    count: 140,
    mound: 4.2,
  });
}

export function copperTurnings() {
  return buildSolidAppearance({
    name: 'copperTurnings',
    color: 0xb95c2b,
    size: 0.13,
    roughness: 0.38,
    metalness: 0.68,
    count: 90,
    mound: 4.6,
  });
}

export function magnesiumRibbon() {
  return buildSolidAppearance({
    name: 'magnesiumRibbon',
    color: 0xcfd2d6,
    size: 0.09,
    roughness: 0.46,
    metalness: 0.55,
    count: 60,
    mound: 3.8,
  });
}

export function sulfurPowder() {
  return buildSolidAppearance({
    name: 'sulfurPowder',
    color: 0xe6c34a,
    size: 0.045,
    roughness: 0.9,
    metalness: 0.02,
    count: 220,
    mound: 3.6,
    flatShading: false,
  });
}

export function copperOxidePowder() {
  return buildSolidAppearance({
    name: 'copperOxidePowder',
    color: 0x1a1c22,
    size: 0.05,
    roughness: 0.88,
    metalness: 0.08,
    count: 200,
    mound: 3.6,
    flatShading: false,
  });
}

export function calciumCarbonateChips() {
  return buildSolidAppearance({
    name: 'calciumCarbonateChips',
    color: 0xeae2d0,
    size: 0.14,
    roughness: 0.68,
    metalness: 0.04,
    count: 70,
    mound: 4.4,
  });
}

export function sodiumChunk() {
  return buildSolidAppearance({
    name: 'sodiumChunk',
    color: 0xd6d7d9,
    size: 0.18,
    roughness: 0.36,
    metalness: 0.6,
    count: 6,
    mound: 2.4,
  });
}

export const solidPresets = {
  zincGranules,
  ironFilings,
  copperTurnings,
  magnesiumRibbon,
  sulfurPowder,
  copperOxidePowder,
  calciumCarbonateChips,
  sodiumChunk,
};

export function resolveSolidAppearance(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const factory = solidPresets[input];
    return factory ? factory() : null;
  }
  if (typeof input === 'function') return input();
  if (typeof input === 'object' && input.kind === 'solid') return input;
  return null;
}

export function createGranulePile({
  parent,
  radius = 0.4,
  appearance,
  baseY = 0,
  count,
  seed = 1337,
  jitter = 0.35,
  material,
  name = 'granule-pile',
} = {}) {
  const resolved = resolveSolidAppearance(appearance) ?? zincGranules();
  const instanceCount = Math.max(1, Math.round(count ?? resolved.count ?? 90));
  const granuleMaterial = material ?? resolved.createGranuleMaterial();
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const mesh = new THREE.InstancedMesh(geometry, granuleMaterial, instanceCount);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const rand = mulberry32(seed);
  const dummy = new THREE.Object3D();
  const baseSize = resolved.size ?? 0.1;
  const mound = resolved.mound ?? 4.2;

  for (let i = 0; i < instanceCount; i += 1) {
    const r = Math.sqrt(rand()) * radius;
    const angle = rand() * Math.PI * 2;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const pileH = (1 - r / Math.max(radius, 0.0001)) * baseSize * mound;
    const y = baseY + pileH + (rand() - 0.5) * baseSize * jitter;
    dummy.position.set(x, y, z);
    dummy.rotation.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
    const s = baseSize * (0.7 + rand() * 0.6);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;

  if (parent) {
    parent.add(mesh);
  }

  return { mesh, appearance: resolved, instanceCount };
}
