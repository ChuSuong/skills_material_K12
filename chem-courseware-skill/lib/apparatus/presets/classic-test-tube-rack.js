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
import { createClassicShadowMaterial } from './classic-showcase.js';

export function createClassicTestTubeRackApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  slots = 2,
  slotSpacing = 2.25,
  width = null,
  depth = 1.7,
  height = 3.1,
  materials = {},
  name = 'classic-test-tube-rack',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const resolvedWidth = width ?? Math.max(5.1, slotSpacing * Math.max(1, slots - 1) + 4.6);
  const woodMaterial = cloneMaterial(
    materials.wood,
    new THREE.MeshStandardMaterial({ color: 0xc28340, roughness: 0.82, metalness: 0.06 }),
  );
  const accentMaterial = cloneMaterial(
    materials.accent,
    new THREE.MeshStandardMaterial({ color: 0x9d6b34, roughness: 0.84, metalness: 0.05 }),
  );

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.34, depth + 0.2),
    woodMaterial,
  );
  base.position.y = 0.17;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const railFront = new THREE.Mesh(
    new THREE.BoxGeometry(resolvedWidth, 0.28, 0.34),
    accentMaterial,
  );
  railFront.position.set(0, height, depth * 0.38);
  railFront.castShadow = true;
  railFront.receiveShadow = true;
  group.add(railFront);

  const railBack = railFront.clone();
  railBack.position.z = -depth * 0.38;
  group.add(railBack);

  const legGeometry = new THREE.BoxGeometry(0.28, height + 0.18, depth + 0.2);
  const legLeft = new THREE.Mesh(legGeometry, woodMaterial);
  legLeft.position.set(-(resolvedWidth * 0.5) + 0.18, (height + 0.18) * 0.5, 0);
  legLeft.castShadow = true;
  legLeft.receiveShadow = true;
  group.add(legLeft);

  const legRight = legLeft.clone();
  legRight.position.x = -legLeft.position.x;
  group.add(legRight);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(resolvedWidth * 1.08, depth * 1.28),
    createClassicShadowMaterial(materials),
  );
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = 0.01;
  group.add(shadow);

  const slotAnchors = {};
  const slotRings = [];
  const firstX = -slotSpacing * (slots - 1) * 0.5;
  for (let index = 0; index < slots; index += 1) {
    const x = firstX + slotSpacing * index;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.63, 0.06, 12, 36),
      cloneMaterial(
        materials.ring,
        new THREE.MeshStandardMaterial({ color: 0xf2d2a8, roughness: 0.56, metalness: 0.04 }),
      ),
    );
    ring.position.set(x, height + 0.08, 0);
    ring.rotation.x = Math.PI * 0.5;
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
    slotRings.push(ring);
    slotAnchors[`slot${index}`] = makeAnchor(group, x, height + 0.08, 0, `${name}:slot${index}`);
  }

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.62, depth * 0.52, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.7, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.1, 0, `${name}:interactionZone`),
    supportPlane: makeAnchor(group, 0, height + 0.08, 0, `${name}:supportPlane`),
    ...slotAnchors,
  };

  const occupiedSlots = Array.from({ length: slots }, () => false);
  const apparatus = composeApparatus({
    kind: 'classic-test-tube-rack',
    family: 'showcase-support',
    group,
    meshes: { base, railFront, railBack, legLeft, legRight, slotRings, shadow },
    anchors,
    constraints: {
      slots,
      slotSpacing,
      effectBounds: {
        min: new THREE.Vector3(-resolvedWidth * 0.5, 0, -depth * 0.5),
        max: new THREE.Vector3(resolvedWidth * 0.5, height + 0.22, depth * 0.5),
      },
    },
    state: { occupiedSlots },
    meta: { visualFamily: 'classic-showcase' },
  });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setOccupiedSlot(index, occupied = true) {
      if (index < 0 || index >= occupiedSlots.length) {
        return false;
      }
      occupiedSlots[index] = Boolean(occupied);
      slotRings[index].material.emissive = new THREE.Color(occupied ? 0x315f83 : 0x000000);
      slotRings[index].material.emissiveIntensity = occupied ? 0.18 : 0;
      return true;
    },
    getSlotAnchor(index) {
      return anchors[`slot${index}`] ?? null;
    },
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.32, 0.42),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#d9a86e' });
  return apparatus;
}
