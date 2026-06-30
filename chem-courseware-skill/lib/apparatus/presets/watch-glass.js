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

export function createWatchGlassApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.62,
  height = 0.11,
  materials = {},
  name = 'watch-glass',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  glassMaterial.opacity = 0.34;

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 40, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.16),
    glassMaterial,
  );
  dish.scale.y = height / radius;
  dish.position.y = height * 0.9;
  dish.rotation.x = Math.PI;
  group.add(dish);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.98, 0.018, 10, 40),
    cloneMaterial(materials.rim, glassMaterial),
  );
  rim.position.y = height * 0.88;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const highlight = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.22, radius * 0.86, 40),
    new THREE.MeshBasicMaterial({
      color: 0xb8ecff,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
  );
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = height * 0.94;
  group.add(highlight);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.14, radius + 0.06, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.04, 0, `${name}:interactionZone`),
    sampleZone: makeAnchor(group, 0, height + 0.055, 0, `${name}:sampleZone`),
    effectOrigin: makeAnchor(group, 0, height + 0.07, 0, `${name}:effectOrigin`),
  };

  const apparatus = composeApparatus({
    kind: 'watch-glass',
    family: 'sample-dish',
    group,
    meshes: { dish, rim, highlight },
    anchors,
    constraints: {
      sampleRadius: radius * 0.78,
      effectBounds: {
        min: new THREE.Vector3(-radius, 0, -radius),
        max: new THREE.Vector3(radius, height + 0.18, radius),
      },
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(radius * 1.55, 0.32),
    role: 'floating-badge',
  });
  apparatus.controllers = {};
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  apparatus.validators = [];
  return apparatus;
}
