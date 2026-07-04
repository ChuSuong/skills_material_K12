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

function cylinderProfile(radius, height) {
  return [
    [0.0001, 0],
    [radius * 0.94, 0.005],
    [radius, height * 0.02],
    [radius, height * 0.98],
    [radius * 1.05, height * 0.995],
    [radius * 1.05, height],
  ];
}

function makeGraduationLadder({ major = 10 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(35, 60, 90, 0.85)';
  ctx.fillStyle = 'rgba(35, 60, 90, 0.9)';
  ctx.font = '600 22px sans-serif';
  ctx.textBaseline = 'middle';
  const startY = canvas.height * 0.05;
  const endY = canvas.height * 0.94;
  const stepY = (endY - startY) / (major * 5);
  for (let i = 0; i <= major * 5; i += 1) {
    const y = startY + i * stepY;
    const isMajor = i % 5 === 0;
    ctx.lineWidth = isMajor ? 3 : 1.4;
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(isMajor ? 96 : 68, y);
    ctx.stroke();
    if (isMajor) {
      ctx.fillText(`${(major * 5 - i) * 2}`, 108, y);
    }
  }
  ctx.font = '500 20px sans-serif';
  ctx.fillText('mL', 108, endY + 20);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createClassicGraduatedCylinderApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.34,
  height = 3.2,
  fillRatio = 0.5,
  materials = {},
  appearance = clearWater(),
  name = 'classic-graduated-cylinder',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const glassMaterial = createClassicGlassMaterial(materials);
  const rimMaterial = createClassicGlassRimMaterial(materials);
  const liquidMaterial = createClassicLiquidMaterial(materials, appearance?.color ?? 0xe8f8ff);
  const surfaceMaterial = createClassicLiquidSurfaceMaterial(materials, appearance?.surfaceColor ?? 0xf8fdff);

  const footRadius = radius * 2.0;
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(footRadius * 0.98, footRadius, 0.08, 6),
    cloneMaterial(materials.foot, glassMaterial),
  );
  foot.position.y = 0.04;
  foot.castShadow = true;
  foot.receiveShadow = true;
  group.add(foot);

  const body = new THREE.Mesh(
    latheFromProfile(cylinderProfile(radius, height), 60).translate(0, 0.08, 0),
    cloneMaterial(materials.body, glassMaterial),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.05, radius * 0.06, 10, 32),
    rimMaterial,
  );
  rim.position.y = height + 0.08;
  rim.rotation.x = Math.PI * 0.5;
  group.add(rim);

  const spout = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.18, radius * 0.05, 8, 16, Math.PI),
    cloneMaterial(materials.spout, glassMaterial),
  );
  spout.position.set(radius, height + 0.05, 0);
  spout.rotation.set(Math.PI * 0.5, 0, Math.PI * 0.5);
  group.add(spout);

  const innerRadius = radius * 0.94;
  const innerHeight = height * 0.96;

  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(innerRadius, innerRadius, innerHeight, 40),
    liquidMaterial,
  );
  group.add(liquid);

  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(innerRadius, 40),
    surfaceMaterial,
  );
  liquidSurface.rotation.x = -Math.PI * 0.5;
  group.add(liquidSurface);

  const ladderMat = new THREE.MeshBasicMaterial({
    map: makeGraduationLadder({ major: 10 }),
    transparent: true,
    depthWrite: false,
  });
  const ladder = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 1.4, height * 0.9),
    ladderMat,
  );
  ladder.position.set(0, height * 0.5 + 0.08, radius * 1.005);
  group.add(ladder);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, height * 0.6, radius + 0.12, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, 0, height * 0.7, 0, `${name}:gripAnchor`),
    interactionZone: makeAnchor(group, 0, height - 0.1, 0, `${name}:interactionZone`),
    mouth: makeAnchor(group, 0, height + 0.08, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, radius * 0.9, height + 0.02, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, height * 0.5, 0, `${name}:effectOrigin`),
    readOffset: makeAnchor(group, 0, height * 0.5, radius + 0.24, `${name}:readOffset`),
  };

  const state = { fillRatio: 0, fillHeight: 0 };
  const liquidProfile = {
    baseY: 0.08,
    height: innerHeight,
    radiusBottom: innerRadius,
    radiusTop: innerRadius,
    safeFillHeight: innerHeight * 0.92,
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
    group,
    name,
    kind: 'classic-graduated-cylinder',
    family: 'showcase-vessel',
    meshes: { foot, body, rim, spout, liquid, liquidSurface, ladder },
    anchors,
    constraints: {
      innerRadius,
      innerHeight,
      safeFillHeight: innerHeight * 0.92,
      safePourRadius: innerRadius * 0.6,
      safePourClearance: 0.08,
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
    planeGeometry: new THREE.PlaneGeometry(0.92, 0.34),
    role: 'vessel-body-label',
  });
  attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController);
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#84ddff' });
  return apparatus;
}
