// TEMPLATE: chemistry-interactive/templates/viewer.jsx
// Thay thế các biến sau trước khi dùng:
//   MOLECULE_NAME    — tên tiếng Việt (vd: "Nước")
//   MOLECULE_FORMULA — công thức hiển thị (vd: "H₂O")
//   MOLECULE_CID     — PubChem CID (vd: 962)
//   MOLECULE_WEIGHT  — khối lượng mol (vd: "18.02")
//   MOLECULE_DESC    — mô tả ngắn 1-2 câu cho học sinh

import { useState } from "react";

const MODES = [
  { id: "balls",     label: "Ball & Stick", icon: "⚛" },
  { id: "stick",     label: "Stick",        icon: "—" },
  { id: "vdw",       label: "Space Fill",   icon: "●" },
  { id: "wireframe", label: "Wireframe",    icon: "⬡" },
];

const INFO = {
  name:    "MOLECULE_NAME",
  formula: "MOLECULE_FORMULA",
  cid:     MOLECULE_CID,
  weight:  "MOLECULE_WEIGHT",
  desc:    "MOLECULE_DESC",
};

export default function MoleculeViewer() {
  const [mode, setMode] = useState("balls");

  const url = `https://embed.molview.org/v1/?mode=${mode}&cid=${INFO.cid}&bg=white`;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 680, margin: "0 auto", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {INFO.name}
        </span>
        <span style={{
          fontSize: 15, fontWeight: 500, padding: "2px 10px",
          background: "var(--color-background-info)", color: "var(--color-text-info)",
          borderRadius: 20,
        }}>
          {INFO.formula}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
          M = {INFO.weight} g/mol
        </span>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
        {INFO.desc}
      </p>

      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: "5px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              border: mode === m.id
                ? "1.5px solid var(--color-text-info)"
                : "0.5px solid var(--color-border-secondary)",
              background: mode === m.id
                ? "var(--color-background-info)"
                : "var(--color-background-primary)",
              color: mode === m.id
                ? "var(--color-text-info)"
                : "var(--color-text-secondary)",
              fontWeight: mode === m.id ? 500 : 400,
              transition: "all .15s",
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* 3D Viewer iframe */}
      <div style={{
        borderRadius: 12, overflow: "hidden",
        border: "0.5px solid var(--color-border-tertiary)",
        background: "#fff",
      }}>
        <iframe
          key={url}
          src={url}
          allow="fullscreen"
          loading="lazy"
          style={{ width: "100%", height: 380, border: "none", display: "block" }}
          title={`Mô hình 3D ${INFO.name}`}
        />
      </div>

      {/* Footer info */}
      <div style={{
        display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap",
      }}>
        {[
          ["PubChem CID", INFO.cid],
          ["Khối lượng mol", `${INFO.weight} g/mol`],
          ["Chế độ xem", MODES.find(m => m.id === mode)?.label],
        ].map(([label, val]) => (
          <div key={label} style={{
            flex: 1, minWidth: 140,
            background: "var(--color-background-secondary)",
            borderRadius: 8, padding: "8px 12px",
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {val}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
