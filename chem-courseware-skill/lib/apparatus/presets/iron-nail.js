import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  makeAnchor,
  attachFixedPlaneLabel,
  attachLabelController,
} from './shared.js';

export function createIronNailApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 1.65,
  radius = 0.055,
  headRadius = 0.16,
  headThickness = 0.07,
  tipLength = 0.24,
  materials = {},
  name = 'iron-nail',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const steelMaterial = cloneMaterial(
    materials.steel,
    new THREE.MeshStandardMaterial({ color: 0xa8b0ba, roughness: 0.34, metalness: 0.86 })
  );
  const copperMaterial = cloneMaterial(
    materials.copperCoat,
    new THREE.MeshStandardMaterial({
      color: 0xb96838,
      roughness: 0.7,
      metalness: 0.24,
      emissive: 0x3a190b,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0,
    })
  );

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(headRadius, headRadius, headThickness, 28),
    steelMaterial
  );
  head.rotation.z = Math.PI / 2;
  head.position.x = -length * 0.5;
  head.castShadow = true;
  group.add(head);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length - tipLength, 18),
    steelMaterial
  );
  body.rotation.z = Math.PI / 2;
  body.position.x = -tipLength * 0.5 + 0.02;
  body.castShadow = true;
  group.add(body);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(radius, tipLength, 18),
    steelMaterial
  );
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = length * 0.5 - tipLength * 0.5;
  tip.castShadow = true;
  group.add(tip);

  const copperCoat = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, length - tipLength * 1.2, 18),
    copperMaterial
  );
  copperCoat.rotation.z = Math.PI / 2;
  copperCoat.position.copy(body.position);
  group.add(copperCoat);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, radius * 7.8, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, -length * 0.25, 0, 0, `${name}:gripAnchor`),
    tipAnchor: makeAnchor(group, length * 0.5, 0, 0, `${name}:tipAnchor`),
    sampleZone: makeAnchor(group, length * 0.22, 0, 0, `${name}:sampleZone`),
    interactionZone: makeAnchor(group, length * 0.28, 0, 0, `${name}:interactionZone`),
    effectOrigin: makeAnchor(group, length * 0.2, 0, 0, `${name}:effectOrigin`),
  };

  const state = {
    copperCoating: 0,
  };

  const apparatus = composeApparatus({
    kind: 'iron-nail',
    family: 'solid-metal-sample',
    group,
    meshes: { head, body, tip, copperCoat },
    anchors,
    constraints: {
      length,
      radius,
      contactRadius: radius * 2.2,
      effectBounds: {
        min: new THREE.Vector3(-length * 0.55, -radius * 2.5, -radius * 2.5),
        max: new THREE.Vector3(length * 0.55, radius * 2.5, radius * 2.5),
      },
    },
    state,
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.42, 0.58),
    accent: '#bd7543',
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#bd7543' });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setCopperCoating(value) {
      const coating = clamp(value, 0, 1);
      state.copperCoating = coating;
      copperCoat.material.opacity = coating * 0.92;
      body.material.color.lerpColors(new THREE.Color(0xa8b0ba), new THREE.Color(0x8a7c70), coating * 0.35);
    },
  };

  apparatus.controllers.setCopperCoating(0);
  return apparatus;
}
