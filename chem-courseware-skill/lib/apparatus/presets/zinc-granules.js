import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  cloneMaterial,
  makeAnchor,
  attachFixedPlaneLabel,
  attachLabelController,
} from './shared.js';

export function createZincGranulesApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.035,
  spread = 0.085,
  count = 9,
  materials = {},
  name = 'zinc-granules',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const zincMaterial = cloneMaterial(
    materials.zinc,
    new THREE.MeshStandardMaterial({
      color: 0xc7d0d6,
      roughness: 0.58,
      metalness: 0.72,
    })
  );
  const darkSideMaterial = cloneMaterial(
    materials.darkSide,
    new THREE.MeshStandardMaterial({
      color: 0x8f9aa1,
      roughness: 0.72,
      metalness: 0.55,
    })
  );

  const granules = [];
  const baseScales = [];
  const baseColors = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (index / Math.max(1, count)) * Math.PI * 2;
    const ring = index === 0 ? 0 : spread * (0.42 + (index % 3) * 0.16);
    const granule = new THREE.Mesh(
      new THREE.SphereGeometry(radius * (0.78 + (index % 4) * 0.08), 12, 8),
      index % 4 === 0 ? darkSideMaterial : zincMaterial
    );
    granule.position.set(
      Math.cos(angle) * ring,
      (index % 3) * radius * 0.34,
      Math.sin(angle) * ring * 0.82
    );
    granule.scale.set(1.15, 0.72 + (index % 2) * 0.18, 0.9);
    granule.castShadow = true;
    granule.receiveShadow = true;
    group.add(granule);
    granules.push(granule);
    baseScales.push(granule.scale.clone());
    baseColors.push(granule.material.color.clone());
  }

  const anchors = {
    interactionZone: makeAnchor(group, 0, radius * 0.45, 0, `${name}:interactionZone`),
    effectOrigin: makeAnchor(group, 0, radius * 0.56, 0, `${name}:effectOrigin`),
    labelAnchor: makeAnchor(group, spread * 1.5, radius * 1.8, 0, `${name}:labelAnchor`),
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'zinc-granules',
    family: 'solid-metal-sample',
    capabilities: ['solid-sample', 'metal-sample', 'reactive-surface', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    constraints: {
      bounds: {
        width: spread * 2 + radius * 2,
        length: spread * 2 + radius * 2,
        height: radius * 2.5,
      },
    },
    anchors,
    meshes: { granules },
    controllers: {},
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
  });

  apparatus.controllers.setCorrosionProgress = (progress = 0) => {
    const value = Math.max(0, Math.min(1, progress));
    for (const [index, granule] of granules.entries()) {
      granule.scale.copy(baseScales[index]).multiplyScalar(1 - value * 0.08);
      if (granule.material?.color) {
        granule.material.color.copy(baseColors[index]).lerp(new THREE.Color(0xa9b2b8), value * 0.18);
      }
    }
  };

  attachLabelController(apparatus, labelPlane, { defaultAccent: '#d8dde6' });
  return apparatus;
}

export const ZINC_GRANULES_PRESET_DEFINITION = {
  id: 'zinc-granules',
  factory: createZincGranulesApparatus,
};
