import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { clamp, makeAnchor, validateFillLevel } from '../core.js';
import { clearWater } from '../chemicals.js';

export { THREE, clamp, makeAnchor, validateFillLevel };

export function cloneMaterial(material, fallback) {
  if (!material) {
    return fallback.clone();
  }
  if (typeof material.clone === 'function') {
    return material.clone();
  }
  const clone = fallback.clone();
  if (typeof clone.setValues === 'function') {
    clone.setValues(material);
  } else {
    Object.assign(clone, material);
  }
  return clone;
}

export function applyTransform(group, position = [0, 0, 0], rotation = [0, 0, 0]) {
  group.position.set(position[0], position[1], position[2]);
  group.rotation.set(rotation[0], rotation[1], rotation[2]);
}

export function addToParent(parent, child) {
  if (parent) {
    parent.add(child);
  }
}

export function createDefaultGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xe8f7ff,
    transparent: true,
    opacity: 0.22,
    transmission: 0.94,
    roughness: 0.08,
    thickness: 0.08,
    depthWrite: false,
  });
}

export function buildLiquidMaterials(materials, appearance = clearWater()) {
  return {
    liquidMaterial: cloneMaterial(materials.liquid, appearance.createLiquidMaterial()),
    surfaceMaterial: cloneMaterial(materials.surface, appearance.createSurfaceMaterial()),
  };
}

export function attachCommonContainerAnchors({
  group,
  name,
  labelY,
  labelPosition = null,
  mouthY,
  pourTargetY,
  effectY,
  gripY = null,
  extra = {},
}) {
  const labelPoint = labelPosition ?? [0, labelY, 0];
  return {
    labelAnchor: makeAnchor(group, labelPoint[0], labelPoint[1], labelPoint[2], `${name}:labelAnchor`),
    mouth: makeAnchor(group, 0, mouthY, 0, `${name}:mouth`),
    pourTarget: makeAnchor(group, 0, pourTargetY, 0, `${name}:pourTarget`),
    effectOrigin: makeAnchor(group, 0, effectY, 0, `${name}:effectOrigin`),
    ...(gripY == null ? {} : { gripAnchor: makeAnchor(group, 0, gripY, 0, `${name}:gripAnchor`) }),
    ...extra,
  };
}

export function createLabelTexture({ title = '', subtitle = '', note = '', accent = '#84ddff' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const padX = canvas.width / 2;

  // Title (single line)
  ctx.fillStyle = '#163246';
  ctx.font = '700 52px sans-serif';

  const maxTitleWidth = canvas.width - 120;
  let t = title || '';
  if (t.length > 1) {
    const ellipsis = '…';
    while (t && ctx.measureText(t).width > maxTitleWidth && t.length > 1) {
      t = t.slice(0, -1);
    }
    if (title && ctx.measureText(t).width > maxTitleWidth) {
      t = `${t.slice(0, -1)}${ellipsis}`;
    }
  }

  ctx.fillText(t, padX, 96);

  // Subtitle
  ctx.fillStyle = '#0f4b6f';
  ctx.font = '500 30px sans-serif';
  ctx.fillText(subtitle || '', padX, 168);

  // Note (1 extra line, allow empty)
  ctx.fillStyle = '#4b5968';
  ctx.font = '500 24px sans-serif';
  const noteText = note ? note : '';
  ctx.fillText(noteText, padX, 232);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function attachFixedPlaneLabel({
  group,
  labelAnchor,
  planeGeometry,
  accent = '#84ddff',
  role = 'floating-badge',
} = {}) {
  const labelPlane = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
    })
  );

  labelPlane.renderOrder = 10;
  labelPlane.frustumCulled = true;
  labelPlane.material.depthTest = false;
  labelPlane.name = `${group?.name || 'apparatus'}:labelPlane`;
  labelPlane.userData.labelRole = role;

  // Position plane at the anchor's local origin
  labelAnchor.add(labelPlane);

  return { labelPlane, accent };
}

export function attachLabelController(apparatus, labelPlane, { defaultAccent = '#84ddff' } = {}) {
  apparatus.meshes.labelPlane = labelPlane;
  labelPlane.visible = false;

  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setLabel({ title = '', subtitle = '', note = '', accent = defaultAccent } = {}) {
      const hasAnyText = Boolean(title || subtitle || note);
      labelPlane.visible = hasAnyText;
      if (!hasAnyText) {
        return;
      }
      const texture = createLabelTexture({ title, subtitle, note, accent });
      labelPlane.material.map = texture;
      labelPlane.material.opacity = 1;
      labelPlane.material.needsUpdate = true;
    },
    setLabelVisible(visible = true) {
      labelPlane.visible = Boolean(visible && labelPlane.material.map);
    },
  };
}

export function attachCommonLiquidControllers(apparatus, liquid, liquidSurface, liquidController) {
  apparatus.controllers = {
    ...(apparatus.controllers || {}),
    setLiquidLevel(nextFillRatio, options) {
      return liquidController.setLiquidLevel(nextFillRatio, options);
    },
    setLiquidOpacity(alpha) {
      const value = clamp(alpha, 0, 1);
      liquid.material.opacity = value;
      if (liquidSurface) {
        liquidSurface.material.opacity = clamp(value + 0.08, 0, 1);
      }
    },
  };
  apparatus.validators = [
    ...(apparatus.validators || []),
    () => validateFillLevel(apparatus, apparatus.state.fillHeight),
  ];
}
