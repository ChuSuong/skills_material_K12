import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  makeAnchor,
} from './shared.js';

export function createLitmusPaperApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 0.84,
  width = 0.16,
  thickness = 0.01,
  contactRatio = 0.46,
  materials = {},
  color = 0xf6f2e7,
  wetColor = 0xcfd7df,
  name = 'litmus-paper',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const stripMaterial = cloneMaterial(
    materials.strip,
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0 })
  );
  const contactMaterial = cloneMaterial(
    materials.contact,
    new THREE.MeshStandardMaterial({ color: wetColor, roughness: 0.74, metalness: 0 })
  );

  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(width, length, thickness),
    stripMaterial
  );
  strip.castShadow = true;
  strip.receiveShadow = true;
  group.add(strip);

  const contactPatch = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.92, length * contactRatio, thickness * 1.1),
    contactMaterial
  );
  contactPatch.position.y = -(length * 0.5) + (length * contactRatio * 0.5);
  contactPatch.position.z = thickness * 0.06;
  group.add(contactPatch);

  const tipY = -length * 0.5 + thickness;
  const sampleZoneY = -(length * 0.5) + length * contactRatio * 0.45;
  const anchors = {
    labelAnchor: makeAnchor(group, 0, length * 0.62, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, length * 0.24, 0, `${name}:gripAnchor`),
    tipAnchor: makeAnchor(group, 0, tipY, 0, `${name}:tipAnchor`),
    sampleZone: makeAnchor(group, 0, sampleZoneY, 0, `${name}:sampleZone`),
  };

  const state = {
    wetness: 0,
    indicatorColor: new THREE.Color(color),
    contactPose: 0,
  };

  const basePosition = new THREE.Vector3(...position);
  const baseRotation = new THREE.Euler(...rotation);
  const travel = new THREE.Vector3(0, -length * 0.18, 0);
  const tilt = [0.18, 0, -0.22];

  const apparatus = composeApparatus({
    kind: 'litmus-paper',
    family: 'indicator-tool',
    group,
    meshes: { strip, contactPatch },
    anchors,
    constraints: {
      tipInset: length * 0.04,
      contactLength: length * contactRatio,
      contactWidth: width * 0.92,
      effectBounds: {
        min: new THREE.Vector3(-width * 0.6, -length * 0.52, -thickness * 1.5),
        max: new THREE.Vector3(width * 0.6, length * 0.52, thickness * 1.5),
      },
    },
    state,
    meta: {
      basePosition,
      baseRotation,
    },
  });

  apparatus.controllers = {
    setIndicatorColor(nextColor) {
      const value = new THREE.Color(nextColor);
      state.indicatorColor.copy(value);
      strip.material.color.lerpColors(new THREE.Color(color), value, 0.4 + state.wetness * 0.4);
      contactPatch.material.color.copy(value);
    },
    setWetness(value) {
      const wetness = clamp(value, 0, 1);
      state.wetness = wetness;
      contactPatch.material.opacity = 0.18 + wetness * 0.82;
      contactPatch.material.transparent = contactPatch.material.opacity < 0.999;
      strip.material.color.lerpColors(new THREE.Color(color), state.indicatorColor, wetness * 0.35);
    },
    setContactPose(progress) {
      const value = clamp(progress, 0, 1);
      state.contactPose = value;
      group.position.copy(basePosition).addScaledVector(travel, value);
      group.rotation.set(
        baseRotation.x + tilt[0] * value,
        baseRotation.y + tilt[1] * value,
        baseRotation.z + tilt[2] * value
      );
    },
  };
  apparatus.validators = [];
  apparatus.controllers.setIndicatorColor(color);
  apparatus.controllers.setWetness(0);
  return apparatus;
}
