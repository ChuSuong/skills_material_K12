export function createMaterialProgress({
  material,
  opacityFrom = material?.opacity ?? 1,
  opacityTo = opacityFrom,
  emissiveIntensityFrom = material?.emissiveIntensity ?? 0,
  emissiveIntensityTo = emissiveIntensityFrom,
} = {}) {
  function setProgress(progress = 0) {
    const value = Math.max(0, Math.min(1, progress));
    if (material) {
      if ('opacity' in material) {
        material.opacity = opacityFrom + (opacityTo - opacityFrom) * value;
      }
      if ('emissiveIntensity' in material) {
        material.emissiveIntensity = emissiveIntensityFrom
          + (emissiveIntensityTo - emissiveIntensityFrom) * value;
      }
    }
    return value;
  }

  function reset() {
    setProgress(0);
  }

  return { setProgress, reset };
}
