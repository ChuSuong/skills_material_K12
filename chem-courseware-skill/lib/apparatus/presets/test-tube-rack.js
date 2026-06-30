import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  makeAnchor,
} from './shared.js';

export function createTestTubeRackApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  slots = 6,
  slotSpacing = 0.34,
  width = null,
  depth = 0.48,
  height = 0.48,
  holeRadius = 0.085,
  materials = {},
  name = 'test-tube-rack',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const resolvedWidth = width ?? Math.max(1.25, slotSpacing * Math.max(1, slots - 1) + 0.42);
  const rackMaterial = cloneMaterial(
    materials.rack,
    new THREE.MeshStandardMaterial({ color: 0xc9d3dc, roughness: 0.58, metalness: 0.04 })
  );
  const shadowMaterial = cloneMaterial(
    materials.shadow,
    new THREE.MeshBasicMaterial({ color: 0x101820, transparent: true, opacity: 0.22 })
  );

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.08, depth),
    rackMaterial
  );
  topRail.position.y = height;
  group.add(topRail);

  const baseRail = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.08, depth * 0.86),
    cloneMaterial(materials.base, rackMaterial)
  );
  baseRail.position.y = 0.06;
  group.add(baseRail);

  const backRail = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.1, 0.08),
    cloneMaterial(materials.backRail, rackMaterial)
  );
  backRail.position.set(0, height * 0.54, -depth * 0.43);
  group.add(backRail);

  const frontRail = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.1, 0.08),
    cloneMaterial(materials.frontRail, rackMaterial)
  );
  frontRail.position.set(0, height * 0.54, depth * 0.43);
  group.add(frontRail);

  const legGeometry = new THREE.BoxGeometry(0.08, height, 0.08);
  const legs = [];
  for (const x of [-resolvedWidth * 0.45, resolvedWidth * 0.45]) {
    for (const z of [-depth * 0.38, depth * 0.38]) {
      const leg = new THREE.Mesh(legGeometry, cloneMaterial(materials.leg, rackMaterial));
      leg.position.set(x, height * 0.5, z);
      group.add(leg);
      legs.push(leg);
    }
  }

  const slotRings = [];
  const slotAnchors = {};
  const firstX = -slotSpacing * (slots - 1) * 0.5;
  for (let index = 0; index < slots; index += 1) {
    const x = firstX + slotSpacing * index;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(holeRadius, 0.011, 8, 28),
      cloneMaterial(materials.slotRing, new THREE.MeshStandardMaterial({ color: 0x7f94a6, roughness: 0.46, metalness: 0.18 }))
    );
    ring.position.set(x, height + 0.046, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    slotRings.push(ring);
    slotAnchors[`slot${index}`] = makeAnchor(group, x, height + 0.05, 0, `${name}:slot${index}`);
  }

  const baseShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(resolvedWidth * 1.08, depth * 1.22),
    shadowMaterial
  );
  baseShadow.rotation.x = -Math.PI / 2;
  baseShadow.position.y = 0.004;
  group.add(baseShadow);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.28, depth * 0.54, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.72, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.04, 0, `${name}:interactionZone`),
    dropZone: makeAnchor(group, 0, height + 0.09, 0, `${name}:dropZone`),
    supportPlane: makeAnchor(group, 0, height + 0.04, 0, `${name}:supportPlane`),
    ...slotAnchors,
  };

  const occupiedSlots = Array.from({ length: slots }, () => false);
  const apparatus = composeApparatus({
    kind: 'test-tube-rack',
    family: 'support-holder',
    group,
    meshes: { topRail, baseRail, backRail, frontRail, legs, slotRings, baseShadow },
    anchors,
    constraints: {
      slots,
      slotSpacing,
      holeRadius,
      effectBounds: {
        min: new THREE.Vector3(-resolvedWidth * 0.5, 0, -depth * 0.5),
        max: new THREE.Vector3(resolvedWidth * 0.5, height + 0.12, depth * 0.5),
      },
    },
    state: { occupiedSlots },
  });

  apparatus.controllers = {
    setOccupiedSlot(index, occupied = true) {
      if (index < 0 || index >= occupiedSlots.length) {
        return false;
      }
      occupiedSlots[index] = Boolean(occupied);
      slotRings[index].material.emissive = new THREE.Color(occupied ? 0x315f83 : 0x000000);
      slotRings[index].material.emissiveIntensity = occupied ? 0.26 : 0;
      return true;
    },
    getSlotAnchor(index) {
      return anchors[`slot${index}`] ?? null;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.96, 0.32),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#95c8ff' });
  apparatus.validators = [];
  return apparatus;
}
