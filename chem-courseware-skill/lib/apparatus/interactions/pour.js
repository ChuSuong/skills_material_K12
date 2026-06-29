import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {
  clamp,
  getAnchorWorld,
  getApparatusId,
  validatePourAlignment,
  validateVisibility,
} from '../core.js';
import { WORLD_UP, resolveInteractionId, resolveTargetAnchor, toParentSpace } from './shared.js';

export function createPourInteraction({
  source,
  target,
  streamMesh,
  options = {},
}) {
  const sourceAnchor = source?.anchors?.nozzle;
  const targetAnchor = resolveTargetAnchor(target);
  const visibilityMargin = options.visibilityMargin ?? 0.04;
  const streamVisibleFrom = options.streamVisibleFrom ?? 0.08;
  const streamVisibleUntil = options.streamVisibleUntil ?? 0.96;
  const streamRadiusScale = options.streamRadiusScale ?? [1, 1];
  const sourceFillRange = options.sourceFillRange ?? null;
  const streamOpacityRange = options.streamOpacityRange ?? [0.22, 0.68];
  const id = resolveInteractionId('pour', source, target);

  const state = {
    progress: 0,
  };

  function updateStream(progress, runtime = {}) {
    if (!streamMesh || !sourceAnchor || !targetAnchor) {
      return;
    }

    const visible = typeof options.getStreamVisible === 'function'
      ? !!options.getStreamVisible(progress, runtime)
      : progress > streamVisibleFrom && progress < streamVisibleUntil;
    streamMesh.visible = visible;
    if (!visible) {
      return;
    }

    const origin = toParentSpace(streamMesh, getAnchorWorld(sourceAnchor));
    const targetPoint = toParentSpace(streamMesh, getAnchorWorld(targetAnchor));
    const direction = targetPoint.clone().sub(origin);
    const length = Math.max(direction.length(), 0.1);
    const mid = origin.clone().lerp(targetPoint, 0.5);
    streamMesh.position.copy(mid);
    streamMesh.scale.set(streamRadiusScale[0], length, streamRadiusScale[1]);
    streamMesh.quaternion.setFromUnitVectors(WORLD_UP, direction.clone().normalize());
    if (streamMesh.material) {
      streamMesh.material.opacity = THREE.MathUtils.lerp(
        streamOpacityRange[0],
        streamOpacityRange[1],
        progress
      );
    }
  }

  function updateSource(progress, runtime = {}) {
    if (source?.controllers?.setPourPose) {
      source.controllers.setPourPose(progress);
    }
    if ((sourceFillRange || typeof options.getSourceFill === 'function') && source?.controllers?.setLiquidLevel) {
      const nextFill = typeof options.getSourceFill === 'function'
        ? options.getSourceFill(progress, runtime)
        : THREE.MathUtils.lerp(sourceFillRange[0], sourceFillRange[1], progress);
      source.controllers.setLiquidLevel(nextFill);
    }
  }

  return {
    id,
    kind: 'pour',
    source,
    target,
    state,
    setProgress(progress, runtime = {}) {
      const value = clamp(progress, 0, 1);
      state.progress = value;
      updateSource(value, runtime);
      updateStream(value, runtime);
    },
    reset() {
      state.progress = 0;
      updateSource(0);
      if (streamMesh) {
        streamMesh.visible = false;
      }
    },
    validate(camera) {
      const reports = [validatePourAlignment(source, target)];
      if (camera && sourceAnchor && targetAnchor) {
        reports.push(
          validateVisibility(camera, this.getVisibilityPoints(), { margin: visibilityMargin })
        );
      }
      return reports.map((report) => ({
        ...report,
        interactionId: id,
      }));
    },
    getVisibilityPoints() {
      if (!sourceAnchor || !targetAnchor) {
        return [];
      }
      return [
        {
          label: `${id}:source`,
          interactionId: id,
          apparatusId: getApparatusId(source),
          point: getAnchorWorld(sourceAnchor),
        },
        {
          label: `${id}:target`,
          interactionId: id,
          apparatusId: getApparatusId(target),
          point: getAnchorWorld(targetAnchor),
        },
      ];
    },
  };
}
