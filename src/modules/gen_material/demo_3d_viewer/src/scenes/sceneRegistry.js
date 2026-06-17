export const sceneLoaders = {
  museum: () => import('./data/museum.json'),
  solar: () => import('./data/solar.json'),
  ocean: () => import('./data/ocean.json'),
  forest: () => import('./data/forest.json'),
  egypt: () => import('./data/egypt.json'),
};

export const builtInSceneIds = new Set(Object.keys(sceneLoaders));

export const builtInSceneButtons = [
  { id: 'museum', label: 'Bảo tàng' },
  { id: 'solar', label: 'Hệ Mặt Trời' },
  { id: 'ocean', label: 'Đại Dương' },
  { id: 'forest', label: 'Rừng Hoàng Hôn' },
  { id: 'egypt', label: 'Ai Cập' },
];
