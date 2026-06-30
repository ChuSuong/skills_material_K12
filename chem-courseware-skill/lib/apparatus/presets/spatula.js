import { composeApparatus } from '../core.js';
import { yellowPrecipitate } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  clamp,
  cloneMaterial,
  makeAnchor,
} from './shared.js';

export function createSpatulaApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, Math.PI * 0.5],
  length = 1.18,
  handleRadius = 0.024,
  scoopLength = 0.24,
  scoopWidth = 0.12,
  materials = {},
  appearance = yellowPrecipitate(),
  name = 'spatula',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const metalMaterial = cloneMaterial(
    materials.metal,
    new THREE.MeshStandardMaterial({ color: 0xb7c3cd, roughness: 0.32, metalness: 0.74 })
  );
  const powderMaterial = cloneMaterial(
    materials.powder,
    appearance.createSurfaceMaterial({ opacity: 0.92, roughness: 0.82 })
  );

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(handleRadius, handleRadius, length, 16),
    metalMaterial
  );
  handle.rotation.z = Math.PI * 0.5;
  group.add(handle);

  const scoop = new THREE.Mesh(
    new THREE.BoxGeometry(scoopLength, 0.026, scoopWidth),
    cloneMaterial(materials.scoop, metalMaterial)
  );
  scoop.position.x = length * 0.5 + scoopLength * 0.42;
  group.add(scoop);

  const scoopLip = new THREE.Mesh(
    new THREE.TorusGeometry(scoopWidth * 0.45, 0.006, 8, 24, Math.PI),
    cloneMaterial(materials.scoopLip, metalMaterial)
  );
  scoopLip.position.set(scoop.position.x + scoopLength * 0.36, 0.018, 0);
  scoopLip.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.5);
  group.add(scoopLip);

  const loadedSolid = new THREE.Mesh(
    new THREE.SphereGeometry(scoopWidth * 0.38, 18, 12),
    powderMaterial
  );
  loadedSolid.position.set(scoop.position.x + scoopLength * 0.08, 0.04, 0);
  loadedSolid.scale.set(1.3, 0.28, 0.72);
  loadedSolid.visible = false;
  group.add(loadedSolid);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, 0.24, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, -length * 0.24, 0, 0, `${name}:gripAnchor`),
    scoopBowl: makeAnchor(group, scoop.position.x + scoopLength * 0.08, 0.04, 0, `${name}:scoopBowl`),
    tipAnchor: makeAnchor(group, scoop.position.x + scoopLength * 0.52, 0, 0, `${name}:tipAnchor`),
    dropAnchor: makeAnchor(group, scoop.position.x + scoopLength * 0.34, -0.08, 0, `${name}:dropAnchor`),
    interactionZone: makeAnchor(group, scoop.position.x + scoopLength * 0.08, 0, 0, `${name}:interactionZone`),
    effectOrigin: makeAnchor(group, scoop.position.x + scoopLength * 0.08, 0.04, 0, `${name}:effectOrigin`),
  };

  const apparatus = composeApparatus({
    kind: 'spatula',
    family: 'solid-transfer-tool',
    group,
    meshes: { handle, scoop, scoopLip, loadedSolid },
    anchors,
    constraints: {
      maxLoadedAmount: 1,
      effectBounds: {
        min: new THREE.Vector3(-length * 0.5, -0.12, -scoopWidth),
        max: new THREE.Vector3(length * 0.5 + scoopLength, 0.12, scoopWidth),
      },
    },
    state: {
      loadedAmount: 0,
    },
    meta: { appearance: appearance.name },
  });

  apparatus.controllers = {
    setLoadedAmount(value) {
      const amount = clamp(value, 0, 1);
      apparatus.state.loadedAmount = amount;
      loadedSolid.visible = amount > 0.01;
      loadedSolid.scale.set(1.3, Math.max(0.04, amount * 0.32), 0.72);
      loadedSolid.material.opacity = 0.25 + amount * 0.67;
      return amount;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.86, 0.3),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#e8cf74' });
  apparatus.validators = [];
  return apparatus;
}
