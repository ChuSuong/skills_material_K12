import { act, renderHook, waitFor } from '@testing-library/react';
import useSceneManager from './useSceneManager';

describe('useSceneManager', () => {
  test('switchScene resets and loads the target built-in scene', async () => {
    const museumScene = { id: 'museum', theme: 'Museum' };
    const oceanScene = { id: 'ocean', theme: 'Ocean' };
    const sceneLoaders = {
      museum: jest.fn().mockResolvedValue({ default: museumScene }),
      ocean: jest.fn().mockResolvedValue({ default: oceanScene }),
    };
    const onBeforeBuiltInSceneLoad = jest.fn();

    const { result } = renderHook(() =>
      useSceneManager({
        sceneLoaders,
        onBeforeBuiltInSceneLoad,
      })
    );

    await act(async () => {
      await result.current.switchScene('ocean');
    });

    expect(onBeforeBuiltInSceneLoad).toHaveBeenCalledTimes(1);
    expect(result.current.activeScene).toEqual(oceanScene);
    expect(result.current.isLoading).toBe(false);
  });

  test('restoreScene replaces the active scene immediately', () => {
    const generatedScene = { id: 'generated-1', theme: 'Generated' };
    const { result } = renderHook(() =>
      useSceneManager({
        sceneLoaders: { museum: jest.fn() },
      })
    );

    act(() => {
      result.current.restoreScene(generatedScene);
    });

    expect(result.current.activeScene).toEqual(generatedScene);
  });

  test('switchScene keeps loading flag accurate during async load', async () => {
    let resolveScene;
    const sceneLoaders = {
      forest: jest.fn().mockImplementation(() => new Promise((resolve) => {
        resolveScene = () => resolve({ default: { id: 'forest', theme: 'Forest' } });
      })),
    };

    const { result } = renderHook(() =>
      useSceneManager({
        sceneLoaders,
      })
    );

    let promise;
    act(() => {
      promise = result.current.switchScene('forest');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      resolveScene();
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeScene).toEqual({ id: 'forest', theme: 'Forest' });
  });
});
