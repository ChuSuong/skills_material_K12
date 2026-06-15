// TEMPLATE: chemistry-interactive/templates/pathway.jsx
// Thay thế:
//   REACTION_NAME   — tên phản ứng
//   REACTION_EQ     — phương trình tổng quát
//   STEPS           — mảng các bước (xem cấu trúc bên dưới)

import { useState } from "react";

const REACTION_NAME = "REACTION_NAME";
const REACTION_EQ   = "REACTION_EQ";

// Mỗi step: { title, desc, molecules: [{cid, name, role}], condition, note }
// role: "reactant" | "product" | "catalyst"
const STEPS = [
  {
    title: "Chất tham gia",
    desc:  "STEP_1_DESC",
    molecules: [
      { cid: CID_A, name: "NAME_A", role: "reactant" },
      { cid: CID_B, name: "NAME_B", role: "reactant" },
    ],
    condition: null,
    note: "NOTE_1",
  },
  {
    title: "Điều kiện phản ứng",
    desc:  "STEP_2_DESC",
    molecules: [],
    condition: "CONDITION_TEXT",
    note: "NOTE_2",
  },
  {
    title: "Sản phẩm",
    desc:  "STEP_3_DESC",
    molecules: [
      { cid: CID_C, name: "NAME_C", role: "product" },
    ],
    condition: null,
    note: "NOTE_3",
  },
];

const ROLE_STYLE = {
  reactant: { bg:"var(--color-background-info)",    fg:"var(--color-text-info)",    label:"Chất đầu" },
  product:  { bg:"var(--color-background-success)", fg:"var(--color-text-success)", label:"Sản phẩm" },
  catalyst: { bg:"var(--color-background-warning)", fg:"var(--color-text-warning)", label:"Xúc tác" },
};

export default function ReactionPathway() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div style={{ fontFamily:"sans-serif", padding:"0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:16, fontWeight:500, color:"var(--color-text-primary)" }}>{REACTION_NAME}</div>
        <div style={{ fontSize:13, color:"var(--color-text-secondary)", marginTop:3,
          fontFamily:"monospace", background:"var(--color-background-secondary)",
          padding:"5px 10px", borderRadius:8, display:"inline-block" }}>{REACTION_EQ}</div>
      </div>

      {/* Step pills */}
      <div style={{ display:"flex", gap:0, marginBottom:16, position:"relative" }}>
        {/* connecting line */}
        <div style={{ position:"absolute", top:14, left:14, right:14, height:"0.5px",
          background:"var(--color-border-tertiary)", zIndex:0 }} />
        {STEPS.map((st, i) => (
          <div key={i} onClick={() => setStep(i)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6,
              cursor:"pointer", position:"relative", zIndex:1 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:500,
              border: i === step ? "2px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
              background: i < step ? "var(--color-text-info)" :
                          i === step ? "var(--color-background-info)" : "var(--color-background-primary)",
              color: i < step ? "var(--color-background-primary)" :
                     i === step ? "var(--color-text-info)" : "var(--color-text-tertiary)",
              transition:"all .2s",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize:11, color: i === step ? "var(--color-text-info)" : "var(--color-text-tertiary)",
              textAlign:"center", fontWeight: i === step ? 500 : 400 }}>
              {st.title}
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:14,
        minHeight:200 }}>

        <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 12px", lineHeight:1.6 }}>
          {s.desc}
        </p>

        {/* Condition card */}
        {s.condition && (
          <div style={{ background:"var(--color-background-warning)", border:"0.5px solid var(--color-border-warning)",
            borderRadius:10, padding:"12px 16px", marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text-warning)", marginBottom:4 }}>
              Điều kiện phản ứng
            </div>
            <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>{s.condition}</div>
          </div>
        )}

        {/* Molecule viewers */}
        {s.molecules.length > 0 && (
          <div style={{ display:"flex", gap:10 }}>
            {s.molecules.map((mol, i) => {
              const rs = ROLE_STYLE[mol.role] || ROLE_STYLE.reactant;
              return (
                <div key={i} style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:500, color:"var(--color-text-primary)" }}>{mol.name}</span>
                    <span style={{ fontSize:11, padding:"1px 7px", borderRadius:12,
                      background:rs.bg, color:rs.fg }}>{rs.label}</span>
                  </div>
                  <div style={{ borderRadius:8, overflow:"hidden",
                    border:"0.5px solid var(--color-border-tertiary)", background:"#fff" }}>
                    <iframe src={`https://embed.molview.org/v1/?mode=balls&cid=${mol.cid}&bg=white`}
                      allow="fullscreen" loading="lazy"
                      style={{ width:"100%", height: s.molecules.length > 1 ? 200 : 280,
                        border:"none", display:"block" }}
                      title={`3D ${mol.name}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note */}
        {s.note && (
          <div style={{ marginTop:10, fontSize:12, color:"var(--color-text-tertiary)",
            padding:"6px 10px", borderLeft:"2px solid var(--color-border-secondary)", lineHeight:1.5 }}>
            {s.note}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step === 0}
          style={{ flex:1, padding:"9px", fontSize:13, borderRadius:10, cursor: step===0 ? "default":"pointer",
            border:"0.5px solid var(--color-border-secondary)",
            background:"var(--color-background-primary)", color:"var(--color-text-primary)",
            opacity: step===0 ? 0.4 : 1, fontFamily:"sans-serif" }}>
          ← Quay lại
        </button>
        <button onClick={() => setStep(s => Math.min(STEPS.length-1, s+1))} disabled={step === STEPS.length-1}
          style={{ flex:1, padding:"9px", fontSize:13, borderRadius:10,
            cursor: step===STEPS.length-1 ? "default":"pointer",
            border:"0.5px solid var(--color-border-secondary)",
            background: step===STEPS.length-1 ? "var(--color-background-primary)" : "var(--color-background-info)",
            color: step===STEPS.length-1 ? "var(--color-text-primary)" : "var(--color-text-info)",
            opacity: step===STEPS.length-1 ? 0.4 : 1, fontFamily:"sans-serif", fontWeight:500 }}>
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
