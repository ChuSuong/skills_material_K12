// TEMPLATE: chemistry-interactive/templates/quiz.jsx
// Thay thế QUESTIONS: mảng câu hỏi với cấu trúc bên dưới
// Mỗi câu hỏi có thể có mol_cid để hiển thị phân tử kèm câu hỏi

import { useState } from "react";

const QUESTIONS = [
  {
    id: 1,
    question: "QUESTION_TEXT",
    mol_cid: null,          // CID nếu muốn hiện phân tử, null nếu không
    mol_name: "",
    options: ["A. ...", "B. ...", "C. ...", "D. ..."],
    correct: 0,             // index đáp án đúng (0-3)
    explanation: "EXPLANATION_TEXT",
    difficulty: "medium",   // easy | medium | hard
  },
  // thêm câu hỏi...
];

const DIFF_COLOR = {
  easy:   { bg:"var(--color-background-success)", fg:"var(--color-text-success)", label:"Dễ" },
  medium: { bg:"var(--color-background-warning)",  fg:"var(--color-text-warning)",  label:"Trung bình" },
  hard:   { bg:"var(--color-background-danger)",   fg:"var(--color-text-danger)",   label:"Khó" },
};

export default function ChemQuiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);

  const q = QUESTIONS[current];
  const answered = selected !== null;
  const correct = selected === q.correct;
  const diff = DIFF_COLOR[q.difficulty] || DIFF_COLOR.medium;

  const handleSelect = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswers(prev => ({ ...prev, [current]: i }));
  };

  const handleNext = () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
      setSelected(answers[current + 1] ?? null);
    } else {
      setShowResult(true);
    }
  };

  const score = Object.entries(answers).filter(([i, a]) => QUESTIONS[+i].correct === a).length;

  if (showResult) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div style={{ fontFamily:"sans-serif", padding:"0 0 16px" }}>
        <div style={{ textAlign:"center", padding:"28px 16px" }}>
          <div style={{ fontSize:48, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1 }}>{pct}%</div>
          <div style={{ fontSize:15, color:"var(--color-text-secondary)", margin:"8px 0 4px" }}>
            {score}/{QUESTIONS.length} câu đúng
          </div>
          <div style={{ fontSize:13, color:"var(--color-text-tertiary)" }}>
            {pct >= 80 ? "Xuất sắc! Bạn nắm vững chủ đề này." :
             pct >= 60 ? "Khá tốt! Ôn lại những câu sai nhé." :
             "Cần ôn tập thêm. Xem lại lý thuyết và thử lại."}
          </div>
          <button onClick={() => { setCurrent(0); setSelected(null); setAnswers({}); setShowResult(false); }}
            style={{ marginTop:20, padding:"8px 24px", fontSize:13, borderRadius:20, cursor:"pointer",
              border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)",
              color:"var(--color-text-primary)", fontFamily:"sans-serif" }}>
            Làm lại
          </button>
        </div>
        {/* Review */}
        {QUESTIONS.map((qq, i) => {
          const ua = answers[i];
          const ok = ua === qq.correct;
          return (
            <div key={i} style={{ marginBottom:10, padding:"10px 14px", borderRadius:10,
              border:`0.5px solid ${ok ? "var(--color-border-success)" : "var(--color-border-danger)"}`,
              background: ok ? "var(--color-background-success)" : "var(--color-background-danger)" }}>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>
                {i+1}. {qq.question}
              </div>
              <div style={{ fontSize:12, color: ok ? "var(--color-text-success)" : "var(--color-text-danger)" }}>
                {ok ? "✓ Đúng" : `✗ Sai — Đáp án đúng: ${qq.options[qq.correct]}`}
              </div>
              <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:4 }}>{qq.explanation}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"sans-serif", padding:"0 0 16px" }}>
      {/* Progress */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, height:4, background:"var(--color-border-tertiary)", borderRadius:4 }}>
          <div style={{ height:"100%", borderRadius:4, background:"var(--color-text-info)",
            width:`${((current+1)/QUESTIONS.length)*100}%`, transition:"width .3s" }} />
        </div>
        <span style={{ fontSize:12, color:"var(--color-text-tertiary)", whiteSpace:"nowrap" }}>
          {current+1} / {QUESTIONS.length}
        </span>
        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:12,
          background:diff.bg, color:diff.fg }}>{diff.label}</span>
      </div>

      {/* Molecule preview (nếu có) */}
      {q.mol_cid && (
        <div style={{ borderRadius:10, overflow:"hidden", border:"0.5px solid var(--color-border-tertiary)",
          marginBottom:12, background:"#fff" }}>
          <iframe src={`https://embed.molview.org/v1/?mode=balls&cid=${q.mol_cid}&bg=white`}
            allow="fullscreen" loading="lazy"
            style={{ width:"100%", height:220, border:"none", display:"block" }}
            title={q.mol_name} />
          {q.mol_name && (
            <div style={{ padding:"6px 12px", fontSize:12, color:"var(--color-text-secondary)",
              borderTop:"0.5px solid var(--color-border-tertiary)" }}>{q.mol_name}</div>
          )}
        </div>
      )}

      {/* Question */}
      <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", marginBottom:14, lineHeight:1.5 }}>
        {q.question}
      </div>

      {/* Options */}
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === q.correct;
          let bg = "var(--color-background-primary)";
          let border = "var(--color-border-secondary)";
          let color = "var(--color-text-primary)";
          if (answered) {
            if (isCorrect)       { bg = "var(--color-background-success)"; border = "var(--color-border-success)"; color = "var(--color-text-success)"; }
            else if (isSelected) { bg = "var(--color-background-danger)";  border = "var(--color-border-danger)";  color = "var(--color-text-danger)"; }
          } else if (isSelected) {
            bg = "var(--color-background-info)"; border = "var(--color-border-info)"; color = "var(--color-text-info)";
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} style={{
              textAlign:"left", padding:"10px 14px", borderRadius:10, cursor: answered ? "default" : "pointer",
              border:`0.5px solid ${border}`, background:bg, color, fontSize:13, fontFamily:"sans-serif",
              display:"flex", alignItems:"center", gap:10, transition:"all .15s",
            }}>
              <span style={{ width:22, height:22, borderRadius:"50%", border:`0.5px solid ${border}`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0,
                background: isSelected || (answered && isCorrect) ? border : "transparent",
                color: (isSelected || (answered && isCorrect)) ? "var(--color-background-primary)" : border,
              }}>
                {answered && isCorrect ? "✓" : answered && isSelected ? "✗" : String.fromCharCode(65+i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:14,
          background: correct ? "var(--color-background-success)" : "var(--color-background-danger)",
          border:`0.5px solid ${correct ? "var(--color-border-success)" : "var(--color-border-danger)"}` }}>
          <div style={{ fontSize:13, fontWeight:500,
            color: correct ? "var(--color-text-success)" : "var(--color-text-danger)", marginBottom:4 }}>
            {correct ? "✓ Chính xác!" : "✗ Chưa đúng"}
          </div>
          <div style={{ fontSize:13, color:"var(--color-text-primary)", lineHeight:1.6 }}>{q.explanation}</div>
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button onClick={handleNext} style={{
          width:"100%", padding:"10px", fontSize:13, borderRadius:10, cursor:"pointer",
          border:"0.5px solid var(--color-border-secondary)",
          background:"var(--color-background-primary)", color:"var(--color-text-primary)",
          fontFamily:"sans-serif", fontWeight:500,
        }}>
          {current < QUESTIONS.length - 1 ? "Câu tiếp theo →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}
