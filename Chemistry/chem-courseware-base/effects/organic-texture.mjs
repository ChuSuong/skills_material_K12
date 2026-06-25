export const DEFAULT_CLOUD_BLOBS = [
  { x: 0.5, y: 0.5, r: 0.46, a: 0.55 },
  { x: 0.34, y: 0.42, r: 0.3, a: 0.5 },
  { x: 0.64, y: 0.4, r: 0.28, a: 0.46 },
  { x: 0.46, y: 0.62, r: 0.26, a: 0.42 },
  { x: 0.6, y: 0.6, r: 0.22, a: 0.4 }
];

export function drawCloudBlobs(ctx, size, blobs = DEFAULT_CLOUD_BLOBS) {
  for (const b of blobs) {
    const gradient = ctx.createRadialGradient(size * b.x, size * b.y, size * 0.02, size * b.x, size * b.y, size * b.r);
    gradient.addColorStop(0, `rgba(255,255,255,${b.a})`);
    gradient.addColorStop(0.4, `rgba(220,230,235,${b.a * 0.55})`);
    gradient.addColorStop(1, 'rgba(220,230,235,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
}

export function drawBubbleGlow(ctx, size) {
  const gradient = ctx.createRadialGradient(size * 0.48, size * 0.42, size * 0.06, size * 0.5, size * 0.5, size * 0.48);
  gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.3, 'rgba(196,239,255,0.9)');
  gradient.addColorStop(0.55, 'rgba(127,205,255,0.48)');
  gradient.addColorStop(1, 'rgba(127,205,255,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

export function makeCloudTexture(THREE, size = 128, blobs = DEFAULT_CLOUD_BLOBS) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawCloudBlobs(ctx, size, blobs);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeBubbleTexture(THREE, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawBubbleGlow(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
