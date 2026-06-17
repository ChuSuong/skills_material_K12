import React from 'react';
import confetti from 'canvas-confetti';

function shakeScreen() {
  document.body.style.transform = 'translate(5px, 0)';
  setTimeout(() => { document.body.style.transform = 'translate(-5px, 0)'; }, 50);
  setTimeout(() => { document.body.style.transform = 'translate(5px, 0)'; }, 100);
  setTimeout(() => { document.body.style.transform = 'translate(-5px, 0)'; }, 150);
  setTimeout(() => { document.body.style.transform = 'translate(0, 0)'; }, 200);
}

function handleQuizAnswer(selectedInfo, answer) {
  if (answer === selectedInfo.quiz.correctAnswer) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    alert('Chính xác! 🎉');
    return;
  }

  shakeScreen();
}

export default function SceneInfoPanel({ selectedInfo, isDissolving, onClose }) {
  if (!selectedInfo || isDissolving) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute', top: '20px', right: '20px', bottom: '20px', width: '380px',
      background: 'rgba(15, 23, 42, 0.85)', color: 'white', padding: '24px',
      borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 10,
      display: 'flex', flexDirection: 'column',
      backdropFilter: 'blur(16px)', border: '1px solid rgba(139, 92, 246, 0.3)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflowY: 'auto'
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '24px' }}>
        {selectedInfo.title || 'Thông tin chi tiết'}
      </h2>

      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 24px 0', fontSize: '16px', lineHeight: '1.6', color: '#f8fafc' }}>
          {selectedInfo.description || selectedInfo.info}
        </p>

        {selectedInfo.quiz && (
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '16px' }}>📝 Câu hỏi ôn tập</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '15px' }}>{selectedInfo.quiz.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedInfo.quiz.answers.map((answer, idx) => (
                <button
                  key={idx}
                  className="btn-primary"
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'rgba(71, 85, 105, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                  }}
                  onClick={() => handleQuizAnswer(selectedInfo, answer)}
                >
                  {answer}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={onClose} className="btn-action" style={{ marginTop: '24px', width: '100%' }}>
        Đóng
      </button>
    </div>
  );
}
