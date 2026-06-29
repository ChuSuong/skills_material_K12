import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { createReactionFlow } from './reaction-flow.js';

function getDehydrationWorldPosition(target, out = new THREE.Vector3()) {
  if (typeof target?.getWorldPosition === 'function') {
    return target.getWorldPosition(out);
  }
  if (target?.isVector3) {
    return out.copy(target);
  }
  return out.set(0, 0, 0);
}

export function createDehydrationCarbonizationReaction({
  sugar,
  carbonMass,
  caramelLayer,
  effectOrigin,
  steamOrigin,
  bubbleField,
  steamField,
  sparkField,
  glowRing,
  duration = 8.5,
} = {}) {
  const sugarStartColor = new THREE.Color(0xf4e6bf);
  const carbonColor = new THREE.Color(0x382110);
  const bubbleCenter = new THREE.Vector3();
  const steamCenter = new THREE.Vector3();

  return createReactionFlow({
    id: 'dehydration-carbonization',
    duration,
    effects: [bubbleField, steamField, sparkField, glowRing].filter(Boolean),
    onUpdate({ state, dt, elapsed }) {
      const heat = Math.min(state.t / 3.5, 1);
      const growth = THREE.MathUtils.smootherstep(state.t, 0.4, duration);
      const pulse = Math.sin(elapsed * 18) * 0.04;

      if (sugar) {
        sugar.scale.y = 1 - growth * 0.92;
        sugar.position.y = -0.84 - growth * 0.26;
        if (sugar.material?.color) {
          sugar.material.color.copy(sugarStartColor).lerp(carbonColor, growth * 0.9);
        }
        if (sugar.material && 'emissiveIntensity' in sugar.material) {
          sugar.material.emissiveIntensity = 0.15 * heat;
        }
      }

      if (caramelLayer) {
        caramelLayer.visible = true;
        caramelLayer.material.opacity = 0.15 + heat * 0.35;
      }

      if (carbonMass) {
        carbonMass.scale.y = 0.1 + growth * 8.8 + pulse;
        carbonMass.scale.x = 1 + growth * 0.38;
        carbonMass.scale.z = 1 + growth * 0.34;
        carbonMass.position.y = -0.58 + carbonMass.scale.y * 0.18;
      }

      glowRing?.setIntensity?.(0.35 + heat * 0.65, elapsed);
      getDehydrationWorldPosition(effectOrigin, bubbleCenter).add(new THREE.Vector3(0, growth * 1.2, 0));
      getDehydrationWorldPosition(steamOrigin || effectOrigin, steamCenter).add(new THREE.Vector3(0, growth * 1.6, 0));
      bubbleField?.burst?.(bubbleCenter, heat, dt);
      steamField?.burst?.(steamCenter, heat, dt);
      sparkField?.burst?.(bubbleCenter, heat, dt);
      bubbleField?.update?.(dt, elapsed);
      steamField?.update?.(dt, elapsed);
      sparkField?.update?.(dt, elapsed);
    },
    onReset() {
      if (sugar) {
        sugar.scale.set(1, 1, 1);
        if (sugar.material?.color) {
          sugar.material.color.copy(sugarStartColor);
        }
      }
      if (carbonMass) {
        carbonMass.scale.setScalar(0.001);
      }
      if (caramelLayer) {
        caramelLayer.visible = false;
        caramelLayer.material.opacity = 0;
      }
    },
  });
}
