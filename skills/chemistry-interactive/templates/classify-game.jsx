// TEMPLATE: chemistry-interactive/templates/classify-game.jsx
//
// Game phân loại: hiện 1 PTHH → học sinh bấm chọn loại phản ứng đúng
// (oxi hoá-khử / trao đổi / thế / axit-bazơ...) → phản hồi đúng/sai + giải thích
// → qua câu tiếp theo. Cuối cùng hiện điểm số + "Làm lại" (reshuffle).
//
// OUTPUT: React artifact — create_file vào /mnt/user-data/outputs/{ten-file}.jsx, present_files.
//
// CÁCH THAY DỮ LIỆU — sửa object GAME:
//   categories: [{ id, name }]  — danh sách loại phản ứng (nên 3-5 loại, hiển thị dạng nút)
//   items     : [{ id, equation, categoryId, explanation }]
//     - equation   : PTHH hiển thị (subscript Unicode)
//     - categoryId : phải khớp 1 id trong categories — đây là đáp án đúng
//     - explanation: vì sao thuộc loại này (hiện sau khi học sinh trả lời)
//
// Nên có 8-12 items, rải đều giữa các categories để game không bị lệch.

import { useState } from "react";

const GAME = {
  title: "TITLE",
  subtitle: "SUBTITLE",
  categories: [
    { id: "c1", name: "CATEGORY_1" },
    { id: "c2", name: "CATEGORY_2" },
  ],
  items: [
    { id: "1", equation: "EQUATION_1", categoryId: "c1", explanation: "EXPLANATION_1" },
    { id: "2", equation: "EQUATION_2", categoryId: "c2", explanation: "EXPLANATION_2" },
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ClassifyGame() {
  const [order, setOrder] = useState(() => shuffle(GAME.items.map((_, i) => i)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const finished = index >= order.length;
  const item = !finished ? GAME.items[order[index]] : null;
  const answered = selected !== null;

  const handleSelect = (catId) => {
    if (answered) return;
    setSelected(catId);
    if (catId === item.categoryId) setScore(s => s + 1);
  };
  const next = () => { setSelected(null); setIndex(i => i + 1); };
  const restart = () => {
    setOrder(shuffle(GAME.items.map((_, i) => i)));
    setIndex(0); setSelected(null); setScore(0);
  };

  const catStyle = (cat) => {
    let style = {
      border: "0.5px solid var(--color-border-secondary)",
      background: "var(--color-background-primary)",
      color: "var(--color-text-primary)",
    };
    if (answered) {
      if (cat.id === item.categoryId) {
        style = { border: "1.5px solid var(--color-text-success)", background: "var(--color-background-success)", color: "var(--color-text-success)" };
      } else if (cat.id === selected) {
        style = { border: "1.5px solid var(--color-text-danger)", background: "var(--color-background-danger)", color: "var(--color-text-danger)" };
      }
    }
    return {
      ...style, padding: "12px 10px", borderRadius: 10, fontSize: 13, fontWeight: 500,
      cursor: answered ? "default" : "pointer", textAlign: "center", fontFamily: "sans-serif",
      transition: "all .15s",
    };
  };

  const ratio = order.length ? score / order.length : 0;
  const summaryMsg = ratio >= 0.8 ? "Xuất sắc! 🎉" : ratio >= 0.5 ? "Khá tốt — ôn lại vài dạng nhé!" : "Cần ôn lại các loại phản ứng cơ bản.";

  return (
    <div style={{ fontFamily: "sans-serif", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{GAME.title}</div>
        {GAME.subtitle && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{GAME.subtitle}</div>}
      </div>

      {!finished ? (
        <div>
          {/* Progress */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
            <span>Câu {index + 1}/{order.length}</span>
            <span>Điểm: {score}/{order.length}</span>
          </div>
          <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(index / order.length) * 100}%`, background: "var(--color-text-info)", transition: "width .3s" }} />
          </div>

          {/* Equation card */}
          <div style={{
            border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 14px", marginBottom: 14,
            textAlign: "center", fontSize: 17, fontFamily: "monospace", fontWeight: 600, color: "var(--color-text-primary)",
          }}>{item.equation}</div>

          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10, textAlign: "center" }}>
            Đây là loại phản ứng nào?
          </div>

          {/* Category buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
            {GAME.categories.map(cat => (
              <button key={cat.id} onClick={() => handleSelect(cat.id)} style={catStyle(cat)}>
                {cat.name}
                {answered && cat.id === item.categoryId && " ✓"}
                {answered && cat.id === selected && cat.id !== item.categoryId && " ✗"}
              </button>
            ))}
          </div>

          {/* Explanation + next */}
          {answered && (
            <div>
              <div style={{
                border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 10,
                background: "var(--color-background-secondary)",
              }}>{item.explanation}</div>
              <button onClick={next} style={{
                width: "100%", padding: "10px", fontSize: 13, fontWeight: 500, borderRadius: 10,
                border: "1.5px solid var(--color-text-info)", background: "var(--color-background-info)",
                color: "var(--color-text-info)", cursor: "pointer", fontFamily: "sans-serif",
              }}>
                {index + 1 === order.length ? "Xem kết quả →" : "Câu tiếp theo →"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--color-text-info)", marginBottom: 4 }}>{score}/{order.length}</div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 18 }}>{summaryMsg}</div>
          <button onClick={restart} style={{
            padding: "10px 24px", fontSize: 13, fontWeight: 500, borderRadius: 10,
            border: "1.5px solid var(--color-text-info)", background: "var(--color-background-info)",
            color: "var(--color-text-info)", cursor: "pointer", fontFamily: "sans-serif",
          }}>↺ Làm lại</button>
        </div>
      )}
    </div>
  );
}
