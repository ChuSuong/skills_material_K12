// TEMPLATE: chemistry-interactive/templates/virtual-lab.jsx
//
// "Phòng thí nghiệm ảo" — bản 2D NÂNG CẤP (xem trực tiếp trong chat dưới dạng artifact).
// - Lưới chọn hoá chất kiểu "ô vuông" + 2 "Ống" có thể bấm để gán
// - Cốc vẽ bằng CSS trông giống thuỷ tinh hơn (bo góc, vòi rót, ánh sáng kính, mặt cong)
// - Animation "đổ chất": hạt rơi từ trên xuống + mực chất lỏng dâng lên khi Trộn
//
// Có 1 bản TƯƠNG ĐƯƠNG dạng 3D thật (Three.js, cốc xoay được) ở `virtual-lab.html` —
// CHỈ chạy được khi mở bằng browser thật (artifact sandbox chặn WebGL). 2 bản dùng
// CHUNG cấu trúc data `LAB` bên dưới — sửa 1 lần, áp dụng cho cả 2 file.
//
// OUTPUT: React artifact — create_file vào /mnt/user-data/outputs/{ten-file}.jsx, present_files.
//
// CÁCH THAY DỮ LIỆU — sửa object LAB:
//   reagents : [{ id, name, formula, color }]
//     - color: màu hex hiển thị trong cốc. Dung dịch không màu → dùng "#eef2f7".
//   reactions: [{ pair:[id1,id2], equation, phenomenon, effect, resultColor, explanation }]
//     - pair  : 2 id reagent (thứ tự không quan trọng — UI tự khớp cả 2 chiều)
//     - effect: "precipitate" (kết tủa - hạt lắng đáy) | "gas" (sủi bọt khí - bong bóng)
//               | "color-change" | "none" (không hiện tượng rõ, vd trung hoà)
//   noReactionMessage: hiển thị tự động cho mọi cặp KHÔNG có trong `reactions`.
//
// Nên chọn 3-5 reagents sao cho có ít nhất 1 cặp kết tủa, 1 cặp sủi khí, và 1-2 cặp
// không phản ứng — giúp học sinh tự khám phá quy luật phản ứng trao đổi.

import { useState } from "react";

const LAB = {
  title: "TITLE",
  subtitle: "SUBTITLE",
  reagents: [
    { id: "r1", name: "NAME_1", formula: "FORMULA_1", color: "#eef2f7" },
    { id: "r2", name: "NAME_2", formula: "FORMULA_2", color: "#eef2f7" },
  ],
  reactions: [
    { pair: ["r1", "r2"], equation: "EQUATION", phenomenon: "PHENOMENON", effect: "none", resultColor: "#eef2f7", explanation: "EXPLANATION" },
  ],
  noReactionMessage: "Không có phản ứng xảy ra giữa 2 dung dịch này.",
};

function Beaker({ color, liquidPct, label, sublabel, large, bubbling, precipitating, pour, mixKey }) {
  const w = large ? 92 : 60;
  const h = large ? 110 : 78;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: w, height: h + 10 }}>
        {/* hạt rơi khi đổ */}
        {pour && Array.from({ length: 7 }).map((_, i) => (
          <div key={`${mixKey}-${i}`} style={{
            position: "absolute", top: -28, left: 8 + (i % 4) * (w - 16) / 3, width: 4, height: 4,
            borderRadius: "50%", background: "var(--color-text-tertiary)",
            animation: `fallDrop .8s ease-in ${i * 0.05}s forwards`,
          }} />
        ))}
        {/* vòi cốc */}
        <div style={{
          position: "absolute", top: -2, right: w * 0.08, width: 16, height: 10,
          borderTop: "2px solid var(--color-border-secondary)", borderRight: "2px solid var(--color-border-secondary)",
          borderRadius: "0 6px 0 0", transform: "rotate(18deg)",
        }} />
        {/* thân cốc */}
        <div style={{
          position: "absolute", top: 6, left: 0, right: 0, bottom: 0,
          border: "2px solid var(--color-border-secondary)", borderTop: "none",
          borderRadius: "5px 5px 18px 18px", overflow: "hidden", background: "var(--color-background-primary)",
        }}>
          {/* chất lỏng */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: `${liquidPct}%`,
            background: color, borderRadius: "50% 50% 0 0 / 9px 9px 0 0",
            transition: "height .9s cubic-bezier(.2,.8,.2,1), background .6s",
          }}>
            {bubbling && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: 6 + i * (w / 7), bottom: 2, width: 6, height: 6, borderRadius: "50%",
                background: "rgba(255,255,255,0.85)", animation: `bubbleRise 1.${4 + i}s ease-in ${i * 0.2}s infinite`,
              }} />
            ))}
            {precipitating && Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute", left: 4 + (i % 5) * (w / 6), bottom: 1 + Math.floor(i / 5) * 6,
                width: 5, height: 5, borderRadius: "50%", background: "rgba(0,0,0,0.28)",
              }} />
            ))}
          </div>
          {/* ánh sáng kính */}
          <div style={{ position: "absolute", top: 3, bottom: 3, left: 4, width: 5, borderRadius: 4, background: "linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.05))" }} />
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</div>
      {sublabel && <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center", maxWidth: w + 20 }}>{sublabel}</div>}
    </div>
  );
}

export default function VirtualLab() {
  const [slots, setSlots] = useState([LAB.reagents[0].id, LAB.reagents[1].id]);
  const [active, setActive] = useState(0);
  const [mixed, setMixed] = useState(false);
  const [mixKey, setMixKey] = useState(0);

  const reagentById = (id) => LAB.reagents.find(r => r.id === id);
  const findReaction = () => LAB.reactions.find(r =>
    (r.pair[0] === slots[0] && r.pair[1] === slots[1]) || (r.pair[0] === slots[1] && r.pair[1] === slots[0])
  );
  const reaction = mixed ? findReaction() : null;
  const sameReagent = slots[0] === slots[1];

  const selectReagent = (id) => {
    setSlots(s => s.map((v, i) => i === active ? id : v));
    setMixed(false);
    setActive(a => (a + 1) % 2);
  };

  const toggleMix = () => {
    if (sameReagent) return;
    if (!mixed) setMixKey(k => k + 1);
    setMixed(m => !m);
  };

  const slotStyle = (i) => ({
    flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
    border: active === i ? "1.5px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
    background: active === i ? "var(--color-background-info)" : "var(--color-background-primary)",
    cursor: "pointer",
  });

  const tileStyle = (r) => {
    const isInSlots = slots.includes(r.id);
    return {
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px",
      borderRadius: 10, cursor: "pointer", fontFamily: "sans-serif", fontSize: 11, fontWeight: 500,
      border: isInSlots ? "1.5px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
      background: isInSlots ? "var(--color-background-info)" : "var(--color-background-primary)",
      color: "var(--color-text-primary)",
    };
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{LAB.title}</div>
        {LAB.subtitle && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{LAB.subtitle}</div>}
      </div>

      {/* 2 ống đang chọn */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[0, 1].map(i => (
          <div key={i} onClick={() => setActive(i)} style={slotStyle(i)}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: reagentById(slots[i]).color, border: "1px solid var(--color-border-secondary)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Ống {i + 1}: <strong style={{ color: "var(--color-text-primary)" }}>{reagentById(slots[i]).formula}</strong></span>
          </div>
        ))}
      </div>

      {/* Lưới chọn hoá chất */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>
        {LAB.reagents.map(r => (
          <button key={r.id} onClick={() => selectReagent(r.id)} style={tileStyle(r)}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: r.color, border: "1px solid var(--color-border-secondary)" }} />
            {r.formula}
          </button>
        ))}
      </div>

      {/* Cốc */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <Beaker color={reagentById(slots[0]).color} liquidPct={62} label={reagentById(slots[0]).formula} />
        <div style={{ fontSize: 20, color: "var(--color-text-tertiary)", paddingBottom: 30 }}>+</div>
        <Beaker color={reagentById(slots[1]).color} liquidPct={62} label={reagentById(slots[1]).formula} />
        <div style={{ fontSize: 20, color: "var(--color-text-tertiary)", paddingBottom: 30 }}>→</div>
        <Beaker
          color={mixed ? (reaction ? reaction.resultColor : "var(--color-background-secondary)") : "var(--color-background-secondary)"}
          liquidPct={mixed ? 68 : 0}
          label={mixed ? (reaction ? "Sản phẩm" : "Không hiện tượng") : "?"}
          large pour={mixed} mixKey={mixKey}
          bubbling={mixed && reaction?.effect === "gas"}
          precipitating={mixed && reaction?.effect === "precipitate"}
        />
      </div>

      {sameReagent ? (
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-warning)", marginBottom: 4 }}>
          Chọn 2 dung dịch khác nhau để trộn
        </div>
      ) : (
        <button onClick={toggleMix} style={{
          display: "block", width: "100%", padding: "10px", fontSize: 13, fontWeight: 500, borderRadius: 10,
          border: "1.5px solid var(--color-text-info)", background: "var(--color-background-info)",
          color: "var(--color-text-info)", cursor: "pointer", fontFamily: "sans-serif",
        }}>
          {mixed ? "↺ Làm lại" : "⚗️ Trộn"}
        </button>
      )}

      {mixed && !sameReagent && (
        <div style={{ marginTop: 14, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 14, background: "var(--color-background-secondary)" }}>
          {reaction ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-info)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>Hiện tượng</div>
              <div style={{ fontSize: 13, color: "var(--color-text-primary)", marginBottom: 10 }}>{reaction.phenomenon}</div>
              <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 600, color: "var(--color-text-primary)", background: "var(--color-background-primary)", padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>{reaction.equation}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{reaction.explanation}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center" }}>{LAB.noReactionMessage}</div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bubbleRise {
          0% { transform: translateY(0); opacity: 0.9; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
        @keyframes fallDrop {
          0% { transform: translateY(0); opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateY(70px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
