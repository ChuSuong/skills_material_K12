import React from 'react';

export default function ProcessingModal({ isOpen, processing3DObjectId }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.72)', zIndex: 1001,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: '#0f172a', color: 'white', padding: '24px 28px',
        borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.35)',
        textAlign: 'center', minWidth: '320px'
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '22px' }}>Đang tạo mô hình 3D</h2>
        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: '1.5' }}>
          TRELLIS đang xử lý <strong>{processing3DObjectId}</strong>.
        </p>
      </div>
    </div>
  );
}
