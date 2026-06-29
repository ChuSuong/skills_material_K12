import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createFunnelApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.34,
  coneHeight = 0.34,
  stemLength = 0.5,
  stemRadius = 0.06,
  materials = {},
  name = 'funnel',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(radius, coneHeight, 24, 1, true),
    glassMaterial
  );
  cone.position.y = -coneHeight * 0.5;
  cone.rotation.x = Math.PI;
  group.add(cone);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(stemRadius, stemRadius, stemLength, 18),
    cloneMaterial(materials.stem, glassMaterial)
  );
  stem.position.y = -coneHeight - stemLength * 0.5 + 0.02;
  group.add(stem);

  const apparatus = composeApparatus({
    kind: 'funnel',
    family: 'transfer-tool',
    group,
    meshes: { cone, stem },
    anchors: {
      labelAnchor: makeAnchor(group, 0, 0.28, 0, `${name}:labelAnchor`),
      gripAnchor: makeAnchor(group, 0, -coneHeight * 0.18, 0, `${name}:gripAnchor`),
      interactionZone: makeAnchor(group, 0, -0.04, 0, `${name}:interactionZone`),
      mouth: makeAnchor(group, 0, 0, 0, `${name}:mouth`),
      entry: makeAnchor(group, 0, -0.04, 0, `${name}:entry`),
      exit: makeAnchor(group, 0, -coneHeight - stemLength + 0.08, 0, `${name}:exit`),
      nozzle: makeAnchor(group, 0, -coneHeight - stemLength + 0.02, 0, `${name}:nozzle`),
    },
    constraints: {
      safePourRadius: radius * 0.74,
      safePourClearance: 0.08,
      effectBounds: {
        min: new THREE.Vector3(-radius, -coneHeight - stemLength, -radius),
        max: new THREE.Vector3(radius, 0.2, radius),
      },
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: apparatus.anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.82, 0.32),
    role: 'floating-badge',
  });
  apparatus.controllers = {};
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  apparatus.validators = [];
  return apparatus;
}
