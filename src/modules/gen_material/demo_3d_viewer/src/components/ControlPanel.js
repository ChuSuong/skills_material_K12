import React from 'react';
import { builtInSceneButtons } from '../scenes/sceneRegistry';

export default function ControlPanel({
  isObjectMode,
  setObjectMode,
  activeScene,
  switchScene,
  generatedSceneLibrary,
  restoreGeneratedSceneFromLibrary,
  removeGeneratedSceneFromLibrary,
  activeTheme,
  activeIntroText,
  showDissolveControl,
  showGeneratedRenderModeControl,
  generatedRenderMode,
  setGeneratedRenderMode,
  isDissolving,
  onToggleDissolve,
  objectPanelStyle,
  promptInput,
  setPromptInput,
  isDirectActionDisabled,
  isGenerating,
  handleGenerate,
  handleDirectUpload3D,
  isConfirming3D,
  isUploadingImage,
  isDirectUploadGenerating,
  directUploadError,
  imageEnhanceMode,
  setImageEnhanceMode,
  generationStep,
}) {
  const isEnhanceModeDisabled = isDirectUploadGenerating || isConfirming3D || isUploadingImage;
  return (
    <div style={{
      position: 'fixed', top: '20px', left: '20px', zIndex: 10, maxWidth: '400px', width: 'calc(100vw - 40px)',
      maxHeight: 'calc(100vh - 40px)', padding: '20px', background: 'rgba(0, 0, 0, 0.55)', color: 'white',
      borderRadius: '16px', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.16)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
        <button className={`btn-primary ${isObjectMode ? 'active' : ''}`} onClick={setObjectMode}>Object 3D</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {builtInSceneButtons.map((scene) => (
            <button
              key={scene.id}
              className={`btn-primary ${activeScene?.id === scene.id ? 'active' : ''}`}
              onClick={() => switchScene(scene.id)}
            >
              {scene.label}
            </button>
          ))}
        </div>

        {generatedSceneLibrary.length > 0 && (
          <div style={{ marginTop: '6px', marginBottom: '28px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 0, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
              <strong style={{ fontSize: '13px', color: '#cbd5e1' }}>Library 3D</strong>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{generatedSceneLibrary.length} scene</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '170px', overflowY: 'auto' }}>
              {generatedSceneLibrary.map((scene) => (
                <div key={scene.libraryId} style={{ display: 'flex', alignItems: 'stretch', gap: '8px' }}>
                  <button
                    className={`btn-primary ${activeScene?.libraryId === scene.libraryId ? 'active' : ''}`}
                    style={{ flex: 1, textAlign: 'left', borderRadius: '10px', whiteSpace: 'normal', lineHeight: '1.35', paddingTop: '10px', paddingBottom: '10px' }}
                    onClick={() => restoreGeneratedSceneFromLibrary(scene)}
                  >
                    {scene.libraryLabel}
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 10px', background: '#7f1d1d' }}
                    onClick={() => removeGeneratedSceneFromLibrary(scene.libraryId)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <h1 style={{ margin: '0 0 10px', fontSize: '20px', lineHeight: '1.3' }}>{activeTheme}</h1>
          <p style={{ margin: '0 0 14px', fontSize: '14px', lineHeight: '1.45', color: '#d8d8d8' }}>
            {activeIntroText}
          </p>

          {showDissolveControl && (
            <div style={{ marginBottom: showGeneratedRenderModeControl ? '12px' : 0 }}>
              <button className="btn-action" onClick={onToggleDissolve}>
                {isDissolving ? 'Khôi phục (Restore)' : 'Hiệu ứng Dissolve'}
              </button>
            </div>
          )}

          {showGeneratedRenderModeControl && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>Ánh sáng model 3D</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`btn-primary ${generatedRenderMode === 'flat' ? 'active' : ''}`}
                  onClick={() => setGeneratedRenderMode('flat')}
                >
                  Flat
                </button>
                <button
                  className={`btn-primary ${generatedRenderMode === 'studio' ? 'active' : ''}`}
                  onClick={() => setGeneratedRenderMode('studio')}
                >
                  Studio
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...objectPanelStyle, minHeight: 0 }}>
          <h3 style={{ fontSize: '15px', color: '#a78bfa', margin: '0 0 10px' }}>Tạo học liệu AI</h3>
          <textarea
            placeholder="Nhập prompt bài học (VD: Tạo bài học về chuỗi thức ăn đại dương)..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isDirectActionDisabled}
            style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button className="btn-action" style={{ width: '100%', margin: 0, background: isGenerating ? '#475569' : '#10b981' }} onClick={handleGenerate} disabled={isDirectActionDisabled}>
            {isGenerating ? 'Đang xử lý...' : 'Tạo mới'}
          </button>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 8px' }}>Hoặc tải ảnh có sẵn để tạo 3D trực tiếp.</p>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>RealESRGAN trước TRELLIS</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  ['auto', 'Auto'],
                  ['on', 'Bật'],
                  ['off', 'Tắt'],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`btn-primary ${imageEnhanceMode === mode ? 'active' : ''}`}
                    style={{ padding: '6px 10px', fontSize: '12px' }}
                    onClick={() => setImageEnhanceMode(mode)}
                    disabled={isEnhanceModeDisabled}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px 16px', borderRadius: '999px', background: isDirectActionDisabled ? '#334155' : '#0f766e', color: 'white', fontWeight: 700, fontSize: '14px', cursor: isDirectActionDisabled ? 'not-allowed' : 'pointer', opacity: isDirectActionDisabled ? 0.7 : 1, boxSizing: 'border-box' }}>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleDirectUpload3D} disabled={isDirectActionDisabled} style={{ display: 'none' }} />
              {isDirectUploadGenerating ? 'Đang tạo 3D từ ảnh...' : 'Tải ảnh lên để gen 3D'}
            </label>
            {directUploadError && <p style={{ color: '#fca5a5', fontSize: '12px', margin: '8px 0 0' }}>{directUploadError}</p>}
          </div>
        </div>

        {generationStep && <p style={{ fontSize: '12px', color: '#fbbf24', marginTop: '10px' }}>{generationStep}</p>}
      </div>
    </div>
  );
}
