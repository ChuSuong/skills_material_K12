import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  clamp,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createGlassStirringRodApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, Math.PI * 0.5],
  length = 1.38,
  radius = 0.032,
  materials = {},
  name = 'glass-stirring-rod',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  glassMaterial.opacity = Math.max(glassMaterial.opacity ?? 0.28, 0.38);

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 18),
    glassMaterial
  );
  rod.rotation.z = Math.PI * 0.5;
  group.add(rod);

  const leftCap = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 18, 12),
    cloneMaterial(materials.cap, glassMaterial)
  );
  leftCap.position.x = -length * 0.5;
  group.add(leftCap);

  const rightCap = leftCap.clone();
  rightCap.material = cloneMaterial(materials.cap2, glassMaterial);
  rightCap.position.x = length * 0.5;
  group.add(rightCap);

  const stirPath = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.006, 8, 36),
    cloneMaterial(materials.stirPath, new THREE.MeshBasicMaterial({ color: 0x9ed8ff, transparent: true, opacity: 0.18 }))
  );
  stirPath.visible = false;
  stirPath.rotation.x = Math.PI / 2;
  group.add(stirPath);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, radius + 0.24, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, -length * 0.26, 0, 0, `${name}:gripAnchor`),
    tipAnchor: makeAnchor(group, length * 0.5, 0, 0, `${name}:tipAnchor`),
    sampleZone: makeAnchor(group, length * 0.42, 0, 0, `${name}:sampleZone`),
    stirPathCenter: makeAnchor(group, length * 0.34, -0.12, 0, `${name}:stirPathCenter`),
    interactionZone: makeAnchor(group, length * 0.34, 0, 0, `${name}:interactionZone`),
    effectOrigin: makeAnchor(group, length * 0.5, 0, 0, `${name}:effectOrigin`),
  };

  const basePosition = new THREE.Vector3(...position);
  const baseRotation = new THREE.Euler(...rotation);
  const apparatus = composeApparatus({
    kind: 'glass-stirring-rod',
    family: 'mixing-tool',
    group,
    meshes: { rod, leftCap, rightCap, stirPath },
    anchors,
    constraints: {
      effectBounds: {
        min: new THREE.Vector3(-length * 0.5, -radius, -radius),
        max: new THREE.Vector3(length * 0.5, radius, radius),
      },
    },
    state: { stirProgress: 0 },
  });

  apparatus.controllers = {
    setStirPose(progress) {
      const value = clamp(progress, 0, 1);
      apparatus.state.stirProgress = value;
      group.position.copy(basePosition);
      group.rotation.set(
        baseRotation.x,
        baseRotation.y + Math.sin(value * Math.PI * 2) * 0.08,
        baseRotation.z + Math.cos(value * Math.PI * 2) * 0.18
      );
      stirPath.visible = value > 0.01;
      stirPath.material.opacity = 0.08 + value * 0.22;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.9, 0.3),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#bcecff' });
  apparatus.validators = [];
  return apparatus;
}
