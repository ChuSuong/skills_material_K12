import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { clamp } from './anchors.js';

export function computeCylinderLiquidMetrics(profile, fillRatio, topOffset = 0) {
  const ratio = clamp(fillRatio, 0, 1);
  const boundedHeight = profile.height * ratio;
  const usableHeight = Math.min(boundedHeight, profile.safeFillHeight ?? profile.height);
  const normalizedHeight = profile.height <= 0 ? 0 : usableHeight / profile.height;
  const surfaceRadius = THREE.MathUtils.lerp(
    profile.radiusBottom,
    profile.radiusTop,
    normalizedHeight
  );

  return {
    fillRatio: normalizedHeight,
    fillHeight: usableHeight,
    solutionCenterY: profile.baseY + usableHeight * 0.5,
    topSurfaceY: profile.baseY + usableHeight - topOffset,
    surfaceRadius,
  };
}

export function setCylinderLiquidLevel(solutionMesh, surfaceMesh, profile, fillRatio, topOffset = 0) {
  const metrics = computeCylinderLiquidMetrics(profile, fillRatio, topOffset);
  solutionMesh.scale.set(1, Math.max(metrics.fillRatio, 0.0001), 1);
  solutionMesh.position.y = metrics.solutionCenterY;

  if (surfaceMesh) {
    const referenceRadius = profile.surfaceReferenceRadius || profile.radiusTop || 1;
    surfaceMesh.scale.setScalar(metrics.surfaceRadius / referenceRadius);
    surfaceMesh.position.y = metrics.topSurfaceY;
  }

  return metrics;
}

export function createCylinderLiquidController({
  solutionMesh,
  surfaceMesh,
  profile,
  topOffset = 0,
  state,
}) {
  return {
    setLiquidLevel(fillRatio, options = {}) {
      const appliedTopOffset = options.topOffset ?? topOffset;
      const metrics = setCylinderLiquidLevel(
        solutionMesh,
        surfaceMesh,
        profile,
        fillRatio,
        appliedTopOffset
      );
      if (state) {
        state.fillRatio = metrics.fillRatio;
        state.fillHeight = metrics.fillHeight;
        state.topSurfaceY = metrics.topSurfaceY;
      }
      return metrics;
    },
  };
}
