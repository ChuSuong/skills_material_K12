// TEMPLATE: chemistry-interactive/templates/equation-balancer.jsx
//
// 2 chế độ trong 1 file:
//  (1) Cân bằng phương trình — học sinh chỉnh hệ số (1-9), kiểm tra cân bằng nguyên tố real-time
//  (2) Tính theo phương trình — cho 1 đại lượng (khối lượng/mol/thể tích), tính các chất còn lại
//
// OUTPUT: React artifact — create_file vào /mnt/user-data/outputs/{ten-file}.jsx, present_files.
//
// CÁCH THAY DỮ LIỆU — sửa object DATA bên dưới:
//
// balance.compounds: [{ formula, side, correctCoef }]
//   - formula    : công thức ASCII thường (vd "C2H5OH", "Ca(OH)2") — dùng để parse nguyên tố
//   - side       : "reactant" | "product"
//   - correctCoef: hệ số đúng (dùng cho nút "Xem đáp án")
//
// stoich.compounds: [{ formula, side, coef, unit }]
//   - coef : hệ số đã cân bằng của chất này trong PTHH
//   - unit : "g" (khối lượng) | "L" (thể tích khí, đktc) | "mol"
// stoich.given: { formula, value, unit }  — đại lượng đã biết (formula phải khớp 1 compound trên)
//
// Công thức chỉ cần gõ thường (C2H5OH) — UI tự hiển thị subscript (C₂H₅OH).
// Hỗ trợ ngoặc đơn 1 cấp/nhiều cấp: Ca(OH)2, (NH4)2SO4.

import { useState } from "react";

const DATA = {
  title: "TITLE",
  subtitle: "SUBTITLE",
  balance: {
    label: "BALANCE_LABEL",
    compounds: [
      { formula: "FORMULA_1", side: "reactant", correctCoef: 1 },
      { formula: "FORMULA_2", side: "reactant", correctCoef: 1 },
      { formula: "FORMULA_3", side: "product", correctCoef: 1 },
      { formula: "FORMULA_4", side: "product", correctCoef: 1 },
    ],
  },
  stoich: {
    label: "STOICH_LABEL",
    compounds: [
      { formula: "FORMULA_1", side: "reactant", coef: 1, unit: "g" },
      { formula: "FORMULA_2", side: "reactant", coef: 1, unit: "g" },
      { formula: "FORMULA_3", side: "product", coef: 1, unit: "g" },
      { formula: "FORMULA_4", side: "product", coef: 1, unit: "L" },
    ],
    given: { formula: "FORMULA_1", value: 1, unit: "g" },
  },
};

// ===== Bảng nguyên tử khối (THPT) =====
const ATOMIC_WEIGHT = {
  H: 1, Li: 7, C: 12, N: 14, O: 16, F: 19, Na: 23, Mg: 24, Al: 27, Si: 28,
  P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56, Cu: 64,
  Zn: 65, Br: 80, Ag: 108, Sn: 119, I: 127, Ba: 137, Pb: 207,
};

// ===== Parser công thức (hỗ trợ ngoặc lồng) =====
function parseFormula(f) {
  let i = 0;
  function group() {
    const counts = {};
    while (i < f.length && f[i] !== ")") {
      if (f[i] === "(") {
        i++;
        const inner = group();
        i++; // skip ')'
        let num = "";
        while (i < f.length && /[0-9]/.test(f[i])) { num += f[i]; i++; }
        const mult = num ? parseInt(num, 10) : 1;
        for (const el in inner) counts[el] = (counts[el] || 0) + inner[el] * mult;
      } else {
        let el = f[i]; i++;
        while (i < f.length && /[a-z]/.test(f[i])) { el += f[i]; i++; }
        let num = "";
        while (i < f.length && /[0-9]/.test(f[i])) { num += f[i]; i++; }
        counts[el] = (counts[el] || 0) + (num ? parseInt(num, 10) : 1);
      }
    }
    return counts;
  }
  return group();
}

function molarMass(f) {
  const c = parseFormula(f);
  return Object.entries(c).reduce((s, [el, n]) => s + (ATOMIC_WEIGHT[el] || 0) * n, 0);
}

const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const disp = (f) => f.split("").map(ch => SUB[ch] ?? ch).join("");

function Stepper({ value, onChange }) {
  const btn = {
    width: 22, height: 22, borderRadius: "50%", border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)", color: "var(--color-text-secondary)",
    fontSize: 14, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button style={{ ...btn, opacity: value <= 1 ? 0.35 : 1 }} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span style={{ width: 16, textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--color-text-info)" }}>{value}</span>
      <button style={{ ...btn, opacity: value >= 9 ? 0.35 : 1 }} disabled={value >= 9} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export default function EquationBalancer() {
  const [tab, setTab] = useState("balance");
  const [coefs, setCoefs] = useState(DATA.balance.compounds.map(() => 1));
  const [givenValue, setGivenValue] = useState(DATA.stoich.given.value);
  const [showSolution, setShowSolution] = useState(false);

  const setCoef = (idx, val) => setCoefs(cs => cs.map((c, i) => i === idx ? Math.max(1, Math.min(9, val)) : c));
  const resetCoefs = () => setCoefs(DATA.balance.compounds.map(() => 1));
  const showAnswer = () => setCoefs(DATA.balance.compounds.map(c => c.correctCoef));

  const elements = [...new Set(DATA.balance.compounds.flatMap(c => Object.keys(parseFormula(c.formula))))];
  const sideSum = (side, el) => DATA.balance.compounds.reduce((s, c, i) => {
    if (c.side !== side) return s;
    return s + (parseFormula(c.formula)[el] || 0) * coefs[i];
  }, 0);
  const isBalanced = elements.every(el => sideSum("reactant", el) === sideSum("product", el));

  // ---- Stoich ----
  const stoich = DATA.stoich;
  const given = stoich.given;
  const givenCompound = stoich.compounds.find(c => c.formula === given.formula);
  const molGiven = given.unit === "g" ? givenValue / molarMass(given.formula)
    : given.unit === "L" ? givenValue / 22.4
    : givenValue;
  const results = stoich.compounds.filter(c => c.formula !== given.formula).map(c => {
    const mol = molGiven * (c.coef / givenCompound.coef);
    let value, unitLabel;
    if (c.unit === "g") { value = mol * molarMass(c.formula); unitLabel = "g"; }
    else if (c.unit === "L") { value = mol * 22.4; unitLabel = "L (đktc)"; }
    else { value = mol; unitLabel = "mol"; }
    return { ...c, mol, value, unitLabel };
  });

  const pillStyle = (on, color = "info") => ({
    padding: "5px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer",
    border: on ? `1.5px solid var(--color-text-${color})` : "0.5px solid var(--color-border-secondary)",
    background: on ? `var(--color-background-${color})` : "var(--color-background-primary)",
    color: on ? `var(--color-text-${color})` : "var(--color-text-secondary)",
    fontWeight: on ? 500 : 400,
  });

  const EquationLine = ({ compounds, coefFor, interactive }) => {
    const reactants = compounds.filter(c => c.side === "reactant");
    const products = compounds.filter(c => c.side === "product");
    const Compound = (c) => {
      const idx = compounds.indexOf(c);
      const coef = coefFor(c, idx);
      return (
        <div key={c.formula} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          {interactive
            ? <Stepper value={coef} onChange={v => setCoef(idx, v)} />
            : <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-info)", height: 22, display: "flex", alignItems: "center" }}>{coef > 1 ? coef : "\u00A0"}</div>}
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>{disp(c.formula)}</div>
        </div>
      );
    };
    const Group = (arr) => arr.map((c, i) => (
      <div key={c.formula} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {Compound(c)}
        {i < arr.length - 1 && <span style={{ fontSize: 18, color: "var(--color-text-tertiary)" }}>+</span>}
      </div>
    ));
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {Group(reactants)}
        <span style={{ fontSize: 20, color: "var(--color-text-tertiary)" }}>→</span>
        {Group(products)}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{DATA.title}</div>
        {DATA.subtitle && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{DATA.subtitle}</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setTab("balance")} style={pillStyle(tab === "balance")}>⚖️ Cân bằng phương trình</button>
        <button onClick={() => setTab("stoich")} style={pillStyle(tab === "stoich")}>🧮 Tính theo phương trình</button>
      </div>

      {/* BALANCE TAB */}
      {tab === "balance" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>{DATA.balance.label}</div>

          <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 14px", marginBottom: 12 }}>
            <EquationLine compounds={DATA.balance.compounds} coefFor={(c, i) => coefs[i]} interactive />
          </div>

          {/* Status banner */}
          <div style={{
            borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, fontWeight: 500, textAlign: "center",
            background: isBalanced ? "var(--color-background-success)" : "var(--color-background-warning)",
            color: isBalanced ? "var(--color-text-success)" : "var(--color-text-warning)",
          }}>
            {isBalanced ? "✓ Phương trình đã cân bằng!" : "Chưa cân bằng — điều chỉnh hệ số ở trên"}
          </div>

          {/* Element table */}
          <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-background-secondary)" }}>
                  <th style={{ padding: "7px 10px", textAlign: "left", color: "var(--color-text-tertiary)", fontWeight: 500, fontSize: 11 }}>Nguyên tố</th>
                  <th style={{ padding: "7px 10px", color: "var(--color-text-tertiary)", fontWeight: 500, fontSize: 11 }}>Trái</th>
                  <th style={{ padding: "7px 10px", color: "var(--color-text-tertiary)", fontWeight: 500, fontSize: 11 }}>Phải</th>
                  <th style={{ padding: "7px 10px", width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {elements.map(el => {
                  const l = sideSum("reactant", el), r = sideSum("product", el);
                  const ok = l === r;
                  return (
                    <tr key={el} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "var(--color-text-primary)" }}>{el}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: "var(--color-text-secondary)" }}>{l}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: "var(--color-text-secondary)" }}>{r}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: ok ? "var(--color-text-success)" : "var(--color-text-danger)" }}>{ok ? "✓" : "✗"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetCoefs} style={{ ...pillStyle(false), flex: 1, textAlign: "center" }}>↺ Đặt lại</button>
            <button onClick={showAnswer} style={{ ...pillStyle(false), flex: 1, textAlign: "center" }}>👁 Xem đáp án</button>
          </div>
        </div>
      )}

      {/* STOICH TAB */}
      {tab === "stoich" && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>{stoich.label}</div>

          <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px 14px", marginBottom: 12 }}>
            <EquationLine compounds={stoich.compounds} coefFor={(c) => c.coef} interactive={false} />
          </div>

          {/* Given input */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12, background: "var(--color-background-info)",
          }}>
            <span style={{ fontSize: 13, color: "var(--color-text-info)", fontWeight: 500 }}>Cho biết</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>{disp(given.formula)}</span>
            <input type="number" value={givenValue} min={0} step={0.1}
              onChange={e => setGivenValue(parseFloat(e.target.value) || 0)}
              style={{
                width: 70, fontSize: 14, padding: "4px 8px", borderRadius: 6,
                border: "0.5px solid var(--color-border-secondary)", marginLeft: "auto",
                background: "var(--color-background-primary)", color: "var(--color-text-primary)",
              }} />
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{given.unit === "L" ? "L (đktc)" : given.unit}</span>
          </div>

          {/* Results */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, marginBottom: 12 }}>
            {results.map(r => (
              <div key={r.formula} style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{disp(r.formula)}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-info)", marginTop: 4 }}>{r.value.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.unitLabel}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setShowSolution(s => !s)} style={{ ...pillStyle(showSolution, "warning"), width: "100%", textAlign: "center", marginBottom: 10 }}>
            {showSolution ? "Ẩn lời giải" : "✎ Hiện lời giải"}
          </button>

          {showSolution && (
            <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.9 }}>
              {given.unit === "g" && <div>n({disp(given.formula)}) = m/M = {givenValue}/{molarMass(given.formula)} = <strong>{molGiven.toFixed(3)} mol</strong></div>}
              {given.unit === "L" && <div>n({disp(given.formula)}) = V/22,4 = {givenValue}/22,4 = <strong>{molGiven.toFixed(3)} mol</strong></div>}
              {given.unit === "mol" && <div>n({disp(given.formula)}) = <strong>{givenValue} mol</strong></div>}
              {results.map(r => (
                <div key={r.formula}>
                  <div>Theo PTHH, tỉ lệ mol {disp(r.formula)} : {disp(given.formula)} = {r.coef} : {givenCompound.coef}{" "}
                    → n({disp(r.formula)}) = {molGiven.toFixed(3)} × {r.coef}/{givenCompound.coef} = <strong>{r.mol.toFixed(3)} mol</strong></div>
                  {r.unit === "g" && <div style={{ marginBottom: 6 }}>m({disp(r.formula)}) = n × M = {r.mol.toFixed(3)} × {molarMass(r.formula)} = <strong>{r.value.toFixed(2)} g</strong></div>}
                  {r.unit === "L" && <div style={{ marginBottom: 6 }}>V({disp(r.formula)}) = n × 22,4 = {r.mol.toFixed(3)} × 22,4 = <strong>{r.value.toFixed(2)} L</strong></div>}
                  {r.unit === "mol" && <div style={{ marginBottom: 6 }}>n({disp(r.formula)}) = <strong>{r.value.toFixed(3)} mol</strong></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
