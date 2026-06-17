import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const GENERATED_SCENE_STORAGE_KEY = 'gen-material-active-scene';
export const GENERATED_SCENE_LIBRARY_KEY = 'gen-material-scene-library';
export const GENERATED_SCENE_HIDDEN_KEY = 'gen-material-scene-library-hidden';
export const MAX_GENERATED_SCENE_LIBRARY_ITEMS = 12;

export function createGeneratedSceneSnapshot(scene) {
  return {
    ...scene,
    savedAt: new Date().toISOString(),
    libraryId: scene.libraryId || `${scene.id || 'generated-scene'}-${Date.now()}`,
    libraryLabel: scene.libraryLabel || scene.theme || scene.title || scene.id || 'Scene 3D',
    librarySource: scene.librarySource || 'browser',
    generation_metadata: scene.generation_metadata || scene.objects?.[0]?.generation_metadata || null,
  };
}

export function buildGeneratedSceneFromLibraryAsset(asset) {
  const metadata = asset.metadata || {};
  const title = asset.label || asset.file_name || asset.id || 'Scene 3D';

  return {
    id: `generated-library-${asset.id}`,
    theme: title,
    title,
    libraryId: asset.library_id || `disk:${asset.id}`,
    libraryLabel: title,
    librarySource: asset.source || 'disk',
    savedAt: asset.modified_at,
    allowDissolve: false,
    particleColor: '#38bdf8',
    environment: 'museumFocus',
    sceneStyle: 'galleryLight',
    backgroundColor: '#f8fafc',
    floorColor: '#e7e5e4',
    pedestalColor: '#fafbfd',
    accentColor: '#38bdf8',
    secondaryAccentColor: '#64748b',
    generation_metadata: metadata,
    character: {
      name: 'Thư viện 3D cục bộ',
      voice_id: 'vi-VN',
      animation: 'idle',
    },
    interactions: [
      {
        trigger: 'start',
        action: 'speak',
        text: 'Đây là mô hình 3D đã được tạo và lưu trên máy cục bộ.',
      },
    ],
    objects: [
      {
        id: `library-object-${asset.id}`,
        type: 'generatedModel',
        position: [0, 0.78, 0],
        scale: [1.8, 1.8, 1.8],
        rotation: [0, 0, 0],
        displayMode: 'museumFocus',
        interactable: true,
        title,
        description: metadata.model_path
          ? `Mô hình 3D đã lưu trong outputs. Checkpoint: ${metadata.model_path}`
          : 'Mô hình 3D đã lưu trong thư mục outputs của backend.',
        info: metadata.model_path
          ? `Backend: ${metadata.backend || 'unknown'} · Model: ${metadata.model_path}`
          : 'Bạn có thể xoay, zoom và bấm vào mô hình để xem chi tiết.',
        image_url: asset.image_url || undefined,
        model_url: asset.model_url,
        generation_metadata: metadata,
      },
    ],
  };
}

function normalizeLibraryId(item) {
  return item?.libraryId || item?.library_id || item?.id || null;
}

function normalizeBrowserScene(item) {
  const snapshot = createGeneratedSceneSnapshot(item);
  return {
    ...snapshot,
    libraryId: normalizeLibraryId(snapshot),
    librarySource: snapshot.librarySource || 'browser',
  };
}

function normalizeAssetUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  return url.split('?')[0];
}

function getSceneModelUrls(scene) {
  if (!scene || !Array.isArray(scene.objects)) {
    return [];
  }

  return scene.objects
    .map((item) => normalizeAssetUrl(item?.model_url))
    .filter(Boolean);
}

export function isGeneratedSceneSnapshotStale(scene, diskAssets) {
  const modelUrls = getSceneModelUrls(scene);
  if (modelUrls.length === 0) {
    return false;
  }

  const diskAssetUrls = new Set((diskAssets || []).map((asset) => normalizeAssetUrl(asset?.model_url)).filter(Boolean));
  if (diskAssetUrls.size === 0) {
    return true;
  }

  return modelUrls.some((url) => !diskAssetUrls.has(url));
}

export function mergeGeneratedSceneLibrary(browserScenes, diskScenes, hiddenLibraryIds, maxItems) {
  const hiddenSet = new Set(hiddenLibraryIds || []);
  const merged = [];
  const seen = new Set();

  [...browserScenes, ...diskScenes].forEach((scene) => {
    const libraryId = normalizeLibraryId(scene);
    if (!libraryId || hiddenSet.has(libraryId) || seen.has(libraryId)) {
      return;
    }

    seen.add(libraryId);
    merged.push(scene);
  });

  merged.sort((left, right) => {
    const leftTime = Date.parse(left.savedAt || left.modified_at || 0) || 0;
    const rightTime = Date.parse(right.savedAt || right.modified_at || 0) || 0;
    return rightTime - leftTime;
  });

  return merged.slice(0, maxItems);
}

export default function useGeneratedSceneLibrary({
  activeScene,
  isGeneratedScene,
  onRestoreScene,
  maxItems = MAX_GENERATED_SCENE_LIBRARY_ITEMS,
}) {
  const [browserGeneratedScenes, setBrowserGeneratedScenes] = useState([]);
  const [diskGeneratedScenes, setDiskGeneratedScenes] = useState([]);
  const [hiddenLibraryIds, setHiddenLibraryIds] = useState([]);
  const [hasHydratedLibraryState, setHasHydratedLibraryState] = useState(false);
  const isGeneratedSceneRef = useRef(isGeneratedScene);
  const onRestoreSceneRef = useRef(onRestoreScene);

  useEffect(() => {
    isGeneratedSceneRef.current = isGeneratedScene;
    onRestoreSceneRef.current = onRestoreScene;
  }, [isGeneratedScene, onRestoreScene]);

  const generatedSceneLibrary = useMemo(
    () => mergeGeneratedSceneLibrary(browserGeneratedScenes, diskGeneratedScenes, hiddenLibraryIds, maxItems),
    [browserGeneratedScenes, diskGeneratedScenes, hiddenLibraryIds, maxItems]
  );

  const removeGeneratedSceneFromLibrary = useCallback((libraryId) => {
    if (!libraryId) {
      return;
    }

    setBrowserGeneratedScenes((current) => {
      const next = current.filter((item) => item.libraryId !== libraryId);
      window.localStorage.setItem(GENERATED_SCENE_LIBRARY_KEY, JSON.stringify(next));
      return next;
    });

    setHiddenLibraryIds((current) => {
      const next = current.includes(libraryId) ? current : [...current, libraryId];
      window.localStorage.setItem(GENERATED_SCENE_HIDDEN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const restoreGeneratedSceneFromLibrary = useCallback((scene) => {
    onRestoreSceneRef.current(scene);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const hydrate = async () => {
      try {
        const rawLibrary = window.localStorage.getItem(GENERATED_SCENE_LIBRARY_KEY);
        const parsedBrowserLibrary = rawLibrary ? JSON.parse(rawLibrary) : [];
        const normalizedBrowserLibrary = Array.isArray(parsedBrowserLibrary)
          ? parsedBrowserLibrary.map(normalizeBrowserScene)
          : [];

        const rawHiddenLibraryIds = window.localStorage.getItem(GENERATED_SCENE_HIDDEN_KEY);
        const parsedHiddenLibraryIds = rawHiddenLibraryIds ? JSON.parse(rawHiddenLibraryIds) : [];
        const normalizedHiddenLibraryIds = Array.isArray(parsedHiddenLibraryIds)
          ? parsedHiddenLibraryIds.filter(Boolean)
          : [];

        const rawActiveScene = window.localStorage.getItem(GENERATED_SCENE_STORAGE_KEY);
        const parsedActiveScene = rawActiveScene ? JSON.parse(rawActiveScene) : null;
        const normalizedActiveScene = parsedActiveScene && isGeneratedSceneRef.current(parsedActiveScene)
          ? normalizeBrowserScene(parsedActiveScene)
          : null;

        const response = await fetch('/library_3d');
        if (!response.ok) {
          throw new Error(`Failed to load local 3D library: ${response.status}`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload?.items) ? payload.items : [];
        const nextDiskGeneratedScenes = items.map(buildGeneratedSceneFromLibraryAsset);
        const nextBrowserGeneratedScenes = normalizedBrowserLibrary.filter((scene) => !isGeneratedSceneSnapshotStale(scene, items));
        const hasRemovedStaleBrowserScenes = nextBrowserGeneratedScenes.length !== normalizedBrowserLibrary.length;
        const shouldRestoreActiveScene = normalizedActiveScene && !isGeneratedSceneSnapshotStale(normalizedActiveScene, items);

        if (hasRemovedStaleBrowserScenes) {
          window.localStorage.setItem(GENERATED_SCENE_LIBRARY_KEY, JSON.stringify(nextBrowserGeneratedScenes));
        }

        if (normalizedActiveScene && !shouldRestoreActiveScene) {
          window.localStorage.removeItem(GENERATED_SCENE_STORAGE_KEY);
        }

        if (!isCancelled) {
          setBrowserGeneratedScenes(nextBrowserGeneratedScenes);
          setHiddenLibraryIds(normalizedHiddenLibraryIds);
          setDiskGeneratedScenes(nextDiskGeneratedScenes);
          if (shouldRestoreActiveScene) {
            onRestoreSceneRef.current(normalizedActiveScene);
          }
        }
      } catch (error) {
        console.error('Failed to restore generated scene state', error);
      } finally {
        if (!isCancelled) {
          setHasHydratedLibraryState(true);
        }
      }
    };

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeScene) {
      return;
    }

    if (isGeneratedSceneRef.current(activeScene)) {
      const snapshot = normalizeBrowserScene(activeScene);
      window.localStorage.setItem(GENERATED_SCENE_STORAGE_KEY, JSON.stringify(snapshot));
      setBrowserGeneratedScenes((current) => {
        const deduped = current.filter((item) => item.id !== snapshot.id && item.libraryId !== snapshot.libraryId);
        const next = [snapshot, ...deduped].slice(0, maxItems);
        window.localStorage.setItem(GENERATED_SCENE_LIBRARY_KEY, JSON.stringify(next));
        return next;
      });
      setHiddenLibraryIds((current) => {
        if (!current.includes(snapshot.libraryId)) {
          return current;
        }
        const next = current.filter((item) => item !== snapshot.libraryId);
        window.localStorage.setItem(GENERATED_SCENE_HIDDEN_KEY, JSON.stringify(next));
        return next;
      });
    } else {
      window.localStorage.removeItem(GENERATED_SCENE_STORAGE_KEY);
    }
  }, [activeScene, maxItems]);

  return {
    generatedSceneLibrary,
    hasHydratedLibraryState,
    restoreGeneratedSceneFromLibrary,
    removeGeneratedSceneFromLibrary,
  };
}
