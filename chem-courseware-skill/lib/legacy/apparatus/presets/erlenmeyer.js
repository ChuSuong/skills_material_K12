import { composeApparatus, createCylinderLiquidController } from '../../../apparatus/core.js';
import { clearWater } from '../../../apparatus/chemicals.js';
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
} from '../../../apparatus/presets/shared.js';

export function createErlenmeyerApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  bodyRadiusTop = 0.46,
  bodyRadiusBottom = 0.66,
  bodyHeight = 1.75,
  neckRadius = 0.18,
  neckHeight = 0.72,
  fillRatio = 0.58,
  liquidHeightRatio = 0.58,
  liquidBaseY = 0.34,
  safeFillRatio = 0.98,
  gasColor = null,
  gasOpacity = 0.14,
  gasHeightRatio = 0.62,
  gasBaseY = 0.38,
  materials = {},
  appearance = clearWater(),
  name = 'erlenmeyer',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const { liquidMaterial, surfaceMaterial } = buildLiquidMaterials(materials, appearance);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop, bodyRadiusBottom, bodyHeight, 10, 1, true),
    glassMaterial
  );
  body.position.y = bodyHeight * 0.5;
  body.castShadow = true;
  group.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.12, neckHeight, 24, 1, true),
    cloneMaterial(materials.neck, glassMaterial)
  );
  neck.position.y = bodyHeight + neckHeight * 0.5 - 0.08;
  neck.castShadow = true;
  group.add(neck);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.18, 0.025, 14, 24),
    cloneMaterial(materials.lip, appearance.createSurfaceMaterial({ opacity: 0.88 }))
  );
  lip.position.y = bodyHeight + neckHeight - 0.08;
  lip.rotation.x = Math.PI / 2;
  group.add(lip);

  const liquidHeight = bodyHeight * liquidHeightRatio;
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(bodyRadiusTop * 0.78, bodyRadiusBottom * 0.72, liquidHeight, 10),
    liquidMaterial
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(bodyRadiusTop * 0.78, 24),
    surfaceMaterial
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  group.add(liquidSurface);

  const hasGasVolume = gasColor !== null && gasColor !== undefined;
  let gasVolume = null;
  if (hasGasVolume) {
    gasVolume = new THREE.Mesh(
      new THREE.CylinderGeometry(bodyRadiusTop * 0.68, bodyRadiusBottom * 0.56, bodyHeight * gasHeightRatio, 18),
      cloneMaterial(
        materials.gas,
        new THREE.MeshPhysicalMaterial({
          color: gasColor,
          transparent: true,
          opacity: gasOpacity,
          roughness: 0.38,
          metalness: 0,
          transmission: 0.16,
          thickness: 0.18,
          depthWrite: false,
        })
      )
    );
    gasVolume.position.y = gasBaseY + (bodyHeight * gasHeightRatio) * 0.5;
    group.add(gasVolume);
  }

  const mouthY = bodyHeight + neckHeight - 0.12;
  const anchors = {
    labelAnchor: makeAnchor(group, 0, bodyHeight * 0.52, bodyRadiusBottom + 0.075, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, bodyHeight * 0.72, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, mouthY - 0.18, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, mouthY, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, mouthY - 0.18, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, bodyHeight * 0.52, 0, `${name}:effectOrigin`),
    gasVolume: makeAnchor(group, 0, gasBaseY + (bodyHeight * gasHeightRatio) * 0.5, 0, `${name}:gasVolume`),
    steamOrigin: makeAnchor(group, 0, mouthY - 0.05, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.22, 0, `${name}:heatZone`),
  };

  const constraints = {
    innerRadius: bodyRadiusTop * 0.78,
    innerHeight: liquidHeight,
    safeFillHeight: liquidHeight * safeFillRatio,
    safePourRadius: neckRadius * 1.25,
    safePourClearance: 0.18,
    effectBounds: {
      min: new THREE.Vector3(-bodyRadiusBottom * 0.72, 0.18, -bodyRadiusBottom * 0.72),
      max: new THREE.Vector3(bodyRadiusBottom * 0.72, mouthY + 0.12, bodyRadiusBottom * 0.72),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
  };

  const liquidProfile = {
    baseY: liquidBaseY,
    height: liquidHeight,
    radiusBottom: bodyRadiusBottom * 0.72,
    radiusTop: bodyRadiusTop * 0.78,
    safeFillHeight: constraints.safeFillHeight,
    surfaceReferenceRadius: bodyRadiusTop * 0.78,
  };

  const liquidController = createCylinderLiquidController({
    solutionMesh: liquid,
    surfaceMesh: liquidSurface,
    profile: liquidProfile,
    state,
  });
  liquidController.setLiquidLevel(fillRatio);

  const apparatus = composeApparatus({
    kind: 'erlenmeyer',
    family: 'narrow-neck-vessel',
    group,
    meshes: { body, neck, lip, liquid, liquidSurface, gasVolume },
    anchors,
    constraints,
    state,
    meta: { liquidProfile, appearance: appearance.name, hasGasVolume },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(Math.max(bodyRadiusBottom * 1.28, 0.72), Math.max(bodyHeight * 0.27, 0.48)),
    role: 'vessel-body-label',
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  apparatus.controllers.setGasOpacity = (nextOpacity = gasOpacity) => {
    if (!gasVolume) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, nextOpacity));
    gasVolume.material.opacity = clamped;
    gasVolume.visible = clamped > 0.002;
    state.gasOpacity = clamped;
  };
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  if (gasVolume) {
    apparatus.controllers.setGasOpacity(gasOpacity);
  }
  return apparatus;
}
