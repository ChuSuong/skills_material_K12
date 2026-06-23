import { composeApparatus, createCylinderLiquidController } from '../core.js';
import { clearWater } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonLiquidControllers,
  buildLiquidMaterials,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createTestTubeApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.18,
  height = 1.8,
  fillRatio = 0.46,
  materials = {},
  appearance = clearWater(),
  name = 'test-tube',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);
  const innerRadius = radius * 0.84;
  const innerHeight = height * 0.88;

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 24, 1, true),
    glassMaterial
  );
  tube.position.y = height * 0.5;
  group.add(tube);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    cloneMaterial(materials.base, glassMaterial)
  );
  bulb.position.y = radius;
  group.add(bulb);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 18),
    liquidMaterial
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 18),
    surfaceMaterial
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.3, 0, `${name}:labelAnchor`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, height - 0.12, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, 0.8, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, height - 0.04, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.2, 0, `${name}:heatZone`),
  };

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight: innerHeight * 0.82,
    safePourRadius: innerRadius * 0.6,
    safePourClearance: 0.08,
    effectBounds: {
      min: new THREE.Vector3(-innerRadius, 0, -innerRadius),
      max: new THREE.Vector3(innerRadius, height + 0.16, innerRadius),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };
  const liquidProfile = {
    baseY: radius + innerHeight * 0.5 - 0.02,
    height: innerHeight,
    radiusBottom: innerRadius,
    radiusTop: innerRadius,
    safeFillHeight: constraints.safeFillHeight,
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
    kind: 'test-tube',
    family: 'heated-vessel',
    group,
    meshes: { tube, bulb, liquid, liquidSurface },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, appearance: appearance.name },
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  return apparatus;
}
