import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createFilterPaperApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.38,
  height = 0.46,
  opacity = 0.82,
  name = 'filter-paper',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const paperMaterial = new THREE.MeshStandardMaterial({
    color: 0xfffbef,
    roughness: 0.92,
    metalness: 0,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 36, 1, true),
    paperMaterial,
  );
  cone.position.y = height * 0.5;
  cone.rotation.x = Math.PI;
  group.add(cone);

  const fold = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 1.32, height * 0.9),
    new THREE.MeshBasicMaterial({
      color: 0xd7caa6,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    }),
  );
  fold.position.y = height * 0.45;
  fold.rotation.x = -0.18;
  group.add(fold);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.98, 0.01, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0xf7efd9, transparent: true, opacity: 0.72 }),
  );
  rim.position.y = height;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.64, radius + 0.05, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.6, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height * 0.58, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height * 0.92, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, height * 0.92, 0, `${name}:pourTarget`),
    entry: makeAnchor(group, 0, height * 0.92, 0, `${name}:entry`),
    exit: makeAnchor(group, 0, 0.08, 0, `${name}:exit`),
    nozzle: makeAnchor(group, 0, 0.02, 0, `${name}:nozzle`),
    filtrateDrop: makeAnchor(group, 0, 0.02, 0, `${name}:filtrateDrop`),
  };

  const apparatus = composeApparatus({
    kind: 'filter-paper',
    family: 'separation-tool',
    group,
    meshes: { cone, fold, rim },
    anchors,
    constraints: {
      safePourRadius: radius * 0.72,
      safePourClearance: 0.08,
      effectBounds: {
        min: new THREE.Vector3(-radius, 0, -radius),
        max: new THREE.Vector3(radius, height, radius),
      },
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(radius * 1.52, 0.3),
    role: 'floating-badge',
  });
  apparatus.controllers = {};
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#e8d59a' });
  apparatus.validators = [];
  return apparatus;
}
