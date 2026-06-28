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
  attachLabelController,
  attachFixedPlaneLabel,
} from './shared.js';

const BEAKER_VISUAL_PROFILES = {
  'standard-lab': {
    glassOpacity: 0.28,
    glassTransmission: 0.92,
    liquidOpacityMultiplier: 1,
    surfaceOpacityMultiplier: 1,
    liquidEmissive: 0x103a6b,
    liquidEmissiveIntensity: 0.14,
    shadowOpacity: 0.12,
    haloOpacity: 0.14,
  },
  'clear-inspection': {
    glassOpacity: 0.22,
    glassTransmission: 0.96,
    liquidOpacityMultiplier: 0.78,
    surfaceOpacityMultiplier: 0.8,
    liquidEmissive: 0x0e3158,
    liquidEmissiveIntensity: 0.08,
    shadowOpacity: 0.08,
    haloOpacity: 0.1,
  },
};

function resolveBeakerVisualProfile(name = 'standard-lab') {
  return BEAKER_VISUAL_PROFILES[name] || BEAKER_VISUAL_PROFILES['standard-lab'];
}

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
  visualProfile = 'standard-lab',
  shadow = 'soft',
  halo = 'none',
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
  const resolvedVisualProfile = resolveBeakerVisualProfile(visualProfile);

  glassMaterial.opacity = resolvedVisualProfile.glassOpacity;
  glassMaterial.transmission = resolvedVisualProfile.glassTransmission;
  liquidMaterial.opacity *= resolvedVisualProfile.liquidOpacityMultiplier;
  liquidMaterial.emissive = new THREE.Color(resolvedVisualProfile.liquidEmissive);
  liquidMaterial.emissiveIntensity = resolvedVisualProfile.liquidEmissiveIntensity;
  surfaceMaterial.opacity *= resolvedVisualProfile.surfaceOpacityMultiplier;

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

  let shadowPad = null;
  if (shadow !== 'none') {
    shadowPad = new THREE.Mesh(
      new THREE.CircleGeometry(radius * 1.42, 36),
      new THREE.MeshBasicMaterial({
        color: 0x08111f,
        transparent: true,
        opacity: resolvedVisualProfile.shadowOpacity,
      })
    );
    shadowPad.rotation.x = -Math.PI / 2;
    shadowPad.position.y = 0.004;
    group.add(shadowPad);
  }

  let haloRing = null;
  if (halo !== 'none') {
    haloRing = new THREE.Mesh(
      new THREE.RingGeometry(innerRadius * 1.06, radius * 1.32, 36),
      new THREE.MeshBasicMaterial({
        color: 0x58a8ff,
        transparent: true,
        opacity: resolvedVisualProfile.haloOpacity,
        side: THREE.DoubleSide,
      })
    );
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = baseY + 0.01;
    group.add(haloRing);
  }

  const interactionZoneY = pourTargetHeight ?? height - wallThickness - 0.06;
  const anchors = attachCommonContainerAnchors({
    group,
    name,
    labelY: height + labelHeight,
    labelPosition: [0, height * 0.62, radius + 0.075],
    mouthY: height,
    pourTargetY: interactionZoneY,
    effectY: baseY + safeFillHeight * 0.55,
    gripY: height * 0.56,
    extra: {
      interactionZone: makeAnchor(group, 0, interactionZoneY, 0, `${name}:interactionZone`),
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
    meshes: { body, bottom, liquid, liquidSurface, shadowPad, haloRing },
    anchors,
    constraints,
    state,
    meta: {
      liquidProfile,
      appearance: appearance.name,
      visualProfile: {
        name: visualProfile,
        ...resolvedVisualProfile,
        liquidOpacity: liquidMaterial.opacity,
        surfaceOpacity: surfaceMaterial.opacity,
      },
      visuals: { shadow, halo },
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(Math.max(radius * 1.38, 0.92), Math.max(height * 0.32, 0.42)),
    role: 'vessel-body-label',
  });

  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });

  return apparatus;
}
