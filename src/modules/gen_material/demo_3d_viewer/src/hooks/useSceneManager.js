import { useCallback, useState } from 'react';

export default function useSceneManager({
  sceneLoaders,
  onBeforeBuiltInSceneLoad,
}) {
  const [activeScene, setActiveScene] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const switchScene = useCallback(async (sceneId) => {
    setIsLoading(true);
    onBeforeBuiltInSceneLoad?.();
    setActiveScene(null);

    try {
      const module = await sceneLoaders[sceneId]();
      setActiveScene(module.default || module);
    } catch (error) {
      console.error('Failed to load scene', error);
    } finally {
      setIsLoading(false);
    }
  }, [onBeforeBuiltInSceneLoad, sceneLoaders]);

  const restoreScene = useCallback((scene) => {
    setActiveScene(scene);
  }, []);

  return {
    activeScene,
    isLoading,
    restoreScene,
    setActiveScene,
    switchScene,
  };
}
