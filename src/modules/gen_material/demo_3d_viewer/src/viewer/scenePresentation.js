import { builtInSceneIds } from '../scenes/sceneRegistry';

export const isGeneratedScene = (scene) => {
  return Boolean(scene && !builtInSceneIds.has(scene.id));
};

export const getGeneratedScenePalette = (scene) => {
  const sceneStyle = scene?.sceneStyle || 'galleryLight';

  if (sceneStyle === 'spaceGallery') {
    return {
      backgroundColor: '#f8fafc',
      floorColor: '#e7e5e4',
      pedestalColor: '#27324a',
      accentColor: scene?.accentColor || scene?.particleColor || '#7dd3fc',
      secondaryAccentColor: scene?.secondaryAccentColor || '#c084fc',
      sceneStyle,
    };
  }

  if (sceneStyle === 'desertStudio') {
    return {
      backgroundColor: '#f8fafc',
      floorColor: '#e7e5e4',
      pedestalColor: '#f8f3eb',
      accentColor: scene?.accentColor || scene?.particleColor || '#d97706',
      secondaryAccentColor: scene?.secondaryAccentColor || '#8b5e34',
      sceneStyle,
    };
  }

  return {
    backgroundColor: '#f8fafc',
    floorColor: '#e7e5e4',
    pedestalColor: '#fafbfd',
    accentColor: scene?.accentColor || scene?.particleColor || '#38bdf8',
    secondaryAccentColor: scene?.secondaryAccentColor || '#64748b',
    sceneStyle,
  };
};
