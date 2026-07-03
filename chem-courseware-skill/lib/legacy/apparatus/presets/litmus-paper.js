import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  clamp,
  cloneMaterial,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

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
  wireLength = 0,
  wireRadius = 0.01,
  wireColor = 0x8d96a2,
  stopperRadius = 0,
  stopperHeight = 0.14,
  stopperColor = 0xd0c5a0,
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

  const hasProbeAssembly = wireLength > 0 || stopperRadius > 0;
  let wire = null;
  let stopper = null;
  const stripTopY = length * 0.5;
  if (wireLength > 0) {
    wire = new THREE.Mesh(
      new THREE.CylinderGeometry(wireRadius, wireRadius, wireLength, 16),
      cloneMaterial(
        materials.wire,
        new THREE.MeshStandardMaterial({ color: wireColor, roughness: 0.34, metalness: 0.72 })
      )
    );
    wire.position.y = stripTopY + wireLength * 0.5;
    wire.castShadow = true;
    group.add(wire);
  }

  if (stopperRadius > 0) {
    stopper = new THREE.Mesh(
      new THREE.CylinderGeometry(stopperRadius * 0.94, stopperRadius, stopperHeight, 20),
      cloneMaterial(
        materials.stopper,
        new THREE.MeshStandardMaterial({ color: stopperColor, roughness: 0.82, metalness: 0.04 })
      )
    );
    stopper.position.y = stripTopY + Math.max(0, wireLength) + stopperHeight * 0.5;
    stopper.castShadow = true;
    stopper.receiveShadow = true;
    group.add(stopper);
  }

  const tipY = -length * 0.5 + thickness;
  const sampleZoneY = -(length * 0.5) + length * contactRatio * 0.45;
  const stopperSeatY = stopper
    ? stopper.position.y - stopperHeight * 0.5
    : stripTopY + Math.max(0, wireLength);
  const probeGripY = stopper
    ? stopper.position.y + stopperHeight * 0.18
    : stripTopY + Math.max(0, wireLength) + Math.max(length * 0.08, 0.05);
  const anchors = {
    labelAnchor: makeAnchor(group, 0, length * 0.62, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, length * 0.24, 0, `${name}:gripAnchor`),
    probeGrip: makeAnchor(group, 0, probeGripY, 0, `${name}:probeGrip`),
    stopperSeat: makeAnchor(group, 0, stopperSeatY, 0, `${name}:stopperSeat`),
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
    meshes: { strip, contactPatch, wire, stopper },
    anchors,
    constraints: {
      tipInset: length * 0.04,
      contactLength: length * contactRatio,
      contactWidth: width * 0.92,
      effectBounds: {
        min: new THREE.Vector3(-width * 0.6, -length * 0.52, -thickness * 1.5),
        max: new THREE.Vector3(
          Math.max(width * 0.6, stopperRadius * 1.08),
          Math.max(length * 0.52, stopperSeatY + stopperHeight * 1.05),
          Math.max(thickness * 1.5, stopperRadius * 1.08)
        ),
      },
    },
    state,
    meta: {
      basePosition,
      baseRotation,
      hasProbeAssembly,
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.92, 0.36),
    role: 'floating-badge',
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
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#7d4fd3' });
  apparatus.validators = [];
  apparatus.controllers.setIndicatorColor(color);
  apparatus.controllers.setWetness(0);
  return apparatus;
}
