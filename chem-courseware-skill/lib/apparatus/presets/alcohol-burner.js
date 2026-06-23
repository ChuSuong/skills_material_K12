import { composeApparatus } from '../core.js';
import { burnerFlame } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createAlcoholBurnerApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bodyRadius = 0.26,
  bodyHeight = 0.42,
  wickHeight = 0.18,
  materials = {},
  appearance = burnerFlame(),
  name = 'alcohol-burner',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const metalMaterial = cloneMaterial(
    materials.metal,
    new THREE.MeshStandardMaterial({ color: 0x7f8b95, roughness: 0.34, metalness: 0.62 })
  );

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius * 0.9, bodyRadius, bodyHeight, 24),
    cloneMaterial(materials.body, glassMaterial)
  );
  body.position.y = bodyHeight * 0.5;
  group.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius * 0.34, bodyRadius * 0.4, 0.08, 20),
    metalMaterial
  );
  cap.position.y = bodyHeight + 0.04;
  group.add(cap);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadius * 0.09, bodyRadius * 0.09, wickHeight, 16),
    cloneMaterial(materials.wick, new THREE.MeshStandardMaterial({ color: 0xdccfb4, roughness: 0.86 }))
  );
  wick.position.y = bodyHeight + wickHeight * 0.5 + 0.06;
  group.add(wick);

  const apparatus = composeApparatus({
    kind: 'alcohol-burner',
    family: 'heat-source',
    group,
    meshes: { body, cap, wick },
    anchors: {
      labelAnchor: makeAnchor(group, 0, bodyHeight + wickHeight + 0.48, 0, `${name}:labelAnchor`),
      heatZone: makeAnchor(group, 0, bodyHeight + wickHeight + 0.02, 0, `${name}:heatZone`),
      flameOrigin: makeAnchor(group, 0, bodyHeight + wickHeight + 0.08, 0, `${name}:flameOrigin`),
    },
    constraints: {
      heatClearance: 0.16,
      effectBounds: {
        min: new THREE.Vector3(-bodyRadius, 0, -bodyRadius),
        max: new THREE.Vector3(bodyRadius, bodyHeight + wickHeight + 0.42, bodyRadius),
      },
    },
    meta: { appearance: appearance.name },
  });

  apparatus.controllers = {
    setEffectIntensity(value) {
      apparatus.state = apparatus.state || {};
      apparatus.state.effectIntensity = clamp(value, 0, 1);
    },
  };
  apparatus.validators = [];
  return apparatus;
}
