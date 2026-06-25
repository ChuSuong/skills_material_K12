import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { jitterGeometry } from '../../../skills/chem-courseware-base/effects/jitter-geometry.mjs';
import { popThenFade } from '../../../skills/chem-courseware-base/effects/particle-pop.mjs';
import { createFlowMaterial } from '../../../skills/chem-courseware-base/effects/liquid-shader.mjs';
import { makeBubbleTexture } from '../../../skills/chem-courseware-base/effects/organic-texture.mjs';

const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');
const pourBtn = document.getElementById('pourBtn');
const resetBtn = document.getElementById('resetBtn');
const stageCanvas = document.getElementById('stage');
const chartCanvases = [document.getElementById('chartA'), document.getElementById('chartB'), document.getElementById('chartC')];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a111c);
scene.fog = new THREE.Fog(0x0a111c, 16, 38);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6.4, 9.6);

const renderer = new THREE.WebGLRenderer({ canvas: stageCanvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.6, 0);
controls.minDistance = 7;
controls.maxDistance = 17;
controls.maxPolarAngle = 1.3;
controls.minPolarAngle = 0.35;

const ambient = new THREE.HemisphereLight(0xc7defc, 0x1a1208, 1.4);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(6, 11, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x6cb8ff, 12, 24, 2);
fillLight.position.set(-6, 5, 4);
scene.add(fillLight);

const room = new THREE.Mesh(
  new THREE.SphereGeometry(28, 48, 32),
  new THREE.MeshBasicMaterial({ color: 0x0d1727, side: THREE.BackSide })
);
scene.add(room);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(16, 64),
  new THREE.MeshStandardMaterial({ color: 0x16202f, roughness: 0.92, metalness: 0.05 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const bench = new THREE.Group();
scene.add(bench);

const benchTop = new THREE.Mesh(
  new THREE.BoxGeometry(11.5, 0.4, 5),
  new THREE.MeshStandardMaterial({ color: 0x5d4634, roughness: 0.82, metalness: 0.08 })
);
benchTop.position.y = 1.2;
benchTop.castShadow = true;
benchTop.receiveShadow = true;
bench.add(benchTop);

const legGeometry = new THREE.BoxGeometry(0.4, 2.4, 0.4);
for (const [x, z] of [[-5, -2], [5, -2], [-5, 2], [5, 2]]) {
  const leg = new THREE.Mesh(legGeometry, new THREE.MeshStandardMaterial({ color: 0x2d3647, roughness: 0.75, metalness: 0.35 }));
  leg.position.set(x, 0.2, z);
  leg.castShadow = true;
  leg.receiveShadow = true;
  bench.add(leg);
}

function makeLabelTexture(lines, width = 320, height = 130) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#154a68';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, width - 12, height - 12);
  ctx.fillStyle = '#123a52';
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? '700 24px sans-serif' : '500 17px sans-serif';
    ctx.fillText(line, width / 2, 40 + i * 26);
  });
  return new THREE.CanvasTexture(canvas);
}

// ---------- a) than cháy (charcoal) ----------
const charGroup = new THREE.Group();
charGroup.position.set(-3.3, 1.4, 0.3);
bench.add(charGroup);

const charPlate = new THREE.Mesh(
  new THREE.CylinderGeometry(0.95, 1.0, 0.12, 32),
  new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 })
);
charPlate.position.y = 0.06;
charPlate.receiveShadow = true;
charGroup.add(charPlate);

const charLumpMaterials = [];
const charLumps = [];
for (let i = 0; i < 9; i++) {
  const material = new THREE.MeshStandardMaterial({ color: 0x262422, roughness: 0.95, emissive: 0x000000, emissiveIntensity: 0 });
  const geometry = new THREE.DodecahedronGeometry(0.22 + Math.random() * 0.1, 0);
  jitterGeometry(geometry, 0.05);
  const lump = new THREE.Mesh(geometry, material);
  const angle = (i / 9) * Math.PI * 2;
  const r = 0.18 + Math.random() * 0.45;
  lump.position.set(Math.cos(angle) * r, 0.22 + Math.random() * 0.12, Math.sin(angle) * r);
  lump.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  lump.castShadow = true;
  lump.receiveShadow = true;
  charGroup.add(lump);
  charLumpMaterials.push(material);
  charLumps.push(lump);
}

const charGlowLight = new THREE.PointLight(0xff6a2e, 0, 4, 2);
charGlowLight.position.set(0, 0.6, 0);
charGroup.add(charGlowLight);

const sparkGeometry = new THREE.SphereGeometry(0.035, 8, 8);
const charSparks = [];
for (let i = 0; i < 14; i++) {
  const spark = new THREE.Mesh(sparkGeometry, new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0 }));
  charGroup.add(spark);
  charSparks.push({ mesh: spark, startElapsed: 0, duration: 0.3 + Math.random() * 0.4, active: false });
}

const charLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), new THREE.MeshStandardMaterial({ map: makeLabelTexture(['a) Than cháy', 'Phản ứng nhanh']), roughness: 0.8 }));
charLabel.position.set(0, 2.0, 0);
charGroup.add(charLabel);

// ---------- b) sắt bị gỉ (rusting iron) ----------
const ironGroup = new THREE.Group();
ironGroup.position.set(0, 1.4, 0.3);
bench.add(ironGroup);

const ironStandBase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.55, 0.12, 32),
  new THREE.MeshStandardMaterial({ color: 0x3d4756, roughness: 0.6, metalness: 0.4 })
);
ironStandBase.position.y = 0.06;
ironStandBase.receiveShadow = true;
ironGroup.add(ironStandBase);

const ironMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.55, metalness: 0.25 });
const ironBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.5, 0.22), ironMaterial);
ironBar.position.y = 0.85;
ironBar.castShadow = true;
ironBar.receiveShadow = true;
ironGroup.add(ironBar);

const rustCanvas = document.createElement('canvas');
rustCanvas.width = 128;
rustCanvas.height = 256;
const rustCtx = rustCanvas.getContext('2d');
const rustTexture = new THREE.CanvasTexture(rustCanvas);
ironMaterial.map = rustTexture;
rustCtx.fillStyle = '#9aa3ad';
rustCtx.fillRect(0, 0, 128, 256);
rustTexture.needsUpdate = true;
let rustSpotsDrawn = 0;

const ironLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), new THREE.MeshStandardMaterial({ map: makeLabelTexture(['b) Sắt bị gỉ', 'Phản ứng chậm']), roughness: 0.8 }));
ironLabel.position.set(0, 2.0, 0);
ironGroup.add(ironLabel);

// ---------- c) tinh bột lên men rượu ----------
const bowlGroup = new THREE.Group();
bowlGroup.position.set(3.3, 1.4, 0.3);
bench.add(bowlGroup);

const bowlOuter = new THREE.Mesh(
  new THREE.SphereGeometry(0.85, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2.1),
  new THREE.MeshPhysicalMaterial({ color: 0xeaf4ff, transparent: true, opacity: 0.4, roughness: 0.1, transmission: 0.7, ior: 1.4, side: THREE.DoubleSide })
);
bowlOuter.rotation.x = Math.PI;
bowlOuter.position.y = 0.5;
bowlOuter.castShadow = true;
bowlGroup.add(bowlOuter);

const riceMaterialBase = new THREE.MeshStandardMaterial({ color: 0xf3ecd6, roughness: 0.85 });
const riceGrains = [];
for (let i = 0; i < 16; i++) {
  const mat = riceMaterialBase.clone();
  const grain = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat);
  grain.scale.set(1, 0.7, 1);
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.55;
  grain.position.set(Math.cos(angle) * r, 0.18 + Math.random() * 0.12, Math.sin(angle) * r);
  grain.castShadow = true;
  bowlGroup.add(grain);
  riceGrains.push({ mesh: grain, material: mat });
}

const liquidMaterial = createFlowMaterial({ color: 0xf3ecd6, glow: 0xffce6b });
liquidMaterial.uniforms.uOpacity.value = 0;
const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.5, 0.3, 32), liquidMaterial);
liquid.position.y = 0.12;
bowlGroup.add(liquid);

const bubbleTexture = makeBubbleTexture(THREE);
const bowlBubbleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
const bowlBubbles = [];
for (let i = 0; i < 14; i++) {
  const bubble = new THREE.Mesh(bowlBubbleGeometry, new THREE.MeshBasicMaterial({ map: bubbleTexture, transparent: true, opacity: 0.6 }));
  bubble.visible = false;
  bowlGroup.add(bubble);
  bowlBubbles.push({ mesh: bubble, phase: Math.random() * Math.PI * 2, radius: 0.1 + Math.random() * 0.4 });
}

const bowlLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.62), new THREE.MeshStandardMaterial({ map: makeLabelTexture(['c) Lên men rượu', 'Phản ứng chậm']), roughness: 0.8 }));
bowlLabel.position.set(0, 2.0, 0);
bowlGroup.add(bowlLabel);

// ---------- specimen config ----------
const FRESH_RICE = new THREE.Color(0xf3ecd6);
const FERMENTED_RICE = new THREE.Color(0xb8893a);
const IRON_COLOR = new THREE.Color(0x9aa3ad);
const RUST_COLOR = new THREE.Color(0xc2511f);

// rate is expressed as "progress per second of wall-clock time since the
// specimen started" (not per animation frame) so the simulation stays
// correct regardless of the device's actual frame rate.
const specimens = [
  {
    key: 'a',
    rate: 0.5,
    hitTargets: charLumps,
    started: false,
    startElapsed: 0,
    progress: 0,
    chart: chartCanvases[0],
    nameStart: 'Đang đốt than — phản ứng cháy diễn ra rất nhanh.',
  },
  {
    key: 'b',
    rate: 0.0225,
    hitTargets: [ironBar],
    started: false,
    startElapsed: 0,
    progress: 0,
    chart: chartCanvases[1],
    nameStart: 'Sắt đang bị oxi hoá — phản ứng gỉ sắt diễn ra rất chậm.',
  },
  {
    key: 'c',
    rate: 0.0425,
    hitTargets: riceGrains.map((g) => g.mesh).concat([bowlOuter]),
    started: false,
    startElapsed: 0,
    progress: 0,
    chart: chartCanvases[2],
    nameStart: 'Tinh bột đang lên men rượu — sủi bọt nhẹ, diễn ra chậm.',
  }
];

function setStatus(main, sub) {
  statusText.textContent = main;
  statusSub.textContent = sub;
}

function startSpecimen(spec) {
  if (spec.started) return;
  spec.started = true;
  spec.startElapsed = currentElapsed;
  setStatus(spec.nameStart, 'Theo dõi đồ thị bên phải: đường đỏ (chất đầu) đi xuống, đường xanh (chất sản phẩm) đi lên. Đường nào dốc hơn thì phản ứng đó nhanh hơn.');
}

function resetAll() {
  for (const spec of specimens) {
    spec.started = false;
    spec.progress = 0;
  }
  for (const mat of charLumpMaterials) {
    mat.color.set(0x262422);
    mat.emissive.set(0x000000);
    mat.emissiveIntensity = 0;
  }
  charGlowLight.intensity = 0;
  for (const spark of charSparks) {
    spark.active = false;
    spark.startElapsed = 0;
    spark.mesh.material.opacity = 0;
  }

  ironMaterial.color.set(0x9aa3ad);
  rustCtx.fillStyle = '#9aa3ad';
  rustCtx.fillRect(0, 0, 128, 256);
  rustTexture.needsUpdate = true;
  rustSpotsDrawn = 0;

  for (const grain of riceGrains) grain.material.color.copy(FRESH_RICE);
  liquidMaterial.uniforms.uOpacity.value = 0;
  for (const bubble of bowlBubbles) bubble.mesh.visible = false;

  setStatus('Sẵn sàng. Hãy bấm vào một vật mẫu để bắt đầu phản ứng.', 'Orbit: kéo nền để xoay góc nhìn. Bấm trực tiếp vào than, sắt hoặc bát cơm rượu.');
  drawAllCharts();
}

function drawChart(canvas, history) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  if (history.length < 2) return;

  ctx.strokeStyle = '#ff6b5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = (1 - p.reactant) * (h - 6) + 3;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.strokeStyle = '#67d8ff';
  ctx.beginPath();
  history.forEach((p, i) => {
    const x = (i / (history.length - 1)) * w;
    const y = (1 - p.product) * (h - 6) + 3;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawAllCharts() {
  specimens.forEach((spec) => drawChart(spec.chart, spec.history || []));
}

for (const spec of specimens) spec.history = [];

const clock = new THREE.Clock();
let currentElapsed = 0;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pickSpecimen(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  for (const spec of specimens) {
    if (raycaster.intersectObjects(spec.hitTargets, false).length > 0) return spec;
  }
  return null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  const spec = pickSpecimen(event);
  if (spec) startSpecimen(spec);
});

pourBtn.addEventListener('click', () => {
  for (const spec of specimens) startSpecimen(spec);
  setStatus('Cả 3 phản ứng đang diễn ra cùng lúc.', 'So sánh độ dốc 3 đồ thị: than cháy dốc nhất (nhanh nhất), gỉ sắt gần như nằm ngang (chậm nhất).');
});

resetBtn.addEventListener('click', resetAll);

function updateCharcoal(dt) {
  const spec = specimens[0];
  if (!spec.started) return;
  spec.progress = Math.min(1, (currentElapsed - spec.startElapsed) * spec.rate);
  const p = spec.progress;
  for (const mat of charLumpMaterials) {
    mat.color.lerpColors(new THREE.Color(0x262422), new THREE.Color(0xff5a1f), p);
    mat.emissive.setRGB(p * 1.0, p * 0.35, 0.02);
    mat.emissiveIntensity = p * 1.4;
  }
  charGlowLight.intensity = p * 3.5;

  for (const spark of charSparks) {
    if (!spark.active) {
      if (p > 0.15) {
        spark.active = true;
        spark.startElapsed = currentElapsed;
        spark.duration = 0.3 + Math.random() * 0.4;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.5;
        spark.mesh.position.set(Math.cos(angle) * r, 0.3, Math.sin(angle) * r);
      } else {
        continue;
      }
    }
    const t = Math.min(1, (currentElapsed - spark.startElapsed) / spark.duration);
    const { scale, alpha } = popThenFade(t, 1);
    spark.mesh.scale.setScalar(Math.max(0.001, scale));
    spark.mesh.material.opacity = alpha * p;
    spark.mesh.position.y += dt * 0.6;
    if (t >= 1) spark.active = false;
  }
}

function updateIron(dt) {
  const spec = specimens[1];
  if (!spec.started) return;
  spec.progress = Math.min(1, (currentElapsed - spec.startElapsed) * spec.rate);
  const p = spec.progress;

  ironMaterial.color.lerpColors(IRON_COLOR, RUST_COLOR, p);

  const targetSpots = Math.floor(p * 60);
  if (targetSpots > rustSpotsDrawn) {
    rustCtx.fillStyle = 'rgba(150,75,30,0.85)';
    for (let i = rustSpotsDrawn; i < targetSpots; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 256;
      const r = 4 + Math.random() * 10;
      rustCtx.beginPath();
      rustCtx.arc(x, y, r, 0, Math.PI * 2);
      rustCtx.fill();
    }
    rustSpotsDrawn = targetSpots;
    rustTexture.needsUpdate = true;
  }
}

function updateRice(dt, elapsed) {
  const spec = specimens[2];
  if (!spec.started) return;
  spec.progress = Math.min(1, (currentElapsed - spec.startElapsed) * spec.rate);
  const p = spec.progress;
  for (const grain of riceGrains) {
    grain.material.color.lerpColors(FRESH_RICE, FERMENTED_RICE, p);
  }
  liquidMaterial.uniforms.uOpacity.value = p * 0.85;
  liquidMaterial.uniforms.uTime.value = elapsed;

  const bubbleChance = p > 0.05 && p < 0.97 ? dt * (0.6 + p * 1.2) : 0;
  for (const bubble of bowlBubbles) {
    if (!bubble.mesh.visible && Math.random() < bubbleChance) {
      bubble.mesh.visible = true;
      bubble.mesh.position.set(Math.cos(bubble.phase) * bubble.radius * 0.4, 0.15, Math.sin(bubble.phase) * bubble.radius * 0.4);
    }
    if (bubble.mesh.visible) {
      bubble.mesh.position.y += dt * 0.3;
      if (bubble.mesh.position.y > 0.55) bubble.mesh.visible = false;
    }
  }
}

function recordHistory() {
  for (const spec of specimens) {
    if (!spec.history) spec.history = [];
    const reactant = spec.started ? 1 - spec.progress : 1;
    const product = spec.started ? spec.progress : 0;
    spec.history.push({ reactant, product });
    if (spec.history.length > 90) spec.history.shift();
  }
  drawAllCharts();
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.getElapsedTime();
  currentElapsed = elapsed;
  controls.update();
  updateCharcoal(dt);
  updateIron(dt);
  updateRice(dt, elapsed);
  recordHistory();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

resetAll();
animate();
