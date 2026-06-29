import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

function buildAppearance(config) {
  return {
    ...config,
    createLiquidMaterial(overrides = {}) {
      return new THREE.MeshPhysicalMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        transmission: config.transmission,
        roughness: config.roughness,
        thickness: config.thickness,
        ...overrides,
      });
    },
    createSurfaceMaterial(overrides = {}) {
      return new THREE.MeshStandardMaterial({
        color: config.surfaceColor,
        transparent: true,
        opacity: config.surfaceOpacity,
        roughness: config.surfaceRoughness ?? 0.2,
        ...overrides,
      });
    },
    createPointsMaterial(overrides = {}) {
      return new THREE.PointsMaterial({
        color: config.effectColor ?? config.surfaceColor,
        size: config.effectSize ?? 0.04,
        transparent: true,
        opacity: config.effectOpacity ?? Math.min(config.opacity, 0.5),
        depthWrite: false,
        ...overrides,
      });
    },
    createGlowMaterial(overrides = {}) {
      return new THREE.MeshStandardMaterial({
        color: config.effectColor ?? config.surfaceColor,
        emissive: config.effectColor ?? config.surfaceColor,
        emissiveIntensity: config.emissiveIntensity ?? 0.6,
        transparent: true,
        opacity: config.effectOpacity ?? Math.min(config.opacity, 0.6),
        ...overrides,
      });
    },
  };
}

export function clearWater() {
  return buildAppearance({
    name: 'clearWater',
    color: 0x9ddfff,
    opacity: 0.38,
    transmission: 0.72,
    roughness: 0.1,
    thickness: 0.18,
    surfaceColor: 0xe6f8ff,
    surfaceOpacity: 0.28,
    effectColor: 0xdff8ff,
  });
}

export function diluteAcid() {
  return buildAppearance({
    name: 'diluteAcid',
    color: 0xdff5ff,
    opacity: 0.52,
    transmission: 0.52,
    roughness: 0.08,
    thickness: 0.24,
    surfaceColor: 0xc9efff,
    surfaceOpacity: 0.34,
    effectColor: 0xe6fbff,
  });
}

export function blueSolution() {
  return buildAppearance({
    name: 'blueSolution',
    color: 0x6ab9ff,
    opacity: 0.6,
    transmission: 0.26,
    roughness: 0.14,
    thickness: 0.2,
    surfaceColor: 0xaadfff,
    surfaceOpacity: 0.44,
    effectColor: 0xc4ebff,
  });
}

export function yellowPrecipitate() {
  return buildAppearance({
    name: 'yellowPrecipitate',
    color: 0xe9d27f,
    opacity: 0.7,
    transmission: 0.04,
    roughness: 0.82,
    thickness: 0.08,
    surfaceColor: 0xf3de98,
    surfaceOpacity: 0.54,
    effectColor: 0xf1e1a7,
    effectSize: 0.05,
    effectOpacity: 0.28,
  });
}

export function denseSteam() {
  return buildAppearance({
    name: 'denseSteam',
    color: 0xffffff,
    opacity: 0.18,
    transmission: 0.02,
    roughness: 1,
    thickness: 0.02,
    surfaceColor: 0xf4f8fc,
    surfaceOpacity: 0.12,
    effectColor: 0xf6fbff,
    effectSize: 0.08,
    effectOpacity: 0.2,
  });
}

export function burnerFlame() {
  return buildAppearance({
    name: 'burnerFlame',
    color: 0xffb347,
    opacity: 0.68,
    transmission: 0.02,
    roughness: 0.24,
    thickness: 0.04,
    surfaceColor: 0xffd29a,
    surfaceOpacity: 0.44,
    effectColor: 0xff9c2f,
    effectSize: 0.09,
    effectOpacity: 0.48,
    emissiveIntensity: 1.1,
  });
}
