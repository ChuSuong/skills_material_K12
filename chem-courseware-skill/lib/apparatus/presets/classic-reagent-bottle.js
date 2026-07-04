import { composeApparatus, createCylinderLiquidController } from '../core.js';
import { clearWater } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonLiquidControllers,
  attachFixedPlaneLabel,
  attachLabelController,
  cloneMaterial,
  makeAnchor,
} from './shared.js';
import {
  createClassicGlassMaterial,
  createClassicGlassRimMaterial,
  createClassicLiquidMaterial,
  createClassicLiquidSurfaceMaterial,
  createClassicShadowMaterial,
  latheFromProfile,
} from './classic-showcase.js';

function reagentBottleProfile({
  radius,
  height,
  neckRadius,
  neckHeight,
  shoulderSegments = 14,
}) {
  const pts = [];
  pts.push([0.0001, 0]);
  pts.push([radius * 0.94, 0]);
  pts.push([radius * 0.98, 0.05]);
  pts.push([radius, height * 0.06]);
  pts.push([radius, height * 0.82]);

  const shoulderStartY = height * 0.82;
  const shoulderEndY = height + 0.22;
  const shoulderStartR = radius;
  const shoulderEndR = neckRadius * 1.02;
  for (let i = 1; i <= shoulderSegments; i += 1) {
    const t = i / shoulderSegments;
    const eased = t * t * (3 - 2 * t);
    const y = shoulderStartY + (shoulderEndY - shoulderStartY) * t;
    const r = shoulderStartR + (shoulderEndR - shoulderStartR) * eased;
    pts.push([r, y]);
  }

  const neckTopY = height + 0.22 + neckHeight;
  pts.push([neckRadius, neckTopY - 0.04]);
  pts.push([neckRadius * 1.05, neckTopY]);
  return pts;
}

export function createClassicReagentBottleApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.56,
  height = 2.2,
  neckRadius = 0.18,
  neckHeight = 0.52,
  fillRatio = 0.66,
  materials = {},
  appearance = clearWater(),
  name = 'classic-reagent-bottle',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, appearance?.surfaceColor ?? 0xf8fdff);
  const stopperMaterial = cloneMaterial(
    materials.cap,
    new THREE.MeshStandardMaterial({ color: 0x2d3647, roughness: 0.62, metalness: 0.22 }),
  );

  const body = new THREE.Mesh(
    latheFromProfile(reagentBottleProfile({ radius, height, neckRadius, neckHeight }), 72),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const neckTopY = height + 0.22 + neckHeight;

  const mouthRim = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.05, 0.03, 12, 30),
    rimMaterial,
  );
  mouthRim.position.y = neckTopY;
  mouthRim.rotation.x = Math.PI * 0.5;
  group.add(mouthRim);

  const stopper = new THREE.Group();
  stopper.name = `${name}:stopper`;
  const stopperPlug = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 0.96, neckRadius * 1.02, 0.18, 28),
    stopperMaterial,
  );
  stopperPlug.position.y = -0.02;
  stopper.add(stopperPlug);
  const stopperCap = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.18, neckRadius * 1.18, 0.14, 28),
    stopperMaterial,
  );
  stopperCap.position.y = 0.14;
  stopper.add(stopperCap);
  const stopperKnob = new THREE.Mesh(
    new THREE.SphereGeometry(neckRadius * 0.55, 24, 16),
    stopperMaterial,
  );
  stopperKnob.position.y = 0.28;
  stopper.add(stopperKnob);
  stopper.position.y = neckTopY + 0.04;
  stopper.castShadow = true;
  stopper.receiveShadow = true;
  group.add(stopper);

  const innerRadius = radius * 0.86;
  const liquidBaseY = 0.08;
  const liquidHeight = height * 0.72;

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius * 0.96, liquidHeight, 40),
    liquidMaterial,
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 40),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  group.add(liquidSurface);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.4, radius * 2.2),
    createClassicShadowMaterial(materials),
  );
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = 0.01;
  group.add(shadow);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.5, radius + 0.22, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height + 0.4, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.3, 0, `${name}:interactionZone`),
    pourAlign: makeAnchor(group, 0, height + 0.24, 0, `${name}:pourAlign`),
    nozzle: makeAnchor(group, 0, neckTopY, 0, `${name}:nozzle`),
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };
  const liquidProfile = {
    baseY: liquidBaseY,
    height: liquidHeight,
    radiusBottom: innerRadius * 0.96,
    radiusTop: innerRadius,
    safeFillHeight: liquidHeight * 0.9,
    surfaceReferenceRadius: innerRadius,
  };
  const liquidController = createCylinderLiquidController({
    solutionMesh: liquid,
    surfaceMesh: liquidSurface,
    profile: liquidProfile,
    state,
  });
  liquidController.setLiquidLevel(fillRatio);

  const apparatus = composeApparatus({
    group,
    name,
    kind: 'classic-reagent-bottle',
    family: 'showcase-bottle',
    meshes: { body, shoulder: body, neck: body, cap: stopperCap, stopper, mouthRim, liquid, liquidSurface, shadow },
    anchors,
    constraints: {
      innerRadius,
      innerHeight: liquidHeight,
      safeFillHeight: liquidHeight * 0.9,
    },
    state,
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'liquid',
      appearance: appearance?.name,
      liquidProfile,
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.12, 0.42),
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
