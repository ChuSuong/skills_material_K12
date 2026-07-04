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

function beakerProfile(radius, height) {
  const rimLip = radius * 1.03;
  return [
    [0.0001, 0],
    [radius * 0.96, 0],
    [radius, height * 0.06],
    [radius, height * 0.9],
    [rimLip, height * 0.97],
    [rimLip, height],
  ];
}

function makeGraduationTexture({ marks = 5, label = 'mL' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(60, 90, 120, 0.7)';
  ctx.fillStyle = 'rgba(60, 90, 120, 0.85)';
  ctx.font = '600 26px sans-serif';
  ctx.textBaseline = 'middle';
  const startY = canvas.height * 0.18;
  const endY = canvas.height * 0.92;
  const step = (endY - startY) / marks;
  for (let i = 0; i <= marks; i += 1) {
    const y = startY + i * step;
    ctx.lineWidth = i % 2 === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(i % 2 === 0 ? 90 : 64, y);
    ctx.stroke();
    if (i % 2 === 0) {
      ctx.fillText(`${(marks - i) * 20}`, 100, y);
    }
  }
  ctx.font = '500 22px sans-serif';
  ctx.fillText(label, 100, endY + 26);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createClassicBeakerApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.9,
  height = 1.4,
  fillRatio = 0.4,
  materials = {},
  appearance = clearWater(),
  showGraduations = true,
  name = 'classic-beaker',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, appearance?.surfaceColor ?? 0xf8fdff);

  const body = new THREE.Mesh(
    latheFromProfile(beakerProfile(radius, height), 72),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.03, radius * 0.02, 12, 48),
    rimMaterial,
  );
  rim.position.y = height;
  rim.rotation.x = Math.PI * 0.5;
  group.add(rim);

  const spout = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.14, radius * 0.045, 10, 20, Math.PI),
    cloneMaterial(materials.spout, glassMaterial),
  );
  spout.position.set(radius, height - radius * 0.04, 0);
  spout.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.5);
  group.add(spout);

  const innerRadius = radius * 0.92;
  const innerHeight = height * 0.86;

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius * 0.98, innerRadius * 0.94, innerHeight, 48),
    liquidMaterial,
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius * 0.98, 48),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  group.add(liquidSurface);

  if (showGraduations) {
    const marksMat = new THREE.MeshBasicMaterial({
      map: makeGraduationTexture({ marks: 5 }),
      transparent: true,
      depthWrite: false,
    });
    const marks = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 0.6, height * 0.8),
      marksMat,
    );
    marks.position.set(0, height * 0.5, radius * 1.001);
    group.add(marks);
  }

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.68, radius + 0.14, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.72, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height - 0.1, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, radius * 0.9, height - radius * 0.02, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, height * 0.55, 0, `${name}:effectOrigin`),
    steamOrigin: makeAnchor(group, 0, height - 0.04, 0, `${name}:steamOrigin`),
    heatZone: makeAnchor(group, 0, 0.05, 0, `${name}:heatZone`),
  };

  const state = { fillRatio: 0, fillHeight: 0 };
  const liquidProfile = {
    baseY: 0.02,
    height: innerHeight,
    radiusBottom: innerRadius * 0.94,
    radiusTop: innerRadius * 0.98,
    safeFillHeight: innerHeight * 0.9,
    surfaceReferenceRadius: innerRadius * 0.98,
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
    kind: 'classic-beaker',
    family: 'showcase-vessel',
    meshes: { body, rim, spout, liquid, liquidSurface },
    anchors,
    constraints: {
      innerRadius,
      innerHeight,
      safeFillHeight: innerHeight * 0.9,
      safePourRadius: innerRadius * 0.4,
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
    planeGeometry: new THREE.PlaneGeometry(1.16, 0.42),
    role: 'vessel-body-label',
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
