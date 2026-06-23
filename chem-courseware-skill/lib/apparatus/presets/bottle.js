import { composeApparatus, createCylinderLiquidController } from '../core.js';
import { diluteAcid } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonLiquidControllers,
  buildLiquidMaterials,
  clamp,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createBottleApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bodyRadiusTop = 0.18,
  bodyRadiusBottom = 0.22,
  bodyHeight = 0.8,
  neckRadius = 0.08,
  neckHeight = 0.22,
  fillRatio = 0.78,
  pourPose = {},
  materials = {},
  appearance = diluteAcid(),
  name = 'bottle',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, 28),
    glassMaterial
  );
  body.castShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.12, neckHeight, 20),
    cloneMaterial(materials.neck, glassMaterial)
  );
  neck.position.y = bodyHeight * 0.5 + neckHeight * 0.5;
  neck.castShadow = true;
  group.add(neck);

  const liquidHeight = bodyHeight * 0.82;
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop * 0.82, bodyRadiusBottom * 0.82, liquidHeight, 24),
    liquidMaterial
  );
  liquid.position.y = -bodyHeight * 0.08;
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(bodyRadiusTop * 0.82, 24),
    surfaceMaterial
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, 0.1, bodyRadiusBottom + 0.18, `${name}:labelAnchor`),
    mouth: makeAnchor(group, 0, bodyHeight * 0.5 + neckHeight, 0, `${name}:mouth`),
    nozzle: makeAnchor(group, 0, bodyHeight * 0.5 + neckHeight + 0.04, 0, `${name}:nozzle`),
  };

  const constraints = {
    innerRadius: Math.min(bodyRadiusTop, bodyRadiusBottom) * 0.82,
    innerHeight: liquidHeight,
    safeFillHeight: liquidHeight * 0.96,
    tiltLimit: pourPose.tiltLimit ?? 1.15,
    effectBounds: {
      min: new THREE.Vector3(-bodyRadiusBottom, -bodyHeight * 0.48, -bodyRadiusBottom),
      max: new THREE.Vector3(bodyRadiusBottom, bodyHeight * 0.7 + neckHeight, bodyRadiusBottom),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
    pourProgress: 0,
  };

  const liquidProfile = {
    baseY: -bodyHeight * 0.08 - liquidHeight * 0.5,
    height: liquidHeight,
    radiusBottom: bodyRadiusBottom * 0.82,
    radiusTop: bodyRadiusTop * 0.82,
    safeFillHeight: constraints.safeFillHeight,
    surfaceReferenceRadius: bodyRadiusTop * 0.82,
  };

  const liquidController = createCylinderLiquidController({
    solutionMesh: liquid,
    surfaceMesh: liquidSurface,
    profile: liquidProfile,
    state,
  });
  liquidController.setLiquidLevel(fillRatio);

  const basePosition = new THREE.Vector3(...position);
  const baseRotation = new THREE.Euler(...rotation);
  const travel = new THREE.Vector3(...(pourPose.travel ?? [0, 0, 0]));
  const tilt = pourPose.tilt ?? [0, 0, 0];

  const apparatus = composeApparatus({
    kind: 'bottle',
    family: 'transfer-tool',
    group,
    meshes: { body, neck, liquid, liquidSurface },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, basePosition, baseRotation, travel, tilt, appearance: appearance.name },
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  apparatus.controllers.setPourPose = (progress) => {
    const value = clamp(progress, 0, 1);
    apparatus.state.pourProgress = value;
    group.position.copy(basePosition).addScaledVector(travel, value);
    group.rotation.set(
      baseRotation.x + tilt[0] * value,
      baseRotation.y + tilt[1] * value,
      baseRotation.z + tilt[2] * value
    );
  };
  return apparatus;
}

export function createReagentBottleApparatus(options = {}) {
  const apparatus = createBottleApparatus({
    appearance: diluteAcid(),
    ...options,
  });
  apparatus.kind = 'reagent-bottle';
  apparatus.meta = {
    ...apparatus.meta,
    reagentBottle: true,
  };
  return apparatus;
}
