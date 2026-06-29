import { composeApparatus } from '../core.js';
import { yellowPrecipitate } from '../chemicals.js';
import {
  THREE,
  addToParent,
  applyTransform,
  attachCommonContainerAnchors,
  attachFixedPlaneLabel,
  attachLabelController,
  clamp,
  cloneMaterial,
  createDefaultGlassMaterial,
  validateFillLevel,
  makeAnchor,
} from './shared.js';

export function createSolidReagentJarApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.22,
  height = 0.7,
  neckRadius = 0.12,
  neckHeight = 0.12,
  wallThickness = 0.04,
  fillRatio = 0.72,
  pourPose = {},
  materials = {},
  appearance = yellowPrecipitate(),
  name = 'solid-reagent-jar',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = cloneMaterial(materials.glass, createDefaultGlassMaterial());
  const solidMaterial = cloneMaterial(
    materials.solid,
    appearance.createSurfaceMaterial({
      opacity: 0.94,
      roughness: 0.74,
      metalness: 0,
    })
  );
  const lidMaterial = cloneMaterial(
    materials.lid,
    new THREE.MeshStandardMaterial({ color: 0xeff4f8, roughness: 0.42, metalness: 0.08 })
  );

  const innerRadius = Math.max(radius - wallThickness, radius * 0.78);
  const bodyHeight = Math.max(height - neckHeight, height * 0.76);
  const innerHeight = Math.max(bodyHeight - wallThickness * 1.3, bodyHeight * 0.82);
  const baseY = wallThickness;
  const safeFillHeight = innerHeight * 0.92;
  const solidSurfaceY = baseY + safeFillHeight * clamp(fillRatio, 0, 1);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius, bodyHeight, 28),
    glassMaterial
  );
  body.position.y = bodyHeight * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const shoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.16, radius * 0.9, neckHeight * 0.78, 24),
    cloneMaterial(materials.shoulder, glassMaterial)
  );
  shoulder.position.y = bodyHeight + neckHeight * 0.18;
  shoulder.castShadow = true;
  group.add(shoulder);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.06, neckHeight, 20),
    cloneMaterial(materials.neck, glassMaterial)
  );
  neck.position.y = bodyHeight + neckHeight * 0.5;
  neck.castShadow = true;
  group.add(neck);

  const bottom = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius * 0.96, innerRadius * 0.98, wallThickness, 24),
    cloneMaterial(materials.base, glassMaterial)
  );
  bottom.position.y = wallThickness * 0.5;
  bottom.receiveShadow = true;
  group.add(bottom);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius * 1.18, neckRadius * 1.24, 0.09, 20),
    lidMaterial
  );
  lid.position.y = bodyHeight + neckHeight + 0.045;
  lid.castShadow = true;
  group.add(lid);

  const solid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius * 0.96, innerRadius * 0.99, safeFillHeight, 20),
    solidMaterial
  );
  group.add(solid);

  const solidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius * 0.98, 20),
    cloneMaterial(materials.surface, appearance.createSurfaceMaterial({ opacity: 0.96, roughness: 0.78 }))
  );
  solidSurface.rotation.x = -Math.PI / 2;
  group.add(solidSurface);

  const granules = new THREE.Points(
    new THREE.BufferGeometry(),
    cloneMaterial(materials.granules, appearance.createPointsMaterial({ size: 0.032, opacity: 0.18 }))
  );
  const granulePositions = [];
  for (let i = 0; i < 44; i += 1) {
    const angle = (i / 44) * Math.PI * 2;
    const radiusScale = 0.2 + (i % 6) * 0.11;
    granulePositions.push(
      Math.cos(angle) * innerRadius * radiusScale,
      baseY + 0.04 + (i % 5) * 0.022,
      Math.sin(angle) * innerRadius * radiusScale
    );
  }
  granules.geometry.setAttribute('position', new THREE.Float32BufferAttribute(granulePositions, 3));
  group.add(granules);

  const mouthY = bodyHeight + neckHeight;
  const anchors = attachCommonContainerAnchors({
    group,
    name,
    labelY: mouthY + 0.32,
    labelPosition: [0, bodyHeight * 0.54, radius + 0.055],
    mouthY,
    pourTargetY: bodyHeight + neckHeight * 0.38,
    effectY: baseY + safeFillHeight * 0.7,
    gripY: bodyHeight * 0.62,
    extra: {
      interactionZone: makeAnchor(group, 0, bodyHeight + neckHeight * 0.38, 0, `${name}:interactionZone`),
      dropAnchor: makeAnchor(group, 0, bodyHeight + neckHeight * 0.52, 0, `${name}:dropAnchor`),
      scoopTarget: makeAnchor(group, 0, baseY + safeFillHeight * 0.72, 0, `${name}:scoopTarget`),
    },
  });

  const constraints = {
    innerRadius,
    innerHeight,
    safeFillHeight,
    safePourRadius: neckRadius * 1.25,
    safePourClearance: 0.08,
    tiltLimit: pourPose.tiltLimit ?? 1.05,
    solidSurfaceY,
    effectBounds: {
      min: new THREE.Vector3(-innerRadius, 0, -innerRadius),
      max: new THREE.Vector3(innerRadius, mouthY + 0.12, innerRadius),
    },
  };

  const state = {
    fillRatio: 0,
    fillHeight: 0,
    pourProgress: 0,
    effectIntensity: 0,
  };

  function setSolidLevel(nextFillRatio) {
    const value = clamp(nextFillRatio, 0, 1);
    state.fillRatio = value;
    state.fillHeight = Math.min(safeFillHeight, safeFillHeight * value);
    const normalized = safeFillHeight <= 0 ? 0 : state.fillHeight / safeFillHeight;
    solid.scale.set(1, Math.max(normalized, 0.0001), 1);
    solid.position.y = baseY + state.fillHeight * 0.5;
    solidSurface.position.y = baseY + state.fillHeight;
    const surfaceRadius = innerRadius * (0.94 + normalized * 0.04);
    solidSurface.scale.setScalar(surfaceRadius / (innerRadius * 0.98));
    constraints.solidSurfaceY = solidSurface.position.y;
    anchors.scoopTarget.position.y = baseY + state.fillHeight * 0.82;
    anchors.effectOrigin.position.y = baseY + state.fillHeight * 0.68;
    return {
      fillRatio: state.fillRatio,
      fillHeight: state.fillHeight,
    };
  }

  const basePosition = new THREE.Vector3(...position);
  const baseRotation = new THREE.Euler(...rotation);
  const travel = new THREE.Vector3(...(pourPose.travel ?? [0, 0, 0]));
  const tilt = pourPose.tilt ?? [0.08, 0, -0.72];

  const apparatus = composeApparatus({
    kind: 'solid-reagent-jar',
    family: 'solid-reagent-container',
    group,
    meshes: { body, shoulder, neck, bottom, lid, solid, solidSurface, granules },
    anchors,
    constraints,
    state,
    meta: {
      basePosition,
      baseRotation,
      travel,
      tilt,
      fillMode: 'solid',
      appearance: appearance.name,
    },
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(Math.max(radius * 2.55, 0.56), Math.max(bodyHeight * 0.34, 0.36)),
    role: 'vessel-body-label',
  });

  apparatus.controllers = {
    setFillLevel(nextFillRatio) {
      return setSolidLevel(nextFillRatio);
    },
    setLiquidLevel(nextFillRatio) {
      return setSolidLevel(nextFillRatio);
    },
    setPourPose(progress) {
      const value = clamp(progress, 0, 1);
      apparatus.state.pourProgress = value;
      group.position.copy(basePosition).addScaledVector(travel, value);
      group.rotation.set(
        baseRotation.x + tilt[0] * value,
        baseRotation.y + tilt[1] * value,
        baseRotation.z + tilt[2] * value
      );
    },
    setEffectIntensity(value) {
      const intensity = clamp(value, 0, 1);
      apparatus.state.effectIntensity = intensity;
      granules.material.opacity = 0.08 + intensity * 0.26;
    },
  };
  apparatus.validators = [
    () => validateFillLevel(apparatus, apparatus.state.fillHeight),
  ];

  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  setSolidLevel(fillRatio);
  return apparatus;
}
