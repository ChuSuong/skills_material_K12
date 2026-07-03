import {
  THREE,
  cloneMaterial,
} from './shared.js';

export function createClassicGlassMaterial(materials = {}) {
  return cloneMaterial(
    materials.glass,
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      transmission: 0.9,
      roughness: 0.08,
      thickness: 0.08,
      ior: 1.38,
      clearcoat: 0.28,
      clearcoatRoughness: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
}

export function createClassicLiquidMaterial(materials = {}, color = 0xe8f8ff) {
  return cloneMaterial(
    materials.liquid,
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.82,
      roughness: 0.18,
      metalness: 0.04,
      depthWrite: false,
      depthTest: false,
    }),
  );
}

export function createClassicLiquidSurfaceMaterial(materials = {}, color = 0xf8fdff) {
  return cloneMaterial(
    materials.surface,
    new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      roughness: 0.08,
      metalness: 0.02,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    }),
  );
}

export function createClassicGlassRimMaterial(materials = {}) {
  return cloneMaterial(
    materials.glassRim,
    new THREE.MeshStandardMaterial({
      color: 0xe9f2f8,
      roughness: 0.22,
      metalness: 0.03,
    }),
  );
}

export function createClassicShadowMaterial(materials = {}) {
  return cloneMaterial(
    materials.shadow,
    new THREE.MeshBasicMaterial({
      color: 0x08111c,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
}

export function createRoundedTubeGeometry(
  radius,
  height,
  {
    radialSegments = 48,
    curveSegments = 14,
    centered = false,
  } = {},
) {
  const points = [];
  const baseY = centered ? (-height * 0.5) : 0;
  const topY = baseY + height;
  for (let index = 0; index <= curveSegments; index += 1) {
    const t = index / Math.max(curveSegments, 1);
    const angle = (Math.PI * 0.5) - (t * Math.PI * 0.5);
    const x = Math.max(0.0001, Math.cos(angle) * radius);
    const y = baseY + Math.sin(angle) * radius;
    points.push(new THREE.Vector2(x, y));
  }
  points.push(new THREE.Vector2(radius, topY));
  return new THREE.LatheGeometry(points, radialSegments);
}
