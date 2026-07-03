import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  makeAnchor,
} from './shared.js';

export function createClassicCopperPieceApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.28,
  length = 1.24,
  thickness = 0.035,
  materials = {},
  name = 'classic-copper-piece',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const copperMaterial = cloneMaterial(
    materials.copper,
    new THREE.MeshStandardMaterial({
      color: 0xb87333,
      roughness: 0.28,
      metalness: 0.84,
    }),
  );

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(width, length, thickness),
    copperMaterial,
  );
  strip.castShadow = true;
  strip.receiveShadow = true;
  group.add(strip);

  const anchors = {
    gripAnchor: makeAnchor(group, 0, length * 0.24, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, 0, 0, `${name}:interactionZone`),
    sampleZone: makeAnchor(group, 0, -length * 0.18, 0, `${name}:sampleZone`),
    labelAnchor: makeAnchor(group, width * 2.3, length * 0.28, 0, `${name}:labelAnchor`),
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'classic-copper-piece',
    family: 'showcase-metal-sample',
    capabilities: ['solid-sample', 'metal-sample', 'grip-point', 'effect-origin', 'label-anchor', 'interaction-anchor', 'manual-placement'],
    constraints: {
      bounds: { width, length, thickness },
    },
    anchors,
    meshes: { strip },
    state: {},
    meta: { visualFamily: 'classic-showcase' },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.06, 0.36),
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#b96838' });
  return apparatus;
}
