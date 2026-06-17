import { act, renderHook, waitFor } from '@testing-library/react';
import useGeneratedSceneLibrary, {
  GENERATED_SCENE_HIDDEN_KEY,
  GENERATED_SCENE_LIBRARY_KEY,
  GENERATED_SCENE_STORAGE_KEY,
  buildGeneratedSceneFromLibraryAsset,
  isGeneratedSceneSnapshotStale,
  mergeGeneratedSceneLibrary,
} from './useGeneratedSceneLibrary';

describe('useGeneratedSceneLibrary', () => {
  const generatedScene = {
    id: 'generated-demo',
    theme: 'Generated Demo',
    environment: 'museumFocus',
    objects: [{ id: 'obj-1', model_url: '/demo.glb' }],
  };

  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    jest.restoreAllMocks();
  });

  test('does not restore stale saved generated scene when backend library is empty', async () => {
    const onRestoreScene = jest.fn();
    const staleScene = {
      ...generatedScene,
      objects: [{ id: 'obj-1', model_url: '/assets/missing-generated-asset.glb?v=1' }],
    };
    window.localStorage.setItem(GENERATED_SCENE_STORAGE_KEY, JSON.stringify(staleScene));

    renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene,
      })
    );

    await waitFor(() => {
      expect(window.localStorage.getItem(GENERATED_SCENE_STORAGE_KEY)).toBeNull();
    });

    expect(onRestoreScene).not.toHaveBeenCalled();
  });

  test('restores saved generated scene on mount when backend library still has the asset', async () => {
    const onRestoreScene = jest.fn();
    const savedScene = {
      ...generatedScene,
      objects: [{ id: 'obj-1', model_url: '/assets/missing-generated-asset.glb?v=1' }],
    };
    window.localStorage.setItem(GENERATED_SCENE_STORAGE_KEY, JSON.stringify(savedScene));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'object_baseball_player_001',
            library_id: 'disk:object_baseball_player_001',
            label: 'object baseball player 001',
            model_url: '/assets/object_baseball_player_001.glb?v=999',
            image_url: '/assets/object_baseball_player_001_img.png?v=999',
            modified_at: '2026-06-03T00:00:00+00:00',
            source: 'disk',
            metadata: {},
          },
        ],
      }),
    });

    renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene,
      })
    );

    await waitFor(() => {
      expect(onRestoreScene).toHaveBeenCalledWith(expect.objectContaining({
        id: savedScene.id,
      }));
    });
  });

  test('removes stale browser-generated library snapshots after hydration', async () => {
    const staleScene = {
      ...generatedScene,
      libraryId: 'generated-demo-stale',
      objects: [{ id: 'obj-1', model_url: '/assets/missing-generated-asset.glb?v=1' }],
    };
    window.localStorage.setItem(GENERATED_SCENE_LIBRARY_KEY, JSON.stringify([staleScene]));

    const { result } = renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene: jest.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(0);
    });

    expect(JSON.parse(window.localStorage.getItem(GENERATED_SCENE_LIBRARY_KEY))).toEqual([]);
  });

  test('persists generated scene into active slot and library', async () => {

  test('persists generated scene into active slot and library', async () => {
    const { result, rerender } = renderHook(
      ({ activeScene }) =>
        useGeneratedSceneLibrary({
          activeScene,
          isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
          onRestoreScene: jest.fn(),
          maxItems: 3,
        }),
      {
        initialProps: { activeScene: null },
      }
    );

    rerender({ activeScene: generatedScene });

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(1);
    });

    const savedActiveScene = JSON.parse(window.localStorage.getItem(GENERATED_SCENE_STORAGE_KEY));
    const savedLibrary = JSON.parse(window.localStorage.getItem(GENERATED_SCENE_LIBRARY_KEY));

    expect(savedActiveScene.id).toBe(generatedScene.id);
    expect(savedLibrary).toHaveLength(1);
    expect(savedLibrary[0].libraryLabel).toBe('Generated Demo');
  });

  test('merges local disk library items with browser snapshots', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'object-meo-001',
            library_id: 'disk:object-meo-001',
            label: 'object meo 001',
            model_url: '/assets/object-meo-001.glb?v=1',
            image_url: '/assets/object-meo-001_img.png?v=1',
            modified_at: '2026-06-03T00:00:00+00:00',
            source: 'disk',
            metadata: {
              backend: 'trellis2',
              model_path: 'microsoft/TRELLIS.2-4B',
            },
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene: jest.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(1);
    });

    expect(result.current.generatedSceneLibrary[0].libraryId).toBe('disk:object-meo-001');
    expect(result.current.generatedSceneLibrary[0].objects[0].model_url).toBe('/assets/object-meo-001.glb?v=1');
    expect(result.current.generatedSceneLibrary[0].generation_metadata.model_path).toBe('microsoft/TRELLIS.2-4B');
    expect(result.current.generatedSceneLibrary[0].objects[0].generation_metadata.model_path).toBe('microsoft/TRELLIS.2-4B');
    expect(result.current.generatedSceneLibrary[0].objects[0].title).toBe('object meo 001');
  });

  test('restores disk library item with preserved metadata', async () => {
    const onRestoreScene = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'object-meo-001',
            library_id: 'disk:object-meo-001',
            label: 'object meo 001',
            model_url: '/assets/object-meo-001.glb?v=1',
            image_url: '/assets/object-meo-001_img.png?v=1',
            modified_at: '2026-06-03T00:00:00+00:00',
            source: 'disk',
            metadata: {
              backend: 'trellis2',
              model_path: 'microsoft/TRELLIS.2-4B',
            },
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene,
      })
    );

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(1);
    });

    act(() => {
      result.current.restoreGeneratedSceneFromLibrary(result.current.generatedSceneLibrary[0]);
    });

    expect(onRestoreScene).toHaveBeenCalledWith(expect.objectContaining({
      libraryId: 'disk:object-meo-001',
      generation_metadata: expect.objectContaining({
        model_path: 'microsoft/TRELLIS.2-4B',
      }),
      objects: [
        expect.objectContaining({
          model_url: '/assets/object-meo-001.glb?v=1',
          generation_metadata: expect.objectContaining({
            model_path: 'microsoft/TRELLIS.2-4B',
          }),
        }),
      ],
    }));
  });

  test('persists direct-upload generated scene into active slot and library', async () => {
    const directUploadScene = {
      id: 'generated-upload-session-123',
      theme: 'Mô hình 3D từ ảnh có sẵn',
      environment: 'museumFocus',
      sceneStyle: 'galleryLight',
      objects: [{ id: 'uploaded_object', model_url: '/assets/uploaded_object.glb?v=1' }],
    };

    const { result, rerender } = renderHook(
      ({ activeScene }) =>
        useGeneratedSceneLibrary({
          activeScene,
          isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
          onRestoreScene: jest.fn(),
        }),
      {
        initialProps: { activeScene: null },
      }
    );

    rerender({ activeScene: directUploadScene });

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(1);
    });

    const savedActiveScene = JSON.parse(window.localStorage.getItem(GENERATED_SCENE_STORAGE_KEY));
    const savedLibrary = JSON.parse(window.localStorage.getItem(GENERATED_SCENE_LIBRARY_KEY));

    expect(savedActiveScene.id).toBe('generated-upload-session-123');
    expect(savedLibrary).toHaveLength(1);
    expect(savedLibrary[0].id).toBe('generated-upload-session-123');
    expect(savedLibrary[0].objects[0].model_url).toBe('/assets/uploaded_object.glb?v=1');
  });

  test('removes a library item by hiding it and updates localStorage', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'object-meo-001',
            library_id: 'disk:object-meo-001',
            label: 'object meo 001',
            model_url: '/assets/object-meo-001.glb?v=1',
            image_url: '/assets/object-meo-001_img.png?v=1',
            modified_at: '2026-06-03T00:00:00+00:00',
            source: 'disk',
            metadata: {
              backend: 'trellis2',
              model_path: 'microsoft/TRELLIS.2-4B',
            },
          },
        ],
      }),
    });

    const { result } = renderHook(() =>
      useGeneratedSceneLibrary({
        activeScene: null,
        isGeneratedScene: (scene) => Boolean(scene && scene.id.startsWith('generated')),
        onRestoreScene: jest.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.generatedSceneLibrary).toHaveLength(1);
    });

    act(() => {
      result.current.removeGeneratedSceneFromLibrary(result.current.generatedSceneLibrary[0].libraryId);
    });

    expect(result.current.generatedSceneLibrary).toHaveLength(0);
    expect(JSON.parse(window.localStorage.getItem(GENERATED_SCENE_HIDDEN_KEY))).toEqual(['disk:object-meo-001']);
  });

  test('helper builds a generated scene from a disk asset', () => {
    const scene = buildGeneratedSceneFromLibraryAsset({
      id: 'tree_001',
      library_id: 'disk:tree_001',
      label: 'tree 001',
      model_url: '/assets/tree_001.glb?v=1',
      image_url: '/assets/tree_001_img.png?v=1',
      modified_at: '2026-06-03T00:00:00+00:00',
      source: 'disk',
      metadata: {
        backend: 'trellis2',
        model_path: 'microsoft/TRELLIS.2-4B',
      },
    });

    expect(scene.libraryId).toBe('disk:tree_001');
    expect(scene.environment).toBe('museumFocus');
    expect(scene.objects[0].model_url).toBe('/assets/tree_001.glb?v=1');
    expect(scene.generation_metadata.model_path).toBe('microsoft/TRELLIS.2-4B');
    expect(scene.objects[0].generation_metadata.model_path).toBe('microsoft/TRELLIS.2-4B');
    expect(scene.objects[0].description).toContain('Checkpoint: microsoft/TRELLIS.2-4B');
  });

  test('helper merges browser and disk scenes while honoring hidden ids', () => {
    const merged = mergeGeneratedSceneLibrary(
      [
        {
          libraryId: 'browser:1',
          libraryLabel: 'Browser item',
          savedAt: '2026-06-03T10:00:00+00:00',
        },
      ],
      [
        {
          libraryId: 'disk:1',
          libraryLabel: 'Disk item',
          savedAt: '2026-06-03T09:00:00+00:00',
        },
      ],
      ['disk:1'],
      12
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].libraryId).toBe('browser:1');
  });

  test('helper marks generated snapshot as stale when disk asset is missing', () => {
    expect(isGeneratedSceneSnapshotStale(
      {
        objects: [{ model_url: '/assets/missing-generated-asset.glb?v=1' }],
      },
      []
    )).toBe(true);
  });

  test('helper keeps generated snapshot valid when disk asset still exists', () => {
    expect(isGeneratedSceneSnapshotStale(
      {
        objects: [{ model_url: '/assets/missing-generated-asset.glb?v=1' }],
      },
      [
        {
          model_url: '/assets/object_baseball_player_001.glb?v=999',
        },
      ]
    )).toBe(false);
  });
});
