// TEMPLATE: chemistry-interactive/templates/redox-tracker.jsx
//
// Minh hoạ "Phương pháp cân bằng electron" cho phản ứng oxi hoá - khử,
// đi theo 4 bước chuẩn THPT: (1) xác định số oxi hoá thay đổi,
// (2) viết quá trình oxi hoá/khử, (3) cân bằng electron (tìm hệ số/LCM),
// (4) hoàn thành phương trình.
//
// OUTPUT: React artifact — create_file vào /mnt/user-data/outputs/{ten-file}.jsx, present_files.
//
// CÁCH THAY DỮ LIỆU — sửa object DATA:
//   - unbalanced: phương trình CHƯA cân bằng (string hiển thị, dùng subscript Unicode)
//   - balanced  : phương trình ĐÃ cân bằng
//   - processes : đúng 2 phần tử — 1 "oxidation" (chất khử nhường e), 1 "reduction" (chất oxi hoá nhận e)
//       - element : kí hiệu nguyên tố có số oxi hoá thay đổi
//       - before/after: số oxi hoá trước/sau (string, vd "0", "+3", "-1")
//       - half    : bán phản ứng electron, vd "Al⁰ → Al⁺³ + 3e⁻"
//       - role    : vai trò, vd "Chất khử (bị oxi hoá)"
//       - electronsPerUnit: số electron trao đổi trên 1 đơn vị bán phản ứng (số trong "half")
//       - multiplier: hệ số nhân để 2 quá trình có cùng tổng electron (LCM)
//   Lưu ý: electronsPerUnit(oxidation) × multiplier(oxidation)
//        = electronsPerUnit(reduction) × multiplier(reduction)  ← tổng electron trao đổi

import { useState } from "react";

const DATA = {
  title: "TITLE",
  subtitle: "SUBTITLE",
  unbalanced: "EQ_UNBALANCED",
  balanced: "EQ_BALANCED",
  processes: [
    { type: "oxidation", element: "EL1", before: "B1", after: "A1", half: "HALF_1", role: "ROLE_1", electronsPerUnit: 1, multiplier: 1 },
    { type: "reduction", element: "EL2", before: "B2", after: "A2", half: "HALF_2", role: "ROLE_2", electronsPerUnit: 1, multiplier: 1 },
  ],
};

const STEPS = [
  "Xác định số oxi hoá",
  "Viết 2 quá trình",
  "Cân bằng electron",
  "Hoàn thành PTHH",
];

const ROLE_STYLE = {
  oxidation: { bg: "var(--color-background-warning)", fg: "var(--color-text-warning)", label: "Oxi hoá" },
  reduction: { bg: "var(--color-background-info)", fg: "var(--color-text-info)", label: "Khử" },
};

export default function RedoxTracker() {
  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState(false);

  const ox = DATA.processes.find(p => p.type === "oxidation");
  const red = DATA.processes.find(p => p.type === "reduction");
  const totalEOx = ox.electronsPerUnit * ox.multiplier;
  const totalERed = red.electronsPerUnit * red.multiplier;
  const eMatch = totalEOx === totalERed;

  const OxNumBadge = ({ p }) => {
    const rs = ROLE_STYLE[p.type];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{p.element}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span style={{ padding: "1px 8px", borderRadius: 8, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{p.before}</span>
          <span style={{ color: "var(--color-text-tertiary)" }}>→</span>
          <span style={{ padding: "1px 8px", borderRadius: 8, background: rs.bg, color: rs.fg, fontWeight: 600 }}>{p.after}</span>
        </div>
        <div style={{ fontSize: 11, padding: "1px 8px", borderRadius: 10, background: rs.bg, color: rs.fg }}>
          {rs.label === "Oxi hoá" ? "Số oxi hoá tăng" : "Số oxi hoá giảm"}
        </div>
      </div>
    );
  };

  const ProcessCard = (p) => {
    const rs = ROLE_STYLE[p.type];
    return (
      <div style={{ flex: 1, border: `0.5px solid ${rs.fg}`, borderRadius: 12, padding: "12px 14px", background: rs.bg }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: rs.fg, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Quá trình {rs.label.toLowerCase()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4, fontFamily: "monospace" }}>{p.half}</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p.role}</div>
      </div>
    );
  };

  const ElectronRow = (p, count) => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "var(--color-background-primary)",
          background: ROLE_STYLE[p.type].fg,
          transform: flow ? (p.type === "oxidation" ? "translateX(40px)" : "translateX(-40px)") : "translateX(0)",
          transition: `transform .6s ease ${i * 0.06}s`,
        }}>e⁻</div>
      ))}
    </div>
  );

  const pillStyle = (on) => ({
    padding: "5px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer",
    border: on ? "1.5px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
    background: on ? "var(--color-background-info)" : "var(--color-background-primary)",
    color: on ? "var(--color-text-info)" : "var(--color-text-secondary)",
    fontWeight: on ? 500 : 400,
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{DATA.title}</div>
        {DATA.subtitle && <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{DATA.subtitle}</div>}
        <div style={{
          marginTop: 8, fontSize: 15, fontFamily: "monospace", fontWeight: 600, color: "var(--color-text-primary)",
          background: "var(--color-background-secondary)", padding: "6px 12px", borderRadius: 8, display: "inline-block",
        }}>{step < 3 ? DATA.unbalanced : DATA.balanced}</div>
      </div>

      {/* Step pills */}
      <div style={{ display: "flex", marginBottom: 16, position: "relative" }}>
        <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: "0.5px", background: "var(--color-border-tertiary)", zIndex: 0 }} />
        {STEPS.map((label, i) => (
          <div key={i} onClick={() => setStep(i)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", position: "relative", zIndex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 500,
              border: i === step ? "2px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
              background: i < step ? "var(--color-text-info)" : i === step ? "var(--color-background-info)" : "var(--color-background-primary)",
              color: i < step ? "var(--color-background-primary)" : i === step ? "var(--color-text-info)" : "var(--color-text-tertiary)",
              transition: "all .2s",
            }}>{i < step ? "✓" : i + 1}</div>
            <div style={{ fontSize: 11, textAlign: "center", color: i === step ? "var(--color-text-info)" : "var(--color-text-tertiary)", fontWeight: i === step ? 500 : 400 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 14, minHeight: 180 }}>

        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 14px", lineHeight: 1.6 }}>
              So sánh số oxi hoá của từng nguyên tố ở 2 vế phương trình — nguyên tố nào thay đổi
              số oxi hoá thì tham gia quá trình oxi hoá - khử.
            </p>
            <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
              <OxNumBadge p={ox} />
              <OxNumBadge p={red} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
              Viết riêng quá trình nhường electron (oxi hoá) và quá trình nhận electron (khử):
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {ProcessCard(ox)}
              {ProcessCard(red)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
              Tìm hệ số nhân cho mỗi quá trình sao cho tổng số electron nhường = tổng số electron nhận
              (bội chung nhỏ nhất - BCNN):
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ flex: 1, border: `0.5px solid ${ROLE_STYLE.oxidation.fg}`, borderRadius: 12, padding: "10px 14px", background: ROLE_STYLE.oxidation.bg }}>
                <div style={{ fontSize: 12, color: ROLE_STYLE.oxidation.fg, fontWeight: 600, marginBottom: 4 }}>Oxi hoá</div>
                <div style={{ fontSize: 14, color: "var(--color-text-primary)", marginBottom: 6 }}>
                  {ox.electronsPerUnit}e⁻ × {ox.multiplier} = <strong>{totalEOx}e⁻</strong>
                </div>
                {ElectronRow(ox, totalEOx)}
              </div>
              <div style={{ flex: 1, border: `0.5px solid ${ROLE_STYLE.reduction.fg}`, borderRadius: 12, padding: "10px 14px", background: ROLE_STYLE.reduction.bg }}>
                <div style={{ fontSize: 12, color: ROLE_STYLE.reduction.fg, fontWeight: 600, marginBottom: 4 }}>Khử</div>
                <div style={{ fontSize: 14, color: "var(--color-text-primary)", marginBottom: 6 }}>
                  {red.electronsPerUnit}e⁻ × {red.multiplier} = <strong>{totalERed}e⁻</strong>
                </div>
                {ElectronRow(red, totalERed)}
              </div>
            </div>
            <button onClick={() => setFlow(f => !f)} style={{ ...pillStyle(flow), width: "100%", textAlign: "center" }}>
              {flow ? "↺ Reset minh hoạ" : "▶ Minh hoạ trao đổi electron"}
            </button>
            <div style={{
              marginTop: 10, textAlign: "center", fontSize: 13, fontWeight: 500,
              color: eMatch ? "var(--color-text-success)" : "var(--color-text-warning)",
            }}>
              {eMatch ? `✓ Cân bằng: ${totalEOx}e⁻ nhường = ${totalERed}e⁻ nhận` : "Chưa cân bằng — kiểm tra lại hệ số"}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
              Đưa các hệ số ({ox.multiplier} cho quá trình oxi hoá, {red.multiplier} cho quá trình khử)
              vào phương trình ban đầu, sau đó kiểm tra cân bằng số nguyên tử của tất cả nguyên tố còn lại
              (thường là cân bằng tiếp phần không đổi số oxi hoá).
            </p>
            <div style={{
              fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)", fontFamily: "monospace",
              background: "var(--color-background-success)", padding: "12px 16px", borderRadius: 10, textAlign: "center",
            }}>{DATA.balanced}</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ flex: 1, padding: "9px", fontSize: 13, borderRadius: 10, cursor: step === 0 ? "default" : "pointer",
            border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)",
            color: "var(--color-text-primary)", opacity: step === 0 ? 0.4 : 1, fontFamily: "sans-serif" }}>
          ← Quay lại
        </button>
        <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}
          style={{ flex: 1, padding: "9px", fontSize: 13, borderRadius: 10,
            cursor: step === STEPS.length - 1 ? "default" : "pointer",
            border: "0.5px solid var(--color-border-secondary)",
            background: step === STEPS.length - 1 ? "var(--color-background-primary)" : "var(--color-background-info)",
            color: step === STEPS.length - 1 ? "var(--color-text-primary)" : "var(--color-text-info)",
            opacity: step === STEPS.length - 1 ? 0.4 : 1, fontFamily: "sans-serif", fontWeight: 500 }}>
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}
