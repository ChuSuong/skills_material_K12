const defaultCameraPresetName = 'bench-3qtr';

export const cameraPresets = {
  'bench-3qtr': {
    position: [0, 6.8, 15.5],
    target: [0, 2.3, 0],
    fov: 45,
    near: 0.1,
    far: 120,
    minDistance: 9,
    maxDistance: 24,
    minPolarAngle: 0.4,
    maxPolarAngle: Math.PI / 2.05,
  },
  'lab-close': {
    position: [0, 4.3, 9.2],
    target: [0, 2.1, 0],
    fov: 42,
    near: 0.1,
    far: 120,
    minDistance: 6.4,
    maxDistance: 13,
    minPolarAngle: 0.7,
    maxPolarAngle: 1.46,
  },
  'wide-compare': {
    position: [0, 5.8, 13.5],
    target: [0, 2.2, 0],
    fov: 46,
    near: 0.1,
    far: 140,
    minDistance: 8.6,
    maxDistance: 18,
    minPolarAngle: 0.62,
    maxPolarAngle: 1.4,
  },
};

export function getCameraPreset(name = defaultCameraPresetName) {
  const preset = typeof name === 'string'
    ? (cameraPresets[name] || cameraPresets[defaultCameraPresetName])
    : { ...cameraPresets[defaultCameraPresetName], ...name };
  return {
    ...preset,
    position: [...preset.position],
    target: [...preset.target],
  };
}
