import { useState } from "react";

const MODES = [
  { id: "balls",     label: "Ball & Stick", icon: "⚛" },
  { id: "stick",     label: "Stick",        icon: "—" },
  { id: "vdw",       label: "Space Fill",   icon: "●" },
  { id: "wireframe", label: "Wireframe",    icon: "⬡" },
];

const INFO = {
  name:    "Cacbon đioxit",
  formula: "CO₂",
  cid:     280,
  weight:  "44.01",
  desc:    "Cacbon đioxit (CO₂) là hợp chất gồm 1 nguyên tử cacbon liên kết đôi với 2 nguyên tử oxi, cấu trúc thẳng (180°). Là sản phẩm của quá trình đốt cháy nhiên liệu và hô hấp tế bào; đóng vai trò quan trọng trong hiệu ứng nhà kính và quang hợp thực vật.",
};

// Màu sắc theo kiểu Jmol: C = xám, O = đỏ
const ATOM_COLORS = { C: "#909090", O: "#FF2200" };

export default function MoleculeViewer() {
  const [mode, setMode] = useState("balls");

  const url = `https://embed.molview.org/v1/?mode=${mode}&cid=${INFO.cid}&bg=white`;

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      maxWidth: 700,
      margin: "0 auto",
      padding: "0 0 20px",
      background: "var(--color-background-primary)",
      borderRadius: 16,
    }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
        padding: "16px 20px 0",
      }}>
        {/* Icon nguyên tử */}
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
        }}>⚛️</div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {INFO.name}
            </span>
            <span style={{
              fontSize: 15, fontWeight: 600, padding: "2px 12px",
              background: "linear-gradient(90deg, #ede9fe, #ddd6fe)",
              color: "#6d28d9", borderRadius: 20,
              letterSpacing: "0.03em",
            }}>
              {INFO.formula}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>
            Carbon Dioxide · PubChem CID {INFO.cid}
          </div>
        </div>

        <div style={{
          background: "var(--color-background-secondary)",
          borderRadius: 10, padding: "6px 14px", textAlign: "center",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 1 }}>Khối lượng mol</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {INFO.weight} <span style={{ fontSize: 11, fontWeight: 400 }}>g/mol</span>
          </div>
        </div>
      </div>

      {/* Mô tả */}
      <p style={{
        fontSize: 13, color: "var(--color-text-secondary)",
        margin: "8px 20px 14px", lineHeight: 1.7,
        padding: "10px 14px",
        background: "var(--color-background-secondary)",
        borderRadius: 10,
        borderLeft: "3px solid #8b5cf6",
      }}>
        {INFO.desc}
      </p>

      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, padding: "0 20px" }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: "6px 16px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              border: mode === m.id
                ? "1.5px solid #8b5cf6"
                : "1px solid var(--color-border-secondary)",
              background: mode === m.id
                ? "linear-gradient(135deg,#ede9fe,#ddd6fe)"
                : "var(--color-background-primary)",
              color: mode === m.id ? "#6d28d9" : "var(--color-text-secondary)",
              fontWeight: mode === m.id ? 600 : 400,
              transition: "all .18s ease",
              boxShadow: mode === m.id ? "0 2px 8px rgba(139,92,246,0.2)" : "none",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* 3D Viewer iframe */}
      <div style={{
        margin: "0 20px",
        borderRadius: 14, overflow: "hidden",
        border: "1px solid var(--color-border-secondary)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        background: "#fff",
      }}>
        <iframe
          key={url}
          src={url}
          allow="fullscreen"
          loading="lazy"
          style={{ width: "100%", height: 400, border: "none", display: "block" }}
          title={`Mô hình 3D ${INFO.name}`}
        />
      </div>

      {/* Thông tin cấu trúc */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, marginTop: 12, padding: "0 20px",
      }}>
        {[
          { label: "Loại liên kết", value: "Đôi C=O×2" },
          { label: "Hình học phân tử", value: "Thẳng (180°)" },
          { label: "Tính phân cực", value: "Không phân cực" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "var(--color-background-secondary)",
            borderRadius: 10, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Màu nguyên tử */}
      <div style={{
        display: "flex", gap: 10, marginTop: 10, padding: "0 20px",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Màu Jmol:</span>
        {Object.entries(ATOM_COLORS).map(([el, color]) => (
          <span key={el} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{
              width: 14, height: 14, borderRadius: "50%",
              background: color, display: "inline-block",
              border: "1px solid rgba(0,0,0,0.15)",
            }} />
            <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{el}</span>
            <span style={{ color: "var(--color-text-tertiary)" }}>({el === "C" ? "Cacbon" : "Oxi"})</span>
          </span>
        ))}
      </div>

    </div>
  );
}
