import { clamp, getAnchorWorld, getApparatusId, validateVisibility } from '../core.js';
import { resolveInteractionId, toParentSpace } from './shared.js';

export function createHeatInteraction({
  vessel,
  burner,
  effect = {},
  options = {},
}) {
  const burnerAnchor = burner?.anchors?.flameOrigin || burner?.anchors?.heatZone;
  const vesselAnchor = vessel?.anchors?.heatZone || vessel?.anchors?.steamOrigin || vessel?.anchors?.effectOrigin;
  const id = resolveInteractionId('heat', burner, vessel);
  const flameMesh = effect.flameMesh || null;
  const glowMesh = effect.glowMesh || null;
  const maxOpacity = options.maxOpacity ?? 0.86;

  const state = {
    intensity: 0,
  };

  function setVisual(mesh, intensity, scaleBoost) {
    if (!mesh) {
      return;
    }
    mesh.visible = intensity > 0.02;
    if (!mesh.visible) {
      return;
    }
    mesh.scale.setScalar(1 + intensity * scaleBoost);
    if (mesh.material) {
      mesh.material.opacity = Math.min(maxOpacity, intensity * maxOpacity);
    }
  }

  return {
    id,
    kind: 'heat',
    state,
    setIntensity(value) {
      const intensity = clamp(value, 0, 1);
      state.intensity = intensity;
      if (burnerAnchor && flameMesh) {
        flameMesh.position.copy(toParentSpace(flameMesh, getAnchorWorld(burnerAnchor)));
      }
      if (vesselAnchor && glowMesh) {
        glowMesh.position.copy(toParentSpace(glowMesh, getAnchorWorld(vesselAnchor)));
      }
      setVisual(flameMesh, intensity, 0.2);
      setVisual(glowMesh, intensity, 0.12);
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
      const points = [];
      if (burnerAnchor) {
        points.push({
          label: `${id}:burner`,
          interactionId: id,
          apparatusId: getApparatusId(burner),
          point: getAnchorWorld(burnerAnchor),
        });
      }
      if (vesselAnchor) {
        points.push({
          label: `${id}:vessel`,
          interactionId: id,
          apparatusId: getApparatusId(vessel),
          point: getAnchorWorld(vesselAnchor),
        });
      }
      return points;
    },
  };
}
