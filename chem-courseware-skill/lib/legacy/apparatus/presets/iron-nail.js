import { composeApparatus } from '../../../apparatus/core.js';
import {
  THREE,
  addToParent,
  applyTransform,
  clamp,
  cloneMaterial,
  makeAnchor,
  attachFixedPlaneLabel,
  attachLabelController,
} from '../../../apparatus/presets/shared.js';

function createNailPatinaTexture({
  width = 256,
  height = 1024,
  base = '#b66a3c',
  dark = '#5d3116',
  highlight = '#d69463',
  alphaBias = 0.52,
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, base);
  baseGradient.addColorStop(0.26, highlight);
  baseGradient.addColorStop(0.55, base);
  baseGradient.addColorStop(1, dark);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  const edgeShade = ctx.createLinearGradient(0, 0, width, 0);
  edgeShade.addColorStop(0, 'rgba(52, 24, 10, 0.92)');
  edgeShade.addColorStop(0.18, 'rgba(138, 80, 43, 0.18)');
  edgeShade.addColorStop(0.5, 'rgba(255, 221, 190, 0.18)');
  edgeShade.addColorStop(0.82, 'rgba(126, 72, 39, 0.2)');
  edgeShade.addColorStop(1, 'rgba(49, 22, 8, 0.9)');
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 44; index += 1) {
    const y = (index / 43) * height;
    const bandHeight = height * (0.016 + Math.random() * 0.038);
    const alpha = 0.03 + Math.random() * 0.065;
    ctx.fillStyle = `rgba(255, 232, 210, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, y, width, bandHeight);
  }

  for (let index = 0; index < 170; index += 1) {
    const x = width * (0.1 + Math.random() * 0.8);
    const y = Math.random() * height;
    const rx = width * (0.03 + Math.random() * 0.12);
    const ry = height * (0.004 + Math.random() * 0.018);
    const alpha = 0.08 + Math.random() * 0.2;
    ctx.fillStyle = Math.random() > 0.45
      ? `rgba(93, 49, 22, ${alpha.toFixed(3)})`
      : `rgba(214, 148, 99, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let index = 0; index < 96; index += 1) {
    const x = width * (0.16 + Math.random() * 0.68);
    const y = Math.random() * height;
    const streakWidth = width * (0.008 + Math.random() * 0.024);
    const streakHeight = height * (0.06 + Math.random() * 0.2);
    const streak = ctx.createLinearGradient(x, y, x, y + streakHeight);
    streak.addColorStop(0, 'rgba(255, 214, 179, 0)');
    streak.addColorStop(0.3, `rgba(255, 214, 179, ${(0.08 + Math.random() * 0.15).toFixed(3)})`);
    streak.addColorStop(1, 'rgba(86, 43, 18, 0)');
    ctx.fillStyle = streak;
    ctx.fillRect(x, y, streakWidth, streakHeight);
  }

  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = width;
  alphaCanvas.height = height;
  const alphaCtx = alphaCanvas.getContext('2d');
  alphaCtx.fillStyle = '#000';
  alphaCtx.fillRect(0, 0, width, height);

  for (let index = 0; index < 220; index += 1) {
    const x = width * (0.08 + Math.random() * 0.84);
    const y = Math.random() * height;
    const rx = width * (0.02 + Math.random() * 0.11);
    const ry = height * (0.003 + Math.random() * 0.02);
    const intensity = alphaBias + Math.random() * (1 - alphaBias);
    alphaCtx.fillStyle = `rgba(255, 255, 255, ${intensity.toFixed(3)})`;
    alphaCtx.beginPath();
    alphaCtx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    alphaCtx.fill();
  }

  for (let index = 0; index < 58; index += 1) {
    const y = Math.random() * height;
    const h = height * (0.012 + Math.random() * 0.02);
    const band = alphaCtx.createLinearGradient(0, y, width, y + h);
    band.addColorStop(0, 'rgba(255, 255, 255, 0)');
    band.addColorStop(0.12, `rgba(255, 255, 255, ${(0.5 + Math.random() * 0.24).toFixed(3)})`);
    band.addColorStop(0.5, `rgba(255, 255, 255, ${(0.14 + Math.random() * 0.18).toFixed(3)})`);
    band.addColorStop(0.88, `rgba(255, 255, 255, ${(0.46 + Math.random() * 0.26).toFixed(3)})`);
    band.addColorStop(1, 'rgba(255, 255, 255, 0)');
    alphaCtx.fillStyle = band;
    alphaCtx.fillRect(0, y, width, h);
  }

  const colorTexture = new THREE.CanvasTexture(canvas);
  colorTexture.wrapS = THREE.ClampToEdgeWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.repeat.set(1, 1);
  colorTexture.needsUpdate = true;

  const alphaTexture = new THREE.CanvasTexture(alphaCanvas);
  alphaTexture.wrapS = THREE.ClampToEdgeWrapping;
  alphaTexture.wrapT = THREE.RepeatWrapping;
  alphaTexture.repeat.set(1, 1);
  alphaTexture.needsUpdate = true;

  return { colorTexture, alphaTexture };
}

export function createIronNailApparatus({
  parent,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 1.65,
  radius = 0.055,
  headRadius = 0.16,
  headThickness = 0.07,
  tipLength = 0.24,
  materials = {},
  name = 'iron-nail',
} = {}) {
  const group = new THREE.Group();
  group.name = name;
  applyTransform(group, position, rotation);
  addToParent(parent, group);

  const { colorTexture: patinaColorMap, alphaTexture: patinaAlphaMap } = createNailPatinaTexture();

  const steelMaterial = cloneMaterial(
    materials.steel,
    new THREE.MeshStandardMaterial({ color: 0xa8b0ba, roughness: 0.34, metalness: 0.86 })
  );
  const copperMaterial = cloneMaterial(
    materials.copperCoat,
    new THREE.MeshStandardMaterial({
      color: 0xb96838,
      roughness: 0.7,
      metalness: 0.24,
      emissive: 0x3a190b,
      emissiveIntensity: 0.08,
      map: patinaColorMap,
      alphaMap: patinaAlphaMap,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );

  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(headRadius, headRadius, headThickness, 28),
    steelMaterial
  );
  head.rotation.z = Math.PI / 2;
  head.position.x = -length * 0.5;
  head.castShadow = true;
  group.add(head);

  const headCoat = new THREE.Mesh(
    new THREE.CylinderGeometry(headRadius * 1.03, headRadius * 1.03, headThickness * 1.02, 28),
    copperMaterial
  );
  headCoat.rotation.z = Math.PI / 2;
  headCoat.position.copy(head.position);
  group.add(headCoat);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length - tipLength, 18),
    steelMaterial
  );
  body.rotation.z = Math.PI / 2;
  body.position.x = -tipLength * 0.5 + 0.02;
  body.castShadow = true;
  group.add(body);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(radius, tipLength, 18),
    steelMaterial
  );
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = length * 0.5 - tipLength * 0.5;
  tip.castShadow = true;
  group.add(tip);

  const tipCoat = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 1.07, tipLength * 1.02, 18),
    copperMaterial
  );
  tipCoat.rotation.z = -Math.PI / 2;
  tipCoat.position.copy(tip.position);
  group.add(tipCoat);

  const copperCoat = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 1.14, radius * 1.14, length - tipLength * 1.2, 18),
    copperMaterial
  );
  copperCoat.rotation.z = Math.PI / 2;
  copperCoat.position.copy(body.position);
  group.add(copperCoat);

  const anchors = {
    labelAnchor: makeAnchor(group, 0, radius * 7.8, 0, `${name}:labelAnchor`),
    gripAnchor: makeAnchor(group, -length * 0.25, 0, 0, `${name}:gripAnchor`),
    tipAnchor: makeAnchor(group, length * 0.5, 0, 0, `${name}:tipAnchor`),
    sampleZone: makeAnchor(group, length * 0.22, 0, 0, `${name}:sampleZone`),
    interactionZone: makeAnchor(group, length * 0.28, 0, 0, `${name}:interactionZone`),
    effectOrigin: makeAnchor(group, length * 0.2, 0, 0, `${name}:effectOrigin`),
  };

  const state = {
    copperCoating: 0,
  };

  const apparatus = composeApparatus({
    kind: 'iron-nail',
    family: 'solid-metal-sample',
    group,
    meshes: { head, headCoat, body, tip, tipCoat, copperCoat },
    anchors,
    constraints: {
      length,
      radius,
      contactRadius: radius * 2.2,
      effectBounds: {
        min: new THREE.Vector3(-length * 0.55, -radius * 2.5, -radius * 2.5),
        max: new THREE.Vector3(length * 0.55, radius * 2.5, radius * 2.5),
      },
    },
    state,
  });

  const { labelPlane } = attachFixedPlaneLabel({
    group,
    labelAnchor: anchors.labelAnchor,
    planeGeometry: new THREE.PlaneGeometry(1.42, 0.58),
    accent: '#bd7543',
    role: 'floating-badge',
  });
  attachLabelController(apparatus, labelPlane, { defaultAccent: '#bd7543' });

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setCopperCoating(value) {
      const coating = clamp(value, 0, 1);
      state.copperCoating = coating;
      const coatOpacity = coating * 0.9;
      copperCoat.material.opacity = coatOpacity;
      copperCoat.material.roughness = 0.88 - coating * 0.1;
      copperCoat.material.metalness = 0.2 + coating * 0.08;
      copperCoat.material.emissiveIntensity = 0.03 + coating * 0.08;
      body.material.color.lerpColors(new THREE.Color(0xa8b0ba), new THREE.Color(0x8a7c70), coating * 0.35);
      head.material.color.lerpColors(new THREE.Color(0xa8b0ba), new THREE.Color(0x86786e), coating * 0.22);
      tip.material.color.lerpColors(new THREE.Color(0xa8b0ba), new THREE.Color(0x7e6d61), coating * 0.28);
    },
  };

  apparatus.controllers.setCopperCoating(0);
  return apparatus;
}
