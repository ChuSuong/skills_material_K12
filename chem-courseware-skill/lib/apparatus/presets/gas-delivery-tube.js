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

export function createGasDeliveryTubeApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 0.96,
  drop = 0.44,
  radius = 0.035,
  materials = {},
  name = 'gas-delivery-tube',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  glassMaterial.opacity = Math.max(glassMaterial.opacity ?? 0.28, 0.42);

  const horizontal = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 18),
    glassMaterial,
  );
  horizontal.rotation.z = Math.PI / 2;
  horizontal.position.x = length * 0.5;
  horizontal.castShadow = true;
  group.add(horizontal);

  const vertical = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, drop, 18),
    cloneMaterial(materials.vertical, glassMaterial),
  );
  vertical.position.set(length, -drop * 0.5, 0);
  vertical.castShadow = true;
  group.add(vertical);

  const elbow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.25, 18, 12),
    cloneMaterial(materials.elbow, glassMaterial),
  );
  elbow.position.set(length, 0, 0);
  group.add(elbow);

  const inletBulb = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.45, 18, 12),
    cloneMaterial(materials.inlet, glassMaterial),
  );
  inletBulb.position.set(0, 0, 0);
  group.add(inletBulb);

  const tipBulb = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.45, 18, 12),
    cloneMaterial(materials.tip, glassMaterial),
  );
  tipBulb.position.set(length, -drop, 0);
  group.add(tipBulb);

  const anchors = {
    labelAnchor: makeAnchor(group, length * 0.5, 0.22, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, length * 0.48, 0, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, length, -drop, 0, `${name}:interactionZone`),
    inletAnchor: makeAnchor(group, 0, 0, 0, `${name}:inletAnchor`),
    outletAnchor: makeAnchor(group, length, -drop, 0, `${name}:outletAnchor`),
    tipAnchor: makeAnchor(group, length, -drop, 0, `${name}:tipAnchor`),
  };

  const apparatus = composeApparatus({
    kind: 'gas-delivery-tube',
    family: 'gas-transfer-tool',
    group,
    meshes: { horizontal, vertical, elbow, inletBulb, tipBulb },
    anchors,
    constraints: {
      effectBounds: {
        min: new THREE.Vector3(-radius * 2, -drop - radius * 2, -radius * 2),
        max: new THREE.Vector3(length + radius * 2, radius * 2, radius * 2),
      },
    },
    state: {
      connected: false,
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.92, 0.32),
    role: 'floating-badge',
  });

  apparatus.controllers = {
    setConnected(value = true) {
      apparatus.state.connected = Boolean(value);
    },
  };
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#9be8ff' });
  return apparatus;
}
