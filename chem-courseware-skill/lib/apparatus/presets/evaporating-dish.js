import { composeApparatus, createCylinderLiquidController } from '../core.js';
import { clearWater } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonLiquidControllers,
  attachFixedPlaneLabel,
  attachLabelController,
  buildLiquidMaterials,
  cloneMaterial,
  makeAnchor,
} from './shared.js';

export function createEvaporatingDishApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.48,
  height = 0.24,
  fillRatio = 0.42,
  materials = {},
  appearance = clearWater(),
  name = 'evaporating-dish',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const porcelainMaterial = cloneMaterial(
    materials.porcelain,
    new THREE.MeshStandardMaterial({ color: 0xf6f4ec, roughness: 0.42, metalness: 0.02 })
  );
  const rimMaterial = cloneMaterial(
    materials.rim,
    new THREE.MeshStandardMaterial({ color: 0xd9e1e8, roughness: 0.36, metalness: 0.06 })
  );
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);

  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 36, 16, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.46),
    porcelainMaterial
  );
  bowl.scale.y = height / radius;
  bowl.position.y = height * 0.58;
  group.add(bowl);

  const innerRadius = radius * 0.78;
  const innerHeight = height * 0.58;
  const baseY = height * 0.16;
  const safeFillHeight = innerHeight * 0.72;

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.92, 0.025, 10, 48),
    rimMaterial
  );
  rim.position.y = height;
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const foot = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.36, 0.03, 10, 36),
    cloneMaterial(materials.foot, porcelainMaterial)
  );
  foot.position.y = 0.035;
  foot.rotation.x = Math.PI / 2;
  group.add(foot);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius * 0.72, innerHeight, 28),
    liquidMaterial
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 28),
    surfaceMaterial
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height + 0.24, radius * 0.86, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.72, radius * 0.44, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.02, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, height - 0.02, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, baseY + safeFillHeight * 0.6, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, height + 0.04, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.08, 0, `${name}:heatZone`),
  };

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight,
    safePourRadius: innerRadius * 0.78,
    safePourClearance: 0.06,
    effectBounds: {
      min: new THREE.Vector3(-innerRadius, 0, -innerRadius),
      max: new THREE.Vector3(innerRadius, height + 0.18, innerRadius),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };
  const liquidProfile = {
    baseY,
    height: innerHeight,
    radiusBottom: innerRadius * 0.72,
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
    kind: 'evaporating-dish',
    family: 'heated-vessel',
    group,
    meshes: { bowl, rim, foot, liquid, liquidSurface },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, appearance: appearance.name },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(0.96, 0.32),
    role: 'floating-badge',
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#d7edf8' });
  return apparatus;
}
