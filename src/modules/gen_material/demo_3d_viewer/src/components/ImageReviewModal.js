import React from 'react';

export default function ImageReviewModal({
  confirmingImage,
  pendingImages,
  isImageActionDisabled,
  handleUploadImage,
  isUploadingImage,
  uploadError,
  handleConfirmImage,
  isConfirming3D,
}) {
  if (!confirmingImage) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px'
    }}>
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', width: 'min(500px, 100%)', maxHeight: 'calc(100vh - 32px)', textAlign: 'center', border: '1px solid #38bdf8', overflowY: 'auto' }}>
        <h2 style={{ color: 'white', margin: '0 0 16px' }}>Duyệt thiết kế 2D</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '20px' }}>AI đã tạo xong hình ảnh cho <strong>{confirmingImage.id}</strong>. Bạn có muốn chuyển ảnh này thành mô hình 3D không?</p>
        {pendingImages.length > 1 && (
          <p style={{ color: '#fbbf24', marginTop: '-8px', marginBottom: '20px', fontSize: '13px' }}>
            Sau đối tượng này, hệ thống sẽ tiếp tục duyệt {pendingImages.length - 1} đối tượng còn lại trong scene.
          </p>
        )}

        <div style={{ width: '100%', minHeight: '180px', maxHeight: '45vh', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', marginBottom: '20px', overflow: 'hidden' }}>
          <img src={confirmingImage.imageUrl} alt={confirmingImage.id} style={{ maxWidth: '100%', maxHeight: '45vh', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <div style={{ display: 'none' }}>[Ảnh {confirmingImage.id}]<br />{confirmingImage.imageUrl}</div>
        </div>

        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 8px' }}>Hoặc dùng ảnh có sẵn của bạn để tạo 3D cho đối tượng này.</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px 16px', borderRadius: '999px', background: isImageActionDisabled ? '#334155' : '#0f766e', color: 'white', fontWeight: 700, fontSize: '14px', cursor: isImageActionDisabled ? 'not-allowed' : 'pointer', opacity: isImageActionDisabled ? 0.7 : 1 }}>
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleUploadImage} disabled={isImageActionDisabled} style={{ display: 'none' }} />
            {isUploadingImage ? '⏳ Đang tải ảnh lên...' : '📁 Chọn ảnh có sẵn'}
          </label>
          {uploadError && <p style={{ color: '#fca5a5', fontSize: '12px', margin: '8px 0 0' }}>{uploadError}</p>}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', position: 'sticky', bottom: 0, background: '#1e293b', paddingTop: '8px' }}>
          <button className="btn-action" style={{ background: '#ef4444', margin: 0, opacity: isImageActionDisabled ? 0.6 : 1 }} onClick={() => handleConfirmImage(false)} disabled={isImageActionDisabled}>❌ Vẽ lại ảnh khác</button>
          <button className="btn-action" style={{ background: '#10b981', margin: 0, opacity: isImageActionDisabled ? 0.8 : 1 }} onClick={() => handleConfirmImage(true)} disabled={isImageActionDisabled}>{isConfirming3D ? '⏳ Đang tạo 3D...' : '✅ Duyệt & Tạo 3D'}</button>
        </div>
      </div>
    </div>
  );
}
