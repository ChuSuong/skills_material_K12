import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import CameraAdjuster from './CameraAdjuster';
import SceneEnvironment from './SceneEnvironment';
import { DissolveContext } from './objectComponents';

function canCreateWebGLContext() {
  if (typeof document === 'undefined') {
    return true;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

function WebGLUnavailableFallback() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      color: '#e2e8f0',
      background: '#05060a',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 520, lineHeight: 1.5 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 22 }}>Không thể khởi tạo trình xem 3D</h2>
        <p style={{ margin: 0 }}>
          Trình duyệt hiện tại không tạo được WebGL context. Hãy bật hardware acceleration,
          dùng Chrome/Edge có hỗ trợ WebGL, hoặc mở app ngoài môi trường remote/headless.
        </p>
      </div>
    </div>
  );
}

export default function SceneCanvas({
  activeScene,
  bgColor,
  isDissolving,
  isGeneratedMuseumFocus,
  renderObject,
  showGlobalFog,
  showGlobalStars,
  generatedRenderMode,
}) {
  const hasWebGL = useMemo(canCreateWebGLContext, []);
  const useFlatGeneratedRenderMode = isGeneratedMuseumFocus && generatedRenderMode === 'flat';
  const hasImmersiveSplatScene = Boolean(activeScene?.objects?.some((obj) => obj.splat_url));
  const controlsTarget = hasImmersiveSplatScene
    ? [0, 0, 1]
    : isGeneratedMuseumFocus
      ? [0, 0.78, 0]
      : [0, 0, 0];

  return (
    <div style={{ flex: 1 }}>
      {!hasWebGL ? (
        <WebGLUnavailableFallback />
      ) : (
        <Canvas
          shadows={!useFlatGeneratedRenderMode}
          gl={{
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
          }}
        >
          <CameraAdjuster activeScene={activeScene} />

          <color attach="background" args={[bgColor]} />

          {showGlobalFog && (
            <fog attach="fog" args={[bgColor, 8, 35]} />
          )}

          <OrbitControls enableDamping dampingFactor={0.05} target={controlsTarget} />

          <DissolveContext.Provider value={isDissolving}>
            {activeScene && <SceneEnvironment activeScene={activeScene} renderMode={generatedRenderMode} />}
            <Suspense fallback={null}>
              {activeScene?.objects.map(renderObject)}
            </Suspense>
          </DissolveContext.Provider>

          {showGlobalStars && (
            <Stars radius={50} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
          )}
        </Canvas>
      )}
    </div>
  );
}
