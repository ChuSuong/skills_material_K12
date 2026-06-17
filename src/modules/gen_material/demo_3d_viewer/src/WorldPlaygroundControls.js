import React from 'react';

export default function WorldPlaygroundControls({
  worldModePrompt,
  setWorldModePrompt,
  isWorldActionDisabled,
  isWorldPanoGenerating,
  isWorldPanoUploadGenerating,
  handleGenerateWorldPano,
  handleGenerateWorldPanoFromUpload,
  openWorldPanoViewer,
  isWorldPanoViewerOpen,
  worldPanoViewerUrl,
  worldPanoImageUrl,
  worldError,
}) {
  return (
    <div>
      <h3 style={{ fontSize: '15px', color: '#60a5fa', margin: '0 0 10px' }}>WorldGen pano viewer</h3>
      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 8px' }}>Chế độ này chỉ tạo panorama 360 và mở pano HTML viewer của WorldGen, không dựng scene 3D trong app.</p>
      <textarea
        placeholder="Nhập prompt scene WorldGen (VD: một không gian lớp học khoa học viễn tưởng)..."
        value={worldModePrompt}
        onChange={e => setWorldModePrompt(e.target.value)}
        disabled={isWorldActionDisabled}
        style={{ width: '100%', height: '70px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '10px' }}
      />
      <button
        className="btn-action"
        style={{ width: '100%', margin: '10px 0 0', background: isWorldPanoGenerating ? '#475569' : '#7c3aed' }}
        onClick={handleGenerateWorldPano}
        disabled={isWorldActionDisabled}
      >
        {isWorldPanoGenerating ? 'Đang tạo pano 360...' : 'Tạo pano 360 từ prompt'}
      </button>
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '10px 16px',
          borderRadius: '999px',
          background: isWorldActionDisabled ? '#334155' : '#10b981',
          color: 'white',
          fontWeight: 700,
          fontSize: '14px',
          cursor: isWorldActionDisabled ? 'not-allowed' : 'pointer',
          opacity: isWorldActionDisabled ? 0.7 : 1,
          marginTop: '15px',
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleGenerateWorldPanoFromUpload}
          disabled={isWorldActionDisabled}
          style={{ display: 'none' }}
        />
        {isWorldPanoUploadGenerating ? 'Đang tạo pano 360 từ ảnh...' : 'Tải ảnh lên để gen pano 360'}
      </label>
      {worldPanoViewerUrl && (
        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="btn-action"
            style={{ width: '100%', margin: 0, background: isWorldPanoViewerOpen ? '#475569' : '#0f766e' }}
            onClick={openWorldPanoViewer}
            disabled={isWorldPanoViewerOpen}
          >
            {isWorldPanoViewerOpen ? 'Đang mở pano HTML' : 'Mở pano HTML trong app'}
          </button>
          <a href={worldPanoViewerUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#93c5fd', textAlign: 'center' }}>
            Mở viewer ở tab mới
          </a>
          {worldPanoImageUrl && (
            <a href={worldPanoImageUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#93c5fd', textAlign: 'center' }}>
              Mở ảnh pano gốc
            </a>
          )}
        </div>
      )}
      {worldError && <p style={{ color: '#fca5a5', fontSize: '12px', margin: '8px 0 0' }}>{worldError}</p>}
    </div>
  );
}
