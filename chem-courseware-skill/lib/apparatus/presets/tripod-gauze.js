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

export function createTripodGauzeApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.5,
  height = 0.82,
  legRadius = 0.026,
  materials = {},
  name = 'tripod-gauze',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const metalMaterial = cloneMaterial(
    materials.metal,
    new THREE.MeshStandardMaterial({ color: 0x7f8993, roughness: 0.38, metalness: 0.68 })
  );
  const gauzeMaterial = cloneMaterial(
    materials.gauze,
    new THREE.MeshStandardMaterial({ color: 0xaab4bc, roughness: 0.52, metalness: 0.4 })
  );

  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.025, 10, 44),
    metalMaterial
  );
  topRing.position.y = height;
  topRing.rotation.x = Math.PI / 2;
  group.add(topRing);

  const gauze = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 1.45, radius * 1.45, 6, 6),
    gauzeMaterial
  );
  gauze.position.y = height + 0.012;
  gauze.rotation.x = -Math.PI / 2;
  group.add(gauze);

  const meshLines = [];
  for (let index = -3; index <= 3; index += 1) {
    const offset = (index / 3) * radius * 0.68;
    const lineX = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.008, radius * 1.45),
      cloneMaterial(materials.gauzeLine, metalMaterial)
    );
    lineX.position.set(offset, height + 0.024, 0);
    group.add(lineX);
    meshLines.push(lineX);

    const lineZ = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 1.45, 0.008, 0.008),
      cloneMaterial(materials.gauzeLine, metalMaterial)
    );
    lineZ.position.set(0, height + 0.026, offset);
    group.add(lineZ);
    meshLines.push(lineZ);
  }

  const legs = [];
  for (let index = 0; index < 3; index += 1) {
    const angle = index * Math.PI * 2 / 3 + Math.PI / 6;
    const x = Math.cos(angle) * radius * 0.82;
    const z = Math.sin(angle) * radius * 0.82;
    const footX = Math.cos(angle) * radius * 1.12;
    const footZ = Math.sin(angle) * radius * 1.12;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(legRadius, legRadius, height, 14),
      cloneMaterial(materials.leg, metalMaterial)
    );
    leg.position.set((x + footX) * 0.5, height * 0.5, (z + footZ) * 0.5);
    leg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(x - footX, height, z - footZ).normalize()
    );
    group.add(leg);
    legs.push(leg);
  }

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.32, radius * 0.82, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.56, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.026, 0, `${name}:interactionZone`),
    supportPlane: makeAnchor(group, 0, height + 0.026, 0, `${name}:supportPlane`),
    vesselSeat: makeAnchor(group, 0, height + 0.03, 0, `${name}:vesselSeat`),
    burnerAlign: makeAnchor(group, 0, 0.08, 0, `${name}:burnerAlign`),
    heatZone: makeAnchor(group, 0, height * 0.52, 0, `${name}:heatZone`),
  };

  const apparatus = composeApparatus({
    kind: 'tripod-gauze',
    family: 'heat-support',
    group,
    meshes: { topRing, gauze, meshLines, legs },
    anchors,
    constraints: {
      supportRadius: radius * 0.72,
      burnerClearance: height * 0.48,
      effectBounds: {
        min: new THREE.Vector3(-radius * 1.2, 0, -radius * 1.2),
        max: new THREE.Vector3(radius * 1.2, height + 0.08, radius * 1.2),
      },
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.96, 0.32),
    role: 'floating-badge',
  });
  apparatus.controllers = {};
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#cbd6df' });
  apparatus.validators = [];
  return apparatus;
}
