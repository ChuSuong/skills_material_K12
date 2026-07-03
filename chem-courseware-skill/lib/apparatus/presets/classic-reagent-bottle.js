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
} from './classic-showcase.js';

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
  const capMaterial = cloneMaterial(
    materials.cap,
    new THREE.MeshStandardMaterial({ color: 0x2d3647, roughness: 0.62, metalness: 0.22 }),
  );

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.94, height, 40),
    glassMaterial,
  );
  body.position.y = height * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.8, radius * 0.98, 0.34, 40),
    glassMaterial,
  );
  shoulder.position.y = height + 0.1;
  shoulder.castShadow = true;
  shoulder.receiveShadow = true;
  group.add(shoulder);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32),
    glassMaterial,
  );
  neck.position.y = height + 0.27 + (neckHeight * 0.5);
  neck.castShadow = true;
  neck.receiveShadow = true;
  group.add(neck);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.12, neckRadius * 1.12, 0.26, 28),
    capMaterial,
  );
  cap.position.y = height + neckHeight + 0.36;
  cap.castShadow = true;
  cap.receiveShadow = true;
  group.add(cap);

  const mouthRim = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.02, 0.03, 12, 30),
    rimMaterial,
  );
  mouthRim.position.y = height + 0.27 + neckHeight;
  mouthRim.rotation.x = Math.PI * 0.5;
  group.add(mouthRim);

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.83, radius * 0.8, height * 0.8, 32),
    liquidMaterial,
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.83, 32),
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
    labelAnchor: makeAnchor(group, 0, height * 0.64, radius + 0.22, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height + 0.4, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height + 0.3, 0, `${name}:interactionZone`),
    pourAlign: makeAnchor(group, 0, height + 0.24, 0, `${name}:pourAlign`),
    nozzle: makeAnchor(group, 0, height + 0.27 + neckHeight, 0, `${name}:nozzle`),
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };
  const liquidProfile = {
    baseY: 0.18,
    height: height * 0.8,
    radiusBottom: radius * 0.8,
    radiusTop: radius * 0.83,
    safeFillHeight: height * 0.7,
    surfaceReferenceRadius: radius * 0.83,
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
    meshes: { body, shoulder, neck, cap, mouthRim, liquid, liquidSurface, shadow },
    anchors,
    constraints: {
      innerRadius: radius * 0.82,
      innerHeight: height * 0.8,
      safeFillHeight: height * 0.7,
    },
    state,
    meta: { visualFamily: 'classic-showcase' },
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
