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
  createRoundedTubeGeometry,
  latheFromProfile,
} from './classic-showcase.js';

function testTubeProfile(radius, height, curveSegments = 14) {
  const pts = [];
  for (let i = 0; i <= curveSegments; i += 1) {
    const t = i / curveSegments;
    const phi = t * Math.PI * 0.5;
    const x = Math.max(0.0001, radius * Math.sin(phi));
    const y = radius * (1 - Math.cos(phi));
    pts.push([x, y]);
  }
  pts.push([radius, height - radius * 0.04]);
  pts.push([radius * 1.02, height]);
  return pts;
}

export function createClassicTestTubeApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.52,
  height = 4.35,
  fillRatio = 0.32,
  liquidColor = 0xe8f8ff,
  surfaceColor = 0xf8fdff,
  materials = {},
  appearance = clearWater(),
  name = 'classic-test-tube',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, liquidColor ?? appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, surfaceColor ?? appearance?.surfaceColor ?? 0xf8fdff);

  const innerRadius = radius * 0.84;
  const innerHeight = height * 0.78;

  const body = new THREE.Mesh(
    latheFromProfile(testTubeProfile(radius, height), 72),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const mouthRim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.03, radius * 0.05, 16, 48),
    rimMaterial,
  );
  mouthRim.position.y = height;
  mouthRim.rotation.x = Math.PI * 0.5;
  mouthRim.castShadow = true;
  mouthRim.receiveShadow = true;
  mouthRim.name = `${name}:mouthRim`;
  group.add(mouthRim);

  const liquid = new THREE.Mesh(
    createRoundedTubeGeometry(innerRadius, innerHeight, {
      radialSegments: 48,
      curveSegments: 14,
      centered: true,
    }),
    liquidMaterial,
  );
  liquid.position.y = radius + (innerHeight * 0.5) - 0.025;
  liquid.castShadow = true;
  liquid.receiveShadow = true;
  liquid.material.side = materials.liquidSide ?? THREE.FrontSide;
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 48),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  group.add(liquidSurface);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.56, radius + 0.18, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.68, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height - 0.16, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, height - 0.1, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, radius + 0.62, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, height - 0.08, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, radius + 0.18, 0, `${name}:heatZone`),
    sampleFloor: makeAnchor(group, 0, radius + 0.08, 0, `${name}:sampleFloor`),
  };

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight: innerHeight * 0.86,
    safePourRadius: innerRadius * 0.62,
    safePourClearance: 0.08,
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
    baseY: 0.025,
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
    kind: 'classic-test-tube',
    family: 'showcase-vessel',
    group,
    meshes: { tube: body, body, bottom: body, mouthRim, liquid, liquidSurface },
    anchors,
    constraints,
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
    planeGeometry: new THREE.PlaneGeometry(1.16, 0.42),
    role: 'vessel-body-label',
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
