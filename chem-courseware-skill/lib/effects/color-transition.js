import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

export function createColorTransition({
  material,
  from,
  to,
  property = 'color',
} = {}) {
  const fromColor = new THREE.Color(from ?? material?.[property] ?? 0xffffff);
  const toColor = new THREE.Color(to ?? fromColor);
  const scratch = new THREE.Color();

  function setProgress(progress = 0) {
    const value = Math.max(0, Math.min(1, progress));
    if (!material?.[property]?.copy) {
      return value;
    }
    scratch.copy(fromColor).lerp(toColor, value);
    material[property].copy(scratch);
    return value;
  }

  function reset() {
    setProgress(0);
  }

  return { setProgress, reset, fromColor, toColor };
}
