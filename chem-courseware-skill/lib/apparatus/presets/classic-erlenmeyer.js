import { composeApparatus } from '../core.js';
import {
  THREE,
  addToParent,
  applyTransform,
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
} from './classic-showcase.js';

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
  name = 'classic-erlenmeyer',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, liquidColor);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, surfaceColor);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, 40, 1, true),
    glassMaterial,
  );
  body.position.y = bodyHeight * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const base = new THREE.Mesh(
    new THREE.CircleGeometry(bodyRadiusBottom * 0.96, 40),
    cloneMaterial(materials.base, glassMaterial),
  );
  base.rotation.x = -Math.PI * 0.5;
  base.position.y = 0.015;
  base.receiveShadow = true;
  group.add(base);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.08, neckHeight, 32, 1, true),
    cloneMaterial(materials.neck, glassMaterial),
  );
  neck.position.y = bodyHeight + neckHeight * 0.5 - 0.06;
  neck.castShadow = true;
  neck.receiveShadow = true;
  group.add(neck);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.16, neckRadius * 0.08, 14, 32),
    rimMaterial,
  );
  lip.position.y = bodyHeight + neckHeight - 0.06;
  lip.rotation.x = Math.PI * 0.5;
  lip.castShadow = true;
  lip.receiveShadow = true;
  group.add(lip);

  const innerRadius = bodyRadiusTop * 0.76;
  const liquidHeight = bodyHeight * 0.56;
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop * 0.72, bodyRadiusBottom * 0.66, liquidHeight, 32),
    liquidMaterial,
  );
  liquid.position.y = 0.34 + liquidHeight * 0.5;
  liquid.visible = fillRatio > 0.002;
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(bodyRadiusTop * 0.72, 32),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  liquidSurface.position.y = 0.34 + liquidHeight * fillRatio;
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

  const mouthY = bodyHeight + neckHeight - 0.1;
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
    fillRatio,
    gasOpacity,
  };

  const apparatus = composeApparatus({
    kind: 'classic-erlenmeyer',
    family: 'classic-showcase-vessel',
    group,
    meshes: { body, base, neck, lip, liquid, liquidSurface, gasVolume },
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
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#cfe56d' });
  if (gasVolume) {
    apparatus.controllers.setGasOpacity(gasOpacity);
  }
  return apparatus;
}
