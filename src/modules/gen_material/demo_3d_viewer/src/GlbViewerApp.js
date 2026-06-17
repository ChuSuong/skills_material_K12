import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Environment, Grid, Html, OrbitControls, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

function useInitialGlbSource() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { url: '', label: '' };
    }
    const params = new URLSearchParams(window.location.search);
    const glb = params.get('glb');
    if (!glb) {
      return { url: '', label: '' };
    }
    return { url: glb, label: glb };
  }, []);
}

function LoadingOverlay() {
  const { active, progress, item } = useProgress();

  if (!active) {
    return null;
  }

  return (
    <Html center>
      <div style={{
        minWidth: 260,
        padding: '18px 20px',
        borderRadius: 18,
        background: 'rgba(7, 11, 20, 0.88)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.38)',
        color: '#e5eef8',
        backdropFilter: 'blur(14px)',
      }}>
        <div style={{ fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8fb7ff' }}>
          Loading GLB
        </div>
        <div style={{ marginTop: 10, fontSize: 28, fontWeight: 700 }}>{Math.round(progress)}%</div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 999, overflow: 'hidden', background: 'rgba(148, 163, 184, 0.16)' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #38bdf8 0%, #fb7185 100%)',
          }} />
        </div>
        {item ? (
          <div style={{ marginTop: 10, fontSize: 12, color: '#b8c4d6', wordBreak: 'break-all' }}>
            {item}
          </div>
        ) : null}
      </div>
    </Html>
  );
}

function EmptyState() {
  return (
    <Html center>
      <div style={{
        maxWidth: 420,
        padding: '20px 22px',
        borderRadius: 18,
        background: 'rgba(7, 11, 20, 0.84)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.34)',
        color: '#e5eef8',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8fb7ff' }}>
          GLB Viewer
        </div>
        <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700 }}>
          Drop a `.glb` file or paste a URL
        </div>
        <div style={{ marginTop: 10, fontSize: 14, color: '#b8c4d6' }}>
          This viewer is for exported `scene.glb` files from WorldGen or any other GLB asset.
        </div>
      </div>
    </Html>
  );
}

function FitCamera({ bounds, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!bounds) {
      return;
    }

    const center = bounds.center;
    const size = bounds.size;
    const maxDim = Math.max(size.x, size.y, size.z, 1e-3);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.55;
    const elevatedDistance = Math.max(distance, maxDim * 1.2);

    camera.position.set(center.x + elevatedDistance * 0.65, center.y + elevatedDistance * 0.4, center.z + elevatedDistance);
    camera.near = Math.max(maxDim / 500, 0.01);
    camera.far = Math.max(maxDim * 20, 1000);
    camera.updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.set(center.x, center.y, center.z);
      controlsRef.current.update();
    } else {
      camera.lookAt(center);
    }
  }, [bounds, camera, controlsRef]);

  return null;
}

function GlbAsset({ sourceUrl, renderOptions, onBoundsChange }) {
  const gltf = useLoader(GLTFLoader, sourceUrl);

  const prepared = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((child) => {
      if (!child.isMesh) {
        return;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) {
          return;
        }
        material.wireframe = renderOptions.wireframe;
        material.side = renderOptions.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        if ('needsUpdate' in material) {
          material.needsUpdate = true;
        }
      });
    });

    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    root.position.sub(center);

    return {
      object: root,
      bounds: {
        center: new THREE.Vector3(0, 0, 0),
        size,
      },
    };
  }, [gltf, renderOptions.doubleSided, renderOptions.wireframe]);

  useEffect(() => {
    onBoundsChange(prepared.bounds);
  }, [onBoundsChange, prepared.bounds]);

  return <primitive object={prepared.object} />;
}

function GlbCanvas({ sourceUrl, renderOptions }) {
  const [bounds, setBounds] = useState(null);
  const controlsRef = useRef(null);

  return (
    <Canvas
      shadows
      camera={{ position: [4, 3, 8], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={[renderOptions.background]} />
      <fog attach="fog" args={[renderOptions.background, 25, 70]} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[8, 12, 10]} intensity={2.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-10, 6, -8]} intensity={0.8} />
      <Suspense fallback={<LoadingOverlay />}>
        {renderOptions.environment ? <Environment preset="city" /> : null}
        {renderOptions.grid ? (
          <Grid
            position={[0, -0.001, 0]}
            args={[80, 80]}
            cellSize={0.6}
            cellThickness={0.5}
            cellColor="#3b4b68"
            sectionSize={3}
            sectionThickness={1}
            sectionColor="#8fb7ff"
            fadeDistance={100}
            fadeStrength={1.2}
            infiniteGrid
          />
        ) : null}
        {sourceUrl ? (
          <>
            <GlbAsset sourceUrl={sourceUrl} renderOptions={renderOptions} onBoundsChange={setBounds} />
            <FitCamera bounds={bounds} controlsRef={controlsRef} />
          </>
        ) : (
          <EmptyState />
        )}
      </Suspense>
      <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} autoRotate={renderOptions.autoRotate} autoRotateSpeed={1.6} />
    </Canvas>
  );
}

function inferSceneStats(sourceLabel) {
  if (!sourceLabel) {
    return '';
  }
  return sourceLabel;
}

export default function GlbViewerApp() {
  const initialSource = useInitialGlbSource();
  const [sourceUrl, setSourceUrl] = useState(initialSource.url);
  const [sourceLabel, setSourceLabel] = useState(initialSource.label);
  const [urlInput, setUrlInput] = useState(initialSource.url);
  const [isDragOver, setIsDragOver] = useState(false);
  const [renderOptions, setRenderOptions] = useState({
    background: '#0b1120',
    environment: true,
    grid: true,
    autoRotate: false,
    wireframe: false,
    doubleSided: true,
  });
  const objectUrlRef = useRef('');

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const setSourceFromFile = (file) => {
    if (!file) {
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSourceUrl(objectUrl);
    setSourceLabel(file.name);
    setUrlInput('');
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    setSourceFromFile(file);
    event.target.value = '';
  };

  const applyUrlInput = () => {
    const next = urlInput.trim();
    if (!next) {
      return;
    }
    setSourceUrl(next);
    setSourceLabel(next);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }
  };

  const toggleOption = (key) => {
    setRenderOptions((current) => ({ ...current, [key]: !current[key] }));
  };

  const sceneStats = inferSceneStats(sourceLabel);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        setSourceFromFile(file);
      }}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: 'radial-gradient(circle at top, #172554 0%, #020617 50%, #01040c 100%)',
        color: '#e2e8f0',
        fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
      }}
    >
      <div style={{
        position: 'fixed',
        inset: 18,
        borderRadius: 30,
        pointerEvents: 'none',
        border: isDragOver ? '2px dashed rgba(125, 211, 252, 0.8)' : '1px solid rgba(148, 163, 184, 0.12)',
        boxShadow: isDragOver ? '0 0 0 9999px rgba(14, 165, 233, 0.08) inset' : 'none',
        transition: 'all 0.2s ease',
      }} />

      <aside style={{
        position: 'fixed',
        top: 20,
        left: 20,
        width: 360,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        padding: 20,
        borderRadius: 28,
        background: 'rgba(7, 11, 20, 0.72)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.34)',
        backdropFilter: 'blur(18px)',
        zIndex: 10,
      }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8fb7ff' }}>
          WorldGen Base Viewer
        </div>
        <h1 style={{ margin: '10px 0 8px', fontSize: 30, lineHeight: 1.02 }}>
          GLB playground
        </h1>
        <p style={{ margin: 0, color: '#b8c4d6', lineHeight: 1.6, fontSize: 14 }}>
          Load any `scene.glb`, orbit around it, and use this page as a reusable viewer shell for exported WorldGen scenes.
        </p>

        <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              GLB URL
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="/models/example.glb or https://..."
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.7)',
                  color: '#e2e8f0',
                  outline: 'none',
                }}
              />
              <button
                onClick={applyUrlInput}
                style={{
                  padding: '12px 16px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Load
              </button>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 18px',
            borderRadius: 16,
            border: '1px dashed rgba(125, 211, 252, 0.4)',
            background: 'rgba(14, 165, 233, 0.08)',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            <input type="file" accept=".glb,model/gltf-binary" onChange={handleFileInput} style={{ display: 'none' }} />
            Upload local `.glb`
          </label>

          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            Tip: open this mode directly with
            {' '}
            <code>?viewer=glb&glb=/models/your-scene.glb</code>
          </div>
        </div>

        <div style={{ marginTop: 22, padding: 16, borderRadius: 20, background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c7d2fe' }}>
            Render
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {[
              ['environment', 'Studio environment'],
              ['grid', 'Ground grid'],
              ['doubleSided', 'Double-sided materials'],
              ['wireframe', 'Wireframe'],
              ['autoRotate', 'Auto-rotate'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{label}</span>
                <input type="checkbox" checked={renderOptions[key]} onChange={() => toggleOption(key)} />
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 22, padding: 16, borderRadius: 20, background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c7d2fe' }}>
            Current source
          </div>
          <div style={{ marginTop: 10, wordBreak: 'break-word', color: '#e2e8f0' }}>
            {sceneStats || 'No file loaded yet'}
          </div>
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <GlbCanvas sourceUrl={sourceUrl} renderOptions={renderOptions} />
      </main>
    </div>
  );
}
