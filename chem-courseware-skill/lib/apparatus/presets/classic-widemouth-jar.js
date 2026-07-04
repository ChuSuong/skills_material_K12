import { composeApparatus } from '../core.js';
import { createGranulePile, resolveSolidAppearance, zincGranules } from '../solids.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  makeAnchor,
} from './shared.js';
import {
  createClassicGlassMaterial,
  createClassicGlassRimMaterial,
  latheFromProfile,
} from './classic-showcase.js';

function widemouthJarProfile(radius, height, neckRadius, neckHeight) {
  const shoulderStart = height - neckHeight;
  const shoulderEnd = height - neckHeight * 0.35;
  const pts = [];
  pts.push([0.0001, 0]);
  pts.push([radius * 0.94, 0]);
  pts.push([radius, height * 0.04]);
  pts.push([radius, shoulderStart]);
  const ease = 8;
  for (let i = 1; i <= ease; i += 1) {
    const t = i / ease;
    const smooth = t * t * (3 - 2 * t);
    const x = radius * (1 - smooth) + neckRadius * smooth;
    const y = shoulderStart + (shoulderEnd - shoulderStart) * smooth;
    pts.push([x, y]);
  }
  pts.push([neckRadius, height - 0.02]);
  pts.push([neckRadius * 1.06, height]);
  return pts;
}

function createGroundGlassStopper({ neckRadius, glassMaterial, rimMaterial, name }) {
  const group = new THREE.Group();
  group.name = `${name}:stopper`;

  const plug = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 0.98, neckRadius * 0.92, neckRadius * 0.9, 24),
    glassMaterial.clone(),
  );
  plug.position.y = neckRadius * 0.45;
  group.add(plug);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.18, neckRadius * 1.05, neckRadius * 0.4, 32),
    glassMaterial.clone(),
  );
  cap.position.y = neckRadius * 1.1;
  group.add(cap);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(neckRadius * 0.55, 24, 16),
    rimMaterial.clone(),
  );
  knob.position.y = neckRadius * 1.55;
  group.add(knob);

  return group;
}

export function createClassicWideMouthJarApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.62,
  height = 1.6,
  neckRadius = 0.44,
  neckHeight = 0.28,
  contents = 'zincGranules',
  appearance = null,
  fillAmount = 1,
  stopperAttached = false,
  materials = {},
  name = 'classic-widemouth-jar',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);

  const body = new THREE.Mesh(
    latheFromProfile(widemouthJarProfile(radius, height, neckRadius, neckHeight), 72),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.08, neckRadius * 0.06, 12, 40),
    rimMaterial,
  );
  rim.position.y = height;
  rim.rotation.x = Math.PI * 0.5;
  group.add(rim);

  const solidAppearance = resolveSolidAppearance(appearance ?? contents) ?? zincGranules();
  const pile = createGranulePile({
    parent: group,
    radius: radius * 0.88,
    appearance: solidAppearance,
    baseY: 0.02,
    seed: 4211,
    name: `${name}:granules`,
  });

  const stopper = createGroundGlassStopper({
    neckRadius,
    glassMaterial,
    rimMaterial,
    name,
  });
  const stopperRestPosition = new THREE.Vector3(radius * 1.55, 0, 0);
  const stopperMountPosition = new THREE.Vector3(0, height + 0.02, 0);
  if (stopperAttached) {
    stopper.position.copy(stopperMountPosition);
  } else {
    stopper.position.copy(stopperRestPosition);
  }
  group.add(stopper);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.55, radius + 0.16, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.85, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height * 0.82, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    dropAnchor: makeAnchor(group, 0, height + 0.18, 0, `${name}:dropAnchor`),
    scoopTarget: makeAnchor(group, 0, height - neckHeight * 0.5, 0, `${name}:scoopTarget`),
    sampleFloor: makeAnchor(group, 0, 0.02, 0, `${name}:sampleFloor`),
    stopperRest: makeAnchor(group, stopperRestPosition.x, stopperRestPosition.y, stopperRestPosition.z, `${name}:stopperRest`),
    stopperMount: makeAnchor(group, stopperMountPosition.x, stopperMountPosition.y, stopperMountPosition.z, `${name}:stopperMount`),
  };

  const state = {
    fillAmount,
    stopperAttached,
  };

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'classic-widemouth-jar',
    family: 'showcase-solid-jar',
    meshes: { body, rim, stopper, granulePile: pile.mesh },
    anchors,
    constraints: {
      innerRadius: radius * 0.9,
      innerHeight: height - neckHeight * 0.4,
      neckRadius,
    },
    state,
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'solid',
      contentName: solidAppearance.name,
    },
  });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setStopperAttached(attached = true) {
      const value = Boolean(attached);
      state.stopperAttached = value;
      stopper.position.copy(value ? stopperMountPosition : stopperRestPosition);
    },
    setFillAmount(amount = 1) {
      const value = Math.max(0, Math.min(1, amount));
      state.fillAmount = value;
      pile.mesh.visible = value > 0.02;
      pile.mesh.scale.setScalar(0.4 + value * 0.6);
    },
  };
  apparatus.controllers.setFillAmount(fillAmount);

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.16, 0.42),
    role: 'vessel-body-label',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#e6d9b8' });
  return apparatus;
}
