import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createRetortStandClampApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  height = 2.25,
  baseWidth = 0.84,
  baseDepth = 0.56,
  rodRadius = 0.035,
  armLength = 0.78,
  clampHeight = 1.52,
  name = 'retort-stand-clamp',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const metal = new THREE.MeshStandardMaterial({
    color: 0xaeb8c4,
    metalness: 0.72,
    roughness: 0.28,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x56616e,
    metalness: 0.76,
    roughness: 0.34,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseWidth, 0.06, baseDepth),
    darkMetal,
  );
  base.position.set(0, 0.03, 0);
  group.add(base);

  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(rodRadius, rodRadius, height, 18),
    metal,
  );
  rod.position.set(-baseWidth * 0.32, height * 0.5 + 0.06, 0);
  group.add(rod);

  const boss = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.12, 0.14),
    darkMetal,
  );
  boss.position.set(-baseWidth * 0.32, clampHeight, 0);
  group.add(boss);

  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, armLength, 14),
    metal,
  );
  arm.position.set(-baseWidth * 0.32 + armLength * 0.5, clampHeight, 0);
  arm.rotation.z = Math.PI / 2;
  group.add(arm);

  const clampRoot = new THREE.Group();
  clampRoot.position.set(-baseWidth * 0.32 + armLength, clampHeight, 0);
  group.add(clampRoot);

  const jawA = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.05), metal);
  jawA.position.set(0.12, 0.055, 0);
  jawA.rotation.z = 0.22;
  const jawB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.05), metal);
  jawB.position.set(0.12, -0.055, 0);
  jawB.rotation.z = -0.22;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 12), darkMetal);
  screw.position.set(-0.02, 0, 0);
  screw.rotation.x = Math.PI / 2;
  clampRoot.add(jawA, jawB, screw);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, clampHeight + 0.28, 0.22, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, -baseWidth * 0.32, clampHeight, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, -baseWidth * 0.32 + armLength, clampHeight, 0, `${name}:interactionZone`),
    clampCenter: makeAnchor(group, -baseWidth * 0.32 + armLength + 0.1, clampHeight, 0, `${name}:clampCenter`),
    supportPlane: makeAnchor(group, -baseWidth * 0.32 + armLength + 0.1, clampHeight, 0, `${name}:supportPlane`),
    baseCenter: makeAnchor(group, 0, 0.07, 0, `${name}:baseCenter`),
  };

  const apparatus = composeApparatus({
    kind: 'retort-stand-clamp',
    family: 'support-holder',
    group,
    meshes: { base, rod, boss, arm, clampRoot, jawA, jawB, screw },
    anchors,
    constraints: {
      clampRadius: 0.2,
      effectBounds: {
        min: new THREE.Vector3(-baseWidth * 0.5, 0, -baseDepth * 0.5),
        max: new THREE.Vector3(baseWidth * 0.72, height + 0.08, baseDepth * 0.5),
      },
    },
    state: { clampHeight },
  });

  apparatus.controllers = {
    setClampOpen(amount = 0.5) {
      const value = Math.max(0, Math.min(1, amount));
      jawA.rotation.z = 0.12 + value * 0.26;
      jawB.rotation.z = -0.12 - value * 0.26;
      apparatus.state.clampOpen = value;
      return value;
    },
  };
  apparatus.controllers.setClampOpen(0.58);

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.86, 0.32),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#c7d3df' });
  apparatus.validators = [];
  return apparatus;
}
