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
import { latheFromProfile } from './classic-showcase.js';

function reservoirProfile(radius, height, neckRadius) {
  const shoulderY = height * 0.66;
  const pts = [
    [0.0001, 0],
    [radius * 0.92, 0],
    [radius, height * 0.08],
    [radius, shoulderY],
  ];
  const easeSegments = 8;
  for (let i = 1; i <= easeSegments; i += 1) {
    const t = i / easeSegments;
    const smooth = t * t * (3 - 2 * t);
    const x = radius * (1 - smooth) + neckRadius * smooth;
    const y = shoulderY + (height - shoulderY) * smooth;
    pts.push([x, y]);
  }
  pts.push([neckRadius, height]);
  return pts;
}

export function createClassicAlcoholLampApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.36,
  height = 0.52,
  neckRadius = 0.14,
  wickHeight = 0.12,
  materials = {},
  capAttached = false,
  name = 'classic-alcohol-lamp',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const brownGlassMaterial = cloneMaterial(
    materials.glass,
    new THREE.MeshPhysicalMaterial({
      color: 0x6b3f22,
      transparent: true,
      opacity: 0.75,
      transmission: 0.5,
      roughness: 0.22,
      thickness: 0.08,
      ior: 1.42,
      clearcoat: 0.32,
      clearcoatRoughness: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const brassMaterial = cloneMaterial(
    materials.brass,
    new THREE.MeshStandardMaterial({ color: 0xb98a3a, roughness: 0.34, metalness: 0.78 }),
  );
  const wickMaterial = cloneMaterial(
    materials.wick,
    new THREE.MeshStandardMaterial({ color: 0xdccfb4, roughness: 0.88, metalness: 0.02 }),
  );

  const body = new THREE.Mesh(
    latheFromProfile(reservoirProfile(radius, height, neckRadius), 60),
    cloneMaterial(materials.body, brownGlassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const burnerDisk = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.18, neckRadius * 1.05, 0.05, 24),
    brassMaterial,
  );
  burnerDisk.position.y = height + 0.025;
  group.add(burnerDisk);

  const burnerCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 0.9, neckRadius * 0.9, 0.06, 20),
    brassMaterial.clone(),
  );
  burnerCollar.position.y = height + 0.075;
  group.add(burnerCollar);

  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 0.42, neckRadius * 0.44, wickHeight, 16),
    wickMaterial,
  );
  wick.position.y = height + 0.075 + wickHeight * 0.5;
  group.add(wick);

  const capGroup = new THREE.Group();
  capGroup.name = `${name}:cap`;
  const capBody = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.02, neckRadius * 1.02, wickHeight + 0.12, 24),
    brassMaterial.clone(),
  );
  capBody.position.y = (wickHeight + 0.12) * 0.5;
  capGroup.add(capBody);
  const capKnob = new THREE.Mesh(
    new THREE.SphereGeometry(neckRadius * 0.32, 16, 12),
    brassMaterial.clone(),
  );
  capKnob.position.y = wickHeight + 0.12 + neckRadius * 0.25;
  capGroup.add(capKnob);

  const capRestPosition = new THREE.Vector3(radius * 2.2, 0, 0);
  const capMountPosition = new THREE.Vector3(0, height + 0.075, 0);
  capGroup.position.copy(capAttached ? capMountPosition : capRestPosition);
  group.add(capGroup);

  const flameOriginY = height + 0.075 + wickHeight + 0.02;

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.6, radius + 0.16, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.5, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, flameOriginY + 0.04, 0, `${name}:interactionZone`),
    flameOrigin: makeAnchor(group, 0, flameOriginY, 0, `${name}:flameOrigin`),
    heatZone: makeAnchor(group, 0, flameOriginY + 0.06, 0, `${name}:heatZone`),
    ignitionTip: makeAnchor(group, 0, flameOriginY - 0.02, 0, `${name}:ignitionTip`),
    capRest: makeAnchor(group, capRestPosition.x, capRestPosition.y, capRestPosition.z, `${name}:capRest`),
    capMount: makeAnchor(group, capMountPosition.x, capMountPosition.y, capMountPosition.z, `${name}:capMount`),
  };

  const state = {
    capAttached,
    flameIntensity: 0,
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'classic-alcohol-lamp',
    family: 'showcase-heat-source',
    meshes: { body, burnerDisk, burnerCollar, wick, cap: capGroup },
    anchors,
    constraints: {
      heatClearance: 0.16,
      effectBounds: {
        min: new THREE.Vector3(-radius, 0, -radius),
        max: new THREE.Vector3(radius, flameOriginY + 0.6, radius),
      },
    },
    state,
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'burner',
    },
  });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setCapAttached(attached = true) {
      const value = Boolean(attached);
      state.capAttached = value;
      capGroup.position.copy(value ? capMountPosition : capRestPosition);
    },
    setFlameIntensity(intensity = 0) {
      state.flameIntensity = Math.max(0, Math.min(1, intensity));
    },
  };
  apparatus.validators = [];

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.0, 0.38),
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#ff9b32' });
  return apparatus;
}
