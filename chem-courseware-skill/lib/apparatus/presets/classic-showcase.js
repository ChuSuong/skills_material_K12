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

export function latheFromProfile(points2d, radialSegments = 96) {
  const vecs = points2d.map((p) => new THREE.Vector2(Math.max(0.0001, p[0]), p[1]));
  return new THREE.LatheGeometry(vecs, radialSegments);
}

export function closedShellProfile(outerProfile, wallThickness = 0.03) {
  const outer = outerProfile.map((p) => [Math.max(0.0001, p[0]), p[1]]);
  const top = outer[outer.length - 1];
  const bottom = outer[0];
  const inner = [];
  for (let i = outer.length - 1; i >= 0; i -= 1) {
    const [x, y] = outer[i];
    const shrunkX = Math.max(0.0001, x - wallThickness);
    const shiftedY = i === 0 ? y + wallThickness : y - (i === outer.length - 1 ? 0.0001 : 0);
    inner.push([shrunkX, shiftedY]);
  }
  return [
    ...outer,
    [Math.max(0.0001, top[0] - wallThickness), top[1] - 0.0001],
    ...inner.slice(1),
    [0.0001, bottom[1] + wallThickness],
  ];
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
