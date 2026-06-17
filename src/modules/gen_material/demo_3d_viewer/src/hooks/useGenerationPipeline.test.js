import { act, renderHook, waitFor } from '@testing-library/react';
import useGenerationPipeline from './useGenerationPipeline';

describe('useGenerationPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    window.alert = jest.fn();
    window.open = jest.fn();
  });

  test('handleGenerate loads scene, seeds queue, and prepares first image review', async () => {
    const setScene = jest.fn();
    const replaceSceneAndResetChrome = jest.fn();

    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({
          session_id: 'session-1',
          scene_data: {
            id: 'generated-1',
            objects: [
              { id: 'obj-1', image_prompt: 'draw me' },
              { id: 'obj-2', image_prompt: 'draw me too' },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ image_url: '/obj-1.png' }),
      });

    const { result } = renderHook(() =>
      useGenerationPipeline({
        setScene,
        replaceSceneAndResetChrome,
      })
    );

    act(() => {
      result.current.setPromptInput('scene prompt');
    });

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(setScene).toHaveBeenCalledWith({
      id: 'generated-1',
      objects: [
        { id: 'obj-1', image_prompt: 'draw me' },
        { id: 'obj-2', image_prompt: 'draw me too' },
      ],
    });
    expect(result.current.pendingImages).toHaveLength(2);
    expect(result.current.confirmingImage).toMatchObject({ id: 'obj-1', imageUrl: '/obj-1.png' });
    expect(result.current.generationStep).toMatch(/Còn 1 đối tượng/);
    expect(replaceSceneAndResetChrome).not.toHaveBeenCalled();
  });

  test('handleGenerateWorldPano stores viewer and pano urls and opens the viewer in-app', async () => {
    const setScene = jest.fn();
    const replaceSceneAndResetChrome = jest.fn();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        session_id: 'pano-1',
        viewer_url: '/assets/world_pano_view_1.html?v=1',
        pano_url: '/assets/world_pano_1.png?v=1',
      }),
    });

    const { result } = renderHook(() =>
      useGenerationPipeline({
        setScene,
        replaceSceneAndResetChrome,
      })
    );

    act(() => {
      result.current.setWorldModePrompt('make a panorama');
    });

    await act(async () => {
      await result.current.handleGenerateWorldPano();
    });

    expect(result.current.worldPanoViewerUrl).toBe('/assets/world_pano_view_1.html?v=1');
    expect(result.current.worldPanoImageUrl).toBe('/assets/world_pano_1.png?v=1');
    expect(window.open).toHaveBeenCalledTimes(0);
    expect(result.current.isWorldPanoViewerOpen).toBe(true);
    expect(result.current.generationStep).toBe('Đã tạo xong panorama 360. Đang mở pano HTML.');
    expect(replaceSceneAndResetChrome).not.toHaveBeenCalled();
  });
});
