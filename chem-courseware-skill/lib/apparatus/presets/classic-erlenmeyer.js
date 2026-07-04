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

function erlenmeyerProfile({
  bodyRadiusTop,
  bodyRadiusBottom,
  bodyHeight,
  neckRadius,
  neckHeight,
  coneSegments = 12,
  shoulderSegments = 14,
}) {
  const pts = [];
  pts.push([0.0001, 0]);
  pts.push([bodyRadiusBottom * 0.96, 0]);
  pts.push([bodyRadiusBottom, 0.06]);

  const shoulderStartY = bodyHeight * 0.82;
  for (let i = 1; i <= coneSegments; i += 1) {
    const t = i / coneSegments;
    const y = 0.06 + t * (shoulderStartY - 0.06);
    const r = bodyRadiusBottom + (bodyRadiusTop - bodyRadiusBottom) * t;
    pts.push([r, y]);
  }

  const shoulderEndY = bodyHeight + 0.16;
  for (let i = 1; i <= shoulderSegments; i += 1) {
    const t = i / shoulderSegments;
    const eased = t * t * (3 - 2 * t);
    const y = shoulderStartY + (shoulderEndY - shoulderStartY) * t;
    const r = bodyRadiusTop + (neckRadius - bodyRadiusTop) * eased;
    pts.push([r, y]);
  }

  const mouthY = bodyHeight + neckHeight - 0.06;
  pts.push([neckRadius, mouthY - 0.08]);
  pts.push([neckRadius * 1.14, mouthY]);
  return pts;
}

export function createClassicErlenmeyerApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bodyRadiusTop = 0.44,
  bodyRadiusBottom = 0.68,
  bodyHeight = 1.82,
  neckRadius = 0.18,
  neckHeight = 0.74,
  fillRatio = 0,
  liquidColor = 0xe8f8ff,
  surfaceColor = 0xf8fdff,
  gasColor = null,
  gasOpacity = 0.14,
  gasHeightRatio = 0.62,
  gasBaseY = 0.4,
  materials = {},
  appearance = clearWater(),
  name = 'classic-erlenmeyer',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, liquidColor ?? appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, surfaceColor ?? appearance?.surfaceColor ?? 0xf8fdff);

  const body = new THREE.Mesh(
    latheFromProfile(erlenmeyerProfile({
      bodyRadiusTop,
      bodyRadiusBottom,
      bodyHeight,
      neckRadius,
      neckHeight,
    }), 64),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const mouthY = bodyHeight + neckHeight - 0.06;
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.16, neckRadius * 0.08, 14, 32),
    rimMaterial,
  );
  lip.position.y = mouthY;
  lip.rotation.x = Math.PI * 0.5;
  lip.castShadow = true;
  lip.receiveShadow = true;
  group.add(lip);

  const innerRadius = bodyRadiusBottom * 0.72;
  const liquidBaseY = 0.06;
  const liquidHeight = bodyHeight * 0.72;

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop * 0.7, bodyRadiusBottom * 0.72, liquidHeight, 40),
    liquidMaterial,
  );
  liquid.position.y = liquidBaseY + liquidHeight * 0.5;
  liquid.visible = fillRatio > 0.002;
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(bodyRadiusTop * 0.7, 40),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  liquidSurface.visible = fillRatio > 0.002;
  group.add(liquidSurface);

  let gasVolume = null;
  if (gasColor !== null && gasColor !== undefined) {
    gasVolume = new THREE.Mesh(
      new THREE.CylinderGeometry(bodyRadiusTop * 0.7, bodyRadiusBottom * 0.56, bodyHeight * gasHeightRatio, 28),
      cloneMaterial(
        materials.gas,
        new THREE.MeshPhysicalMaterial({
          color: gasColor,
          transparent: true,
          opacity: gasOpacity,
          roughness: 0.26,
          metalness: 0,
          transmission: 0.12,
          thickness: 0.1,
          depthWrite: false,
        }),
      ),
    );
    gasVolume.position.y = gasBaseY + (bodyHeight * gasHeightRatio) * 0.5;
    group.add(gasVolume);
  }

  const anchors = {
    labelAnchor: makeAnchor(group, 0, bodyHeight * 0.52, bodyRadiusBottom + 0.08, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, bodyHeight * 0.7, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, mouthY - 0.16, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, mouthY, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, mouthY - 0.14, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, bodyHeight * 0.52, 0, `${name}:effectOrigin`),
    gasVolume: makeAnchor(group, 0, gasBaseY + (bodyHeight * gasHeightRatio) * 0.5, 0, `${name}:gasVolume`),
    steamOrigin: makeAnchor(group, 0, mouthY - 0.06, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.24, 0, `${name}:heatZone`),
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
    gasOpacity,
  };
  const liquidProfile = {
    baseY: liquidBaseY,
    height: liquidHeight,
    radiusBottom: bodyRadiusBottom * 0.72,
    radiusTop: bodyRadiusTop * 0.7,
    safeFillHeight: liquidHeight * 0.92,
    surfaceReferenceRadius: bodyRadiusTop * 0.7,
  };
  const liquidController = createCylinderLiquidController({
    solutionMesh: liquid,
    surfaceMesh: liquidSurface,
    profile: liquidProfile,
    state,
  });
  liquidController.setLiquidLevel(fillRatio);

  const apparatus = composeApparatus({
    kind: 'classic-erlenmeyer',
    family: 'classic-showcase-vessel',
    group,
    meshes: { body, base: body, neck: body, lip, liquid, liquidSurface, gasVolume },
    anchors,
    constraints: {
      innerRadius,
      innerHeight: liquidHeight,
      safeFillHeight: liquidHeight * 0.92,
      safePourRadius: neckRadius * 1.22,
      safePourClearance: 0.18,
      effectBounds: {
        min: new THREE.Vector3(-bodyRadiusBottom * 0.72, 0.12, -bodyRadiusBottom * 0.72),
        max: new THREE.Vector3(bodyRadiusBottom * 0.72, mouthY + 0.1, bodyRadiusBottom * 0.72),
      },
    },
    state,
    meta: {
      visualFamily: 'classic-showcase',
      contentKind: 'liquid',
      appearance: appearance?.name,
      liquidProfile,
    },
  });

  apparatus.controllers.setGasOpacity = (nextOpacity = gasOpacity) => {
    if (!gasVolume) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, nextOpacity));
    gasVolume.material.opacity = clamped;
    gasVolume.visible = clamped > 0.002;
    state.gasOpacity = clamped;
  };

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(Math.max(bodyRadiusBottom * 1.18, 0.82), Math.max(bodyHeight * 0.24, 0.46)),
    role: 'vessel-body-label',
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#cfe56d' });
  if (gasVolume) {
    apparatus.controllers.setGasOpacity(gasOpacity);
  }
  return apparatus;
}
