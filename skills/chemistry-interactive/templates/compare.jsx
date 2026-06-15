// TEMPLATE: chemistry-interactive/templates/compare.jsx
// Thay thế:
//   MOL_A_NAME, MOL_A_FORMULA, MOL_A_CID, MOL_A_WEIGHT, MOL_A_DESC
//   MOL_B_NAME, MOL_B_FORMULA, MOL_B_CID, MOL_B_WEIGHT, MOL_B_DESC
//   COMPARE_POINTS: mảng điểm so sánh [{label, a, b}]

import { useState } from "react";

const MOL_A = {
  name: "MOL_A_NAME", formula: "MOL_A_FORMULA",
  cid: MOL_A_CID, weight: "MOL_A_WEIGHT", desc: "MOL_A_DESC",
};
const MOL_B = {
  name: "MOL_B_NAME", formula: "MOL_B_FORMULA",
  cid: MOL_B_CID, weight: "MOL_B_WEIGHT", desc: "MOL_B_DESC",
};
const COMPARE_POINTS = [
  { label: "Công thức", a: "MOL_A_FORMULA", b: "MOL_B_FORMULA" },
  { label: "Khối lượng mol", a: "MOL_A_WEIGHT g/mol", b: "MOL_B_WEIGHT g/mol" },
  // thêm các dòng so sánh phù hợp bên dưới
];

const MODES = ["balls","stick","vdw"];
const MODE_LABELS = { balls:"⚛ Balls", stick:"— Stick", vdw:"● Fill" };

export default function MoleculeCompare() {
  const [modeA, setModeA] = useState("balls");
  const [modeB, setModeB] = useState("balls");

  const MolCard = ({ mol, mode, setMode, accent }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4, flexWrap:"wrap" }}>
        <span style={{ fontSize:17, fontWeight:500, color:"var(--color-text-primary)" }}>{mol.name}</span>
        <span style={{ fontSize:13, fontWeight:500, padding:"2px 9px",
          background: accent === "blue" ? "var(--color-background-info)" : "var(--color-background-warning)",
          color: accent === "blue" ? "var(--color-text-info)" : "var(--color-text-warning)",
          borderRadius:20 }}>{mol.formula}</span>
      </div>
      <p style={{ fontSize:12, color:"var(--color-text-secondary)", margin:"0 0 10px", lineHeight:1.5 }}>
        {mol.desc}
      </p>
      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
        {MODES.map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:"4px 0", fontSize:11, borderRadius:16, cursor:"pointer",
            border: mode===m ? "1.5px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
            background: mode===m ? "var(--color-background-info)" : "var(--color-background-primary)",
            color: mode===m ? "var(--color-text-info)" : "var(--color-text-secondary)",
            fontWeight: mode===m ? 500 : 400,
          }}>{MODE_LABELS[m]}</button>
        ))}
      </div>
      <div style={{ borderRadius:10, overflow:"hidden", border:"0.5px solid var(--color-border-tertiary)" }}>
        <iframe key={`${mol.cid}-${mode}`}
          src={`https://embed.molview.org/v1/?mode=${mode}&cid=${mol.cid}&bg=white`}
          allow="fullscreen" loading="lazy"
          style={{ width:"100%", height:300, border:"none", display:"block" }}
          title={`3D ${mol.name}`} />
      </div>
      <div style={{ display:"flex", gap:6, marginTop:8 }}>
        {[["CID", mol.cid],["Mol", `${mol.weight} g/mol`]].map(([k,v]) => (
          <div key={k} style={{ flex:1, background:"var(--color-background-secondary)", borderRadius:8, padding:"7px 10px" }}>
            <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"sans-serif", padding:"0 0 16px" }}>
      <div style={{ fontSize:13, color:"var(--color-text-tertiary)", marginBottom:14,
        padding:"8px 12px", background:"var(--color-background-secondary)", borderRadius:8 }}>
        So sánh cấu trúc phân tử — xoay 3D bằng chuột, chuyển mode để quan sát khác nhau
      </div>

      {/* Two viewers */}
      <div style={{ display:"flex", gap:14 }}>
        <MolCard mol={MOL_A} mode={modeA} setMode={setModeA} accent="blue" />
        <div style={{ width:"0.5px", background:"var(--color-border-tertiary)", alignSelf:"stretch" }} />
        <MolCard mol={MOL_B} mode={modeB} setMode={setModeB} accent="orange" />
      </div>

      {/* Comparison table */}
      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:8 }}>
          Bảng so sánh
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
              <th style={{ textAlign:"left", padding:"7px 10px", color:"var(--color-text-tertiary)", fontWeight:500, width:"30%" }}>Tính chất</th>
              <th style={{ textAlign:"left", padding:"7px 10px", color:"var(--color-text-info)", fontWeight:500 }}>{MOL_A.name}</th>
              <th style={{ textAlign:"left", padding:"7px 10px", color:"var(--color-text-warning)", fontWeight:500 }}>{MOL_B.name}</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_POINTS.map((row, i) => (
              <tr key={i} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)",
                background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)" }}>
                <td style={{ padding:"8px 10px", color:"var(--color-text-secondary)", fontWeight:500 }}>{row.label}</td>
                <td style={{ padding:"8px 10px", color:"var(--color-text-primary)" }}>{row.a}</td>
                <td style={{ padding:"8px 10px", color:"var(--color-text-primary)" }}>{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
