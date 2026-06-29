import { clamp, getAnchorWorld, getApparatusId, validateVisibility } from '../core.js';
import { resolveInteractionId, toParentSpace } from './shared.js';

export function createSteamInteraction({
  vessel,
  effect = {},
  options = {},
}) {
  const steamAnchor = vessel?.anchors?.steamOrigin || vessel?.anchors?.effectOrigin;
  const effectMesh = effect.mesh || null;
  const id = resolveInteractionId('steam', vessel);
  const maxOpacity = options.maxOpacity ?? 0.24;

  const state = {
    intensity: 0,
  };

  return {
    id,
    kind: 'steam',
    state,
    setIntensity(value) {
      const intensity = clamp(value, 0, 1);
      state.intensity = intensity;
      if (!effectMesh || !steamAnchor) {
        return;
      }
      effectMesh.visible = intensity > 0.02;
      effectMesh.position.copy(toParentSpace(effectMesh, getAnchorWorld(steamAnchor)));
      effectMesh.scale.setScalar(1 + intensity * 0.22);
      if (effectMesh.material) {
        effectMesh.material.opacity = Math.min(maxOpacity, intensity * maxOpacity);
      }
    },
    reset() {
      this.setIntensity(0);
    },
    validate(camera) {
      const reports = [];
      if (camera) {
        reports.push(
          validateVisibility(camera, this.getVisibilityPoints(), {
            margin: options.visibilityMargin ?? 0.04,
          })
        );
      }
      return reports.map((report) => ({
        ...report,
        interactionId: id,
      }));
    },
    getVisibilityPoints() {
      if (!steamAnchor) {
        return [];
      }
      return [{
        label: `${id}:steam`,
        interactionId: id,
        apparatusId: getApparatusId(vessel),
        point: getAnchorWorld(steamAnchor),
      }];
    },
  };
}
