import { composeApparatus } from '../../../apparatus/core.js';
import { clearWater } from '../../../apparatus/chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from '../../../apparatus/presets/shared.js';

export function createGasGeneratorApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.32,
  height = 0.86,
  neckRadius = 0.1,
  neckHeight = 0.24,
  materials = {},
  appearance = clearWater(),
  name = 'gas-generator',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const gasMaterial = cloneMaterial(
    materials.gas,
    appearance.createGlowMaterial({
      color: 0x9cecff,
      emissive: 0x2fbfff,
      emissiveIntensity: 0.34,
      opacity: 0.18,
    }),
  );
  const stopperMaterial = cloneMaterial(
    materials.stopper,
    new THREE.MeshStandardMaterial({ color: 0x2c3340, roughness: 0.58, metalness: 0.06 }),
  );

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius, height, 32),
    glassMaterial,
  );
  body.position.y = height * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.35, radius * 0.78, neckHeight * 0.58, 28),
    cloneMaterial(materials.shoulder, glassMaterial),
  );
  shoulder.position.y = height + neckHeight * 0.22;
  group.add(shoulder);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.06, neckHeight, 24),
    cloneMaterial(materials.neck, glassMaterial),
  );
  neck.position.y = height + neckHeight * 0.52;
  group.add(neck);

  const stopper = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.08, neckRadius * 1.16, 0.1, 24),
    stopperMaterial,
  );
  stopper.position.y = height + neckHeight + 0.04;
  group.add(stopper);

  const gasGlow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.68, 24, 16),
    gasMaterial,
  );
  gasGlow.position.y = height * 0.45;
  group.add(gasGlow);

  const outletStem = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 0.34, neckRadius * 0.34, radius * 1.55, 18),
    cloneMaterial(materials.outlet, glassMaterial),
  );
  outletStem.rotation.z = Math.PI / 2;
  outletStem.position.set(radius * 0.92, height + neckHeight + 0.04, 0);
  group.add(outletStem);

  const outletX = radius * 1.68;
  const outletY = height + neckHeight + 0.04;
  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.52, radius + 0.06, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.52, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, outletX, outletY, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height + neckHeight + 0.08, 0, `${name}:mouth`),
    outletAnchor: makeAnchor(group, outletX, outletY, 0, `${name}:outletAnchor`),
    gasOutlet: makeAnchor(group, outletX, outletY, 0, `${name}:gasOutlet`),
    effectOrigin: makeAnchor(group, 0, height * 0.55, 0, `${name}:effectOrigin`),
  };

  const apparatus = composeApparatus({
    kind: 'gas-generator',
    family: 'gas-source',
    group,
    meshes: { body, shoulder, neck, stopper, gasGlow, outletStem },
    anchors,
    constraints: {
      effectBounds: {
        min: new THREE.Vector3(-radius, 0, -radius),
        max: new THREE.Vector3(outletX + 0.1, outletY + 0.12, radius),
      },
    },
    state: {
      gasFlow: 0,
    },
    meta: { appearance: appearance.name },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(Math.max(radius * 2.7, 0.78), 0.42),
    role: 'vessel-body-label',
  });

  apparatus.controllers = {
    setGasFlow(value = 0) {
      const intensity = Math.max(0, Math.min(1, value));
      apparatus.state.gasFlow = intensity;
      gasGlow.material.opacity = 0.12 + intensity * 0.18;
    },
  };
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#7edaff' });
  return apparatus;
}
