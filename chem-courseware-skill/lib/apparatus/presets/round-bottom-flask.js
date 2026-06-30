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
  createDefaultGlassMaterial,
  makeAnchor,
} from './shared.js';

export function createRoundBottomFlaskApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bodyRadius = 0.58,
  neckRadius = 0.17,
  neckHeight = 0.72,
  fillRatio = 0.46,
  materials = {},
  appearance = clearWater(),
  name = 'round-bottom-flask',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);
  const bodyCenterY = bodyRadius;
  const mouthY = bodyRadius * 2 + neckHeight - 0.04;

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(bodyRadius, 36, 22, 0, Math.PI * 2, 0.08, Math.PI - 0.08),
    glassMaterial,
  );
  body.position.y = bodyCenterY;
  body.castShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.08, neckHeight, 24, 1, true),
    cloneMaterial(materials.neck, glassMaterial),
  );
  neck.position.y = bodyRadius * 2 + neckHeight * 0.5 - 0.08;
  group.add(neck);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.16, 0.024, 12, 28),
    cloneMaterial(materials.lip, appearance.createSurfaceMaterial({ opacity: 0.86 })),
  );
  lip.position.y = mouthY;
  lip.rotation.x = Math.PI / 2;
  group.add(lip);

  const innerRadius = bodyRadius * 0.72;
  const innerHeight = bodyRadius * 1.08;
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius * 0.82, innerRadius, innerHeight, 28),
    liquidMaterial,
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius * 0.82, 28),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, bodyRadius * 1.18, bodyRadius + 0.07, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, bodyRadius * 2.05, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, mouthY - 0.12, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, mouthY, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, mouthY - 0.12, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, bodyRadius, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, mouthY - 0.04, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, bodyRadius * 0.28, 0, `${name}:heatZone`),
  };

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight: innerHeight * 0.82,
    safePourRadius: neckRadius * 1.2,
    safePourClearance: 0.14,
    effectBounds: {
      min: new THREE.Vector3(-innerRadius, bodyRadius * 0.18, -innerRadius),
      max: new THREE.Vector3(innerRadius, mouthY + 0.1, innerRadius),
    },
  };

  const state = { fillRatio: 0, fillHeight: 0 };
  const liquidProfile = {
    baseY: bodyRadius * 0.42,
    height: innerHeight,
    radiusBottom: innerRadius,
    radiusTop: innerRadius * 0.82,
    safeFillHeight: constraints.safeFillHeight,
    surfaceReferenceRadius: innerRadius * 0.82,
  };
  const liquidController = createCylinderLiquidController({
    solutionMesh: liquid,
    surfaceMesh: liquidSurface,
    profile: liquidProfile,
    state,
  });
  liquidController.setLiquidLevel(fillRatio);

  const apparatus = composeApparatus({
    kind: 'round-bottom-flask',
    family: 'narrow-neck-vessel',
    group,
    meshes: { body, neck, lip, liquid, liquidSurface },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, appearance: appearance.name },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(bodyRadius * 1.5, bodyRadius * 0.62),
    role: 'vessel-body-label',
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
