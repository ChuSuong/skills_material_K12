import React, { useState, useEffect, useMemo } from 'react';
import GlbViewerApp from './GlbViewerApp';
import useGeneratedSceneLibrary from './hooks/useGeneratedSceneLibrary';
import useSceneManager from './hooks/useSceneManager';
import ControlPanel from './components/ControlPanel';
import ImageReviewModal from './components/ImageReviewModal';
import ProcessingModal from './components/ProcessingModal';
import SceneInfoPanel from './components/SceneInfoPanel';
import { sceneLoaders } from './scenes/sceneRegistry';
import { renderSceneObject } from './viewer/renderSceneObject';
import SceneCanvas from './viewer/SceneCanvas';
import { getGeneratedScenePalette, isGeneratedScene } from './viewer/scenePresentation';
import useGenerationPipeline from './hooks/useGenerationPipeline';
function MainApp() {
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [generatedRenderMode, setGeneratedRenderMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'flat';
    }
    return window.localStorage.getItem('gen-material-render-mode') || 'flat';
  });
  const resetSceneChrome = () => {
    setSelectedInfo(null);
    setIsDissolving(false);
  };
  const {
    activeScene,
    isLoading,
    restoreScene,
    setActiveScene,
    switchScene,
  } = useSceneManager({
    sceneLoaders,
    onBeforeBuiltInSceneLoad: resetSceneChrome,
  });
  const replaceSceneAndResetChrome = (scene) => {
    setActiveScene(scene);
    resetSceneChrome();
  };
  const {
    promptInput,
    setPromptInput,
    isGenerating,
    pendingImages,
    confirmingImage,
    generationStep,
    isConfirming3D,
    processing3DObjectId,
    isUploadingImage,
    uploadError,
    isDirectUploadGenerating,
    directUploadError,
    imageEnhanceMode,
    setImageEnhanceMode,
    handleGenerate,
    handleUploadImage,
    handleConfirmImage,
    handleDirectUpload3D,
    isImageActionDisabled,
    isDirectActionDisabled,
    clearGenerationUi,
  } = useGenerationPipeline({
    setScene: setActiveScene,
    replaceSceneAndResetChrome,
  });

  const isObjectMode = true;
  const objectPanelStyle = { display: 'block' };
  const setObjectMode = () => {
    clearGenerationUi();
  };
  const setWorldMode = () => {
    clearGenerationUi();
  };
  const showDissolveControl = activeScene?.allowDissolve;
  const showGeneratedRenderModeControl = Boolean(activeScene && isGeneratedScene(activeScene) && activeScene.environment === 'museumFocus');
  const activeIntroText = activeScene?.interactions?.find(i => i.trigger === 'start')?.text || '';
  const activeTheme = activeScene?.theme || 'Đang tải...';
  const handleRestoreGeneratedScene = (scene) => {
    restoreScene(scene);
    setSelectedInfo(null);
    setIsDissolving(false);
    clearGenerationUi();
  };
  const {
    generatedSceneLibrary: persistedGeneratedSceneLibrary,
    hasHydratedLibraryState,
    restoreGeneratedSceneFromLibrary,
    removeGeneratedSceneFromLibrary,
  } = useGeneratedSceneLibrary({
    activeScene,
    isGeneratedScene,
    onRestoreScene: handleRestoreGeneratedScene,
  });

  useEffect(() => {
    if (hasHydratedLibraryState && !activeScene && !isLoading) {
      switchScene('museum');
    }
  }, [activeScene, hasHydratedLibraryState, isLoading, switchScene]);

  useEffect(() => {
    window.localStorage.setItem('gen-material-render-mode', generatedRenderMode);
  }, [generatedRenderMode]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn { from { opacity: 0; transform: translateY(0); } to { opacity: 1; transform: translateY(-10px); } }
      @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      .tooltip {
        background: rgba(0, 0, 0, 0.7); color: white; padding: 8px 16px; border-radius: 20px; white-space: nowrap;
        backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        font-family: sans-serif; font-size: 14px; pointer-events: none; transform: translateY(-10px); animation: fadeIn 0.2s ease-out;
      }
      .btn-primary {
        cursor: pointer; border: none; border-radius: 999px; padding: 8px 14px; background: #475569; color: white;
        font-weight: 700; font-size: 13px; transition: background 0.2s;
      }
      .btn-primary:hover { background: #334155; }
      .btn-primary.active { background: #7c3aed; box-shadow: 0 0 10px rgba(124, 58, 237, 0.5); }
      .btn-action {
        cursor: pointer; border: none; border-radius: 999px; padding: 10px 16px; background: #7c3aed; color: white;
        font-weight: 700; font-size: 14px; transition: background 0.2s; margin-top: 15px;
      }
      .btn-action:hover { background: #6d28d9; }
    `;
    document.head.appendChild(style);
    
    document.body.style.backgroundColor = '#e8eef5';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    
    return () => { document.head.removeChild(style); };
  }, []);

  const handleObjectClick = (data) => {
    setSelectedInfo(data);
  };

  const renderObject = (obj) => {
    return renderSceneObject({ ...obj, previewRenderMode: generatedRenderMode }, handleObjectClick);
  };

  const bgColors = {
    'museum': '#05060a',
    'solar': '#020205',
    'ocean': '#082f49',
    'forest': '#431407',
    'egypt': '#78350f'
  };
  const bgColor = activeScene
    ? (
        activeScene.environment === 'museumFocus'
          ? (activeScene.backgroundColor || getGeneratedScenePalette(activeScene).backgroundColor || '#f8fafc')
          : (bgColors[activeScene.id] || '#05060a')
      )
    : '#f8fafc';
  const isGeneratedMuseumFocus = Boolean(activeScene && isGeneratedScene(activeScene) && activeScene.environment === 'museumFocus');
  const showGlobalFog = Boolean(activeScene && !isGeneratedMuseumFocus && (activeScene.id === 'museum' || activeScene.id === 'solar' || activeScene.sceneStyle === 'spaceGallery'));
  const showGlobalStars = showGlobalFog;

  useEffect(() => {
    document.body.style.backgroundColor = bgColor;
  }, [bgColor]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif', background: bgColor }}>
      
      <ControlPanel
        isObjectMode={isObjectMode}
        setObjectMode={setObjectMode}
        setWorldMode={setWorldMode}
        activeScene={activeScene}
        switchScene={switchScene}
        generatedSceneLibrary={persistedGeneratedSceneLibrary}
        restoreGeneratedSceneFromLibrary={restoreGeneratedSceneFromLibrary}
        removeGeneratedSceneFromLibrary={removeGeneratedSceneFromLibrary}
        activeTheme={activeTheme}
        activeIntroText={activeIntroText}
        showDissolveControl={showDissolveControl}
        showGeneratedRenderModeControl={showGeneratedRenderModeControl}
        generatedRenderMode={generatedRenderMode}
        setGeneratedRenderMode={setGeneratedRenderMode}
        isDissolving={isDissolving}
        onToggleDissolve={() => { setIsDissolving(!isDissolving); setSelectedInfo(null); }}
        objectPanelStyle={objectPanelStyle}
        promptInput={promptInput}
        setPromptInput={setPromptInput}
        isDirectActionDisabled={isDirectActionDisabled}
        isGenerating={isGenerating}
        handleGenerate={handleGenerate}
        handleDirectUpload3D={handleDirectUpload3D}
        isConfirming3D={isConfirming3D}
        isUploadingImage={isUploadingImage}
        isDirectUploadGenerating={isDirectUploadGenerating}
        directUploadError={directUploadError}
        imageEnhanceMode={imageEnhanceMode}
        setImageEnhanceMode={setImageEnhanceMode}
        generationStep={generationStep}
      />

      <ImageReviewModal
        confirmingImage={confirmingImage}
        pendingImages={pendingImages}
        isImageActionDisabled={isImageActionDisabled}
        handleUploadImage={handleUploadImage}
        isUploadingImage={isUploadingImage}
        uploadError={uploadError}
        handleConfirmImage={handleConfirmImage}
        isConfirming3D={isConfirming3D}
      />

      {isLoading && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: 'white', fontSize: '24px', zIndex: 100, background: 'rgba(0,0,0,0.7)',
          padding: '20px', borderRadius: '12px'
        }}>
          Đang tải dữ liệu cảnh...
        </div>
      )}

      <ProcessingModal isOpen={isConfirming3D} processing3DObjectId={processing3DObjectId} />

      <SceneCanvas
        activeScene={activeScene}
        bgColor={bgColor}
        isDissolving={isDissolving}
        isGeneratedMuseumFocus={isGeneratedMuseumFocus}
        renderObject={renderObject}
        showGlobalFog={showGlobalFog}
        showGlobalStars={showGlobalStars}
        generatedRenderMode={generatedRenderMode}
      />

      <SceneInfoPanel
        selectedInfo={selectedInfo}
        isDissolving={isDissolving}
        onClose={() => setSelectedInfo(null)}
      />
    </div>
  );
}

function App() {
  const queryMode = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('viewer') || (params.get('glb') ? 'glb' : '');
  }, []);

  if (queryMode === 'glb') {
    return <GlbViewerApp />;
  }

  return <MainApp />;
}

export default App;
