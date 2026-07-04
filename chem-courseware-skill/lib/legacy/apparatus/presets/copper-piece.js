import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  makeAnchor,
  attachFixedPlaneLabel,
  attachLabelController,
} from '../../../apparatus/presets/shared.js';

export function createCopperPieceApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.2,
  length = 0.4,
  thickness = 0.02,
  materials = {},
  name = 'copper-piece',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const copperMaterial = cloneMaterial(
    materials.copper,
    new THREE.MeshStandardMaterial({
      color: 0xb96838,
      roughness: 0.4,
      metalness: 0.8,
    })
  );

  const shape = new THREE.Mesh(
    new THREE.BoxGeometry(width, length, thickness),
    copperMaterial
  );
  group.add(shape);

  const anchors = {
    interactionZone: makeAnchor(group, 0, 0, 0),
    labelAnchor: makeAnchor(group, width * 1.5, length * 0.5, 0),
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'specimen',
    capabilities: ['draggable', 'reactive-surface'],
    constraints: { bounds: { width, length, thickness } },
    anchors,
    meshes: { shape },
    controllers: {},
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
  });
  
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#b96838' });

  return apparatus;
}

export const COPPER_PIECE_PRESET_DEFINITION = {
  id: 'copper-piece',
  factory: createCopperPieceApparatus,
};
