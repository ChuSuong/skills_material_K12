import { composeApparatus } from '../core.js';
import { diluteAcid } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createDropperApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  stemLength = 1.0,
  stemRadius = 0.05,
  bulbRadius = 0.14,
  materials = {},
  appearance = diluteAcid(),
  name = 'dropper',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const tipMaterial = cloneMaterial(materials.tip, appearance.createSurfaceMaterial({ opacity: 0.62 }));

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(stemRadius, stemRadius * 1.1, stemLength, 18),
    glassMaterial
  );
  stem.position.y = -stemLength * 0.5;
  group.add(stem);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(bulbRadius, 22, 18),
    cloneMaterial(materials.bulb, appearance.createLiquidMaterial({ opacity: 0.36 }))
  );
  group.add(bulb);

  const tip = new THREE.Mesh(
    new THREE.CylinderGeometry(stemRadius * 0.35, stemRadius * 0.55, stemLength * 0.22, 18),
    tipMaterial
  );
  tip.position.y = -stemLength - stemLength * 0.11;
  group.add(tip);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, bulbRadius + 0.2, 0, `${name}:labelAnchor`),
    mouth: makeAnchor(group, 0, bulbRadius * 0.72, 0, `${name}:mouth`),
    nozzle: makeAnchor(group, 0, tip.position.y - stemLength * 0.11, 0, `${name}:nozzle`),
  };

  const apparatus = composeApparatus({
    kind: 'dropper',
    family: 'transfer-tool',
    group,
    meshes: { stem, bulb, tip },
    anchors,
    constraints: {
      tiltLimit: 1.28,
      effectBounds: {
        min: new THREE.Vector3(-bulbRadius, tip.position.y - 0.2, -bulbRadius),
        max: new THREE.Vector3(bulbRadius, bulbRadius + 0.2, bulbRadius),
      },
    },
    state: {
      pourProgress: 0,
    },
  });

  const basePosition = new THREE.Vector3(...position);
  const baseRotation = new THREE.Euler(...rotation);
  apparatus.controllers = {
    setPourPose(progress) {
      const value = clamp(progress, 0, 1);
      apparatus.state.pourProgress = value;
      group.position.copy(basePosition);
      group.rotation.set(baseRotation.x + value * 0.4, baseRotation.y, baseRotation.z - value * 0.8);
    },
  };
  apparatus.validators = [];
  return apparatus;
}
