import { composeApparatus, createCylinderLiquidController } from '../core.js';
import { clearWater } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonContainerAnchors,
  attachCommonLiquidControllers,
  buildLiquidMaterials,
  cloneMaterial,
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createBeakerApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.6,
  height = 1.2,
  wallThickness = 0.05,
  fillRatio = 0.58,
  labelHeight = 0.28,
  pourTargetHeight = null,
  materials = {},
  appearance = clearWater(),
  name = 'beaker',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const innerRadius = Math.max(radius - wallThickness, radius * 0.8);
  const innerHeight = Math.max(height - wallThickness * 1.4, height * 0.84);
  const baseY = wallThickness;
  const safeFillHeight = innerHeight * 0.9;
  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 40, 1, true),
    glassMaterial
  );
  body.position.y = height * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius * 0.98, innerRadius * 0.98, wallThickness, 40),
    cloneMaterial(materials.base, glassMaterial)
  );
  bottom.position.y = wallThickness * 0.5;
  bottom.receiveShadow = true;
  group.add(bottom);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 32),
    liquidMaterial
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 32),
    surfaceMaterial
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const anchors = attachCommonContainerAnchors({
    group,
    name,
    labelY: height + labelHeight,
    mouthY: height,
    pourTargetY: pourTargetHeight ?? height - wallThickness - 0.06,
    effectY: baseY + safeFillHeight * 0.55,
    extra: {
      steamOrigin: makeAnchor(group, 0, height - wallThickness - 0.04, 0, `${name}:steamOrigin`),
      heatZone: makeAnchor(group, 0, wallThickness + 0.12, 0, `${name}:heatZone`),
    },
  });

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight,
    safePourRadius: innerRadius * 0.68,
    safePourClearance: 0.06,
    effectBounds: {
      min: new THREE.Vector3(-innerRadius, 0, -innerRadius),
      max: new THREE.Vector3(innerRadius, height + 0.22, innerRadius),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };

  const liquidProfile = {
    baseY,
    height: innerHeight,
    radiusBottom: innerRadius,
    radiusTop: innerRadius,
    safeFillHeight,
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
    kind: 'beaker',
    family: 'open-vessel',
    group,
    meshes: { body, bottom, liquid, liquidSurface },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, appearance: appearance.name },
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  return apparatus;
}
