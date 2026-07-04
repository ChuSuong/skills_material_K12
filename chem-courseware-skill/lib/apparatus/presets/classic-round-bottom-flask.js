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
  latheFromProfile,
} from './classic-showcase.js';

function roundBottomFlaskProfile(radius, neckRadius, neckHeight) {
  const pts = [];
  const bulbSegments = 24;
  for (let i = 0; i <= bulbSegments; i += 1) {
    const t = i / bulbSegments;
    const angle = Math.PI * (1.02 - t * 0.88);
    const x = Math.sin(angle) * radius;
    const y = radius + Math.cos(angle) * radius;
    pts.push([Math.max(0.0001, x), Math.max(0, y)]);
  }
  const shoulderTop = radius * 2 + radius * 0.02;
  const easeSegments = 10;
  for (let i = 1; i <= easeSegments; i += 1) {
    const t = i / easeSegments;
    const x = pts[pts.length - 1][0] * (1 - t) + neckRadius * t;
    const y = shoulderTop + radius * 0.24 * t;
    pts.push([x, y]);
  }
  pts.push([neckRadius, shoulderTop + radius * 0.24 + neckHeight]);
  return pts;
}

export function createClassicRoundBottomFlaskApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.9,
  neckRadius = 0.24,
  neckHeight = 0.9,
  fillRatio = 0.5,
  materials = {},
  appearance = clearWater(),
  name = 'classic-round-bottom-flask',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, appearance?.surfaceColor ?? 0xf8fdff);

  const profile = roundBottomFlaskProfile(radius, neckRadius, neckHeight);
  const totalHeight = profile[profile.length - 1][1];

  const body = new THREE.Mesh(
    latheFromProfile(profile, 84),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.06, neckRadius * 0.08, 12, 32),
    rimMaterial,
  );
  rim.position.y = totalHeight;
  rim.rotation.x = Math.PI * 0.5;
  group.add(rim);

  const innerRadius = radius * 0.9;
  const innerHeight = radius * 1.6;
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(innerRadius, 32, 20, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4),
    liquidMaterial,
  );
  liquid.position.y = radius;
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius * 0.9, 40),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, radius * 0.9, radius + 0.14, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, totalHeight - neckHeight * 0.4, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, totalHeight - 0.08, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, totalHeight, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, totalHeight - 0.08, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, radius, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, totalHeight - 0.04, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.02, 0, `${name}:heatZone`),
    standAnchor: makeAnchor(group, 0, radius * 1.9, 0, `${name}:standAnchor`),
    clampZone: makeAnchor(group, 0, radius * 2 + radius * 0.14, 0, `${name}:clampZone`),
  };

  const state = { fillRatio: 0, fillHeight: 0 };
  const liquidProfile = {
    baseY: 0,
    height: innerHeight,
    radiusBottom: innerRadius * 0.4,
    radiusTop: innerRadius * 0.9,
    safeFillHeight: innerHeight * 0.7,
    surfaceReferenceRadius: innerRadius * 0.9,
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
    kind: 'classic-round-bottom-flask',
    family: 'showcase-vessel',
    meshes: { body, rim, liquid, liquidSurface },
    anchors,
    constraints: {
      innerRadius,
      innerHeight,
      safeFillHeight: innerHeight * 0.7,
      safePourRadius: neckRadius * 0.9,
      safePourClearance: 0.12,
    },
    state,
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'liquid',
      appearance: appearance.name,
      liquidProfile,
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.1, 0.4),
    role: 'vessel-body-label',
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
