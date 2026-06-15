// TEMPLATE: chemistry-interactive/templates/transformation-network.jsx
//
// Sơ đồ chuyển hoá (network) — dùng cho dạng bài "Hoàn thành sơ đồ chuyển hoá:
// A → B → C → ..." hoặc sơ đồ có nhánh (1 chất tạo ra nhiều chất khác).
//
// OUTPUT: file .jsx này render trực tiếp như React artifact (KHÔNG cần HTML/3Dmol),
// vì không dùng WebGL — chỉ dùng iframe MolView (nhẹ, optional) cho phần xem 3D.
// → create_file vào /mnt/user-data/outputs/{ten-file}.jsx rồi present_files.
//   (Khác với viewer/quiz HTML — không cần bash_tool, không cần dặn "mở Chrome".)
//
// CÁCH THAY DỮ LIỆU — sửa object SCHEME bên dưới:
//
// nodes: [{ id, formula, name, cid?, desc?, row, col }]
//   - id      : mã ngắn, duy nhất (A, B, C... hoặc 1,2,3...)
//   - formula : công thức hiển thị, dùng subscript Unicode (₀-₉) — vd "C₂H₅OH"
//   - name    : tên tiếng Việt
//   - cid     : PubChem CID (optional) — có thì hiện nút xem mô hình 3D khi click
//   - desc    : mô tả ngắn 1 câu (optional)
//   - row, col: vị trí trên lưới, số nguyên bắt đầu từ 1.
//               Xếp theo đúng layout sơ đồ trong đề bài (trái→phải = chuỗi chính,
//               xuống dòng = nhánh phụ). Có thể để trống ô lưới — không sao.
//
// edges: [{ from, to, num, equation, condition, note? }]
//   - from/to  : id của 2 node (chiều mũi tên)
//   - num      : số thứ tự phản ứng (1,2,3...) — khớp cách đánh số trong đề
//   - equation : phương trình đầy đủ đã cân bằng
//   - condition: điều kiện phản ứng, hiện dưới số trên mũi tên
//   - note     : loại phản ứng / giải thích ngắn (optional)
//
// Lưu ý: nếu 1 phản ứng cần 2 chất tham gia (vd A + B → C), vẫn khai báo edge
// từ chất "chính" (A→C hoặc B→C) — equation ghi đầy đủ cả 2 chất tham gia.

import { useState, useRef, useEffect, useCallback } from "react";

const SCHEME = {
  title: "SCHEME_TITLE",
  subtitle: "SCHEME_SUBTITLE",
  nodes: [
    { id: "A", formula: "FORMULA_A", name: "NAME_A", cid: null, row: 1, col: 1 },
    { id: "B", formula: "FORMULA_B", name: "NAME_B", cid: null, row: 1, col: 2 },
  ],
  edges: [
    { from: "A", to: "B", num: 1, equation: "EQUATION_1", condition: "CONDITION_1" },
  ],
};

const CELL_W = 138;
const CELL_H = 64;
const GAP_X = 56;
const GAP_Y = 48;
const PAD = 18;

export default function TransformationNetwork() {
  const [view, setView] = useState("diagram"); // "diagram" | "list"
  const [selfTest, setSelfTest] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [active, setActive] = useState(null); // {type:"node"|"edge", id}
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const [lines, setLines] = useState([]);

  const maxRow = Math.max(...SCHEME.nodes.map(n => n.row));
  const maxCol = Math.max(...SCHEME.nodes.map(n => n.col));
  const gridW = maxCol * CELL_W + (maxCol - 1) * GAP_X;
  const gridH = maxRow * CELL_H + (maxRow - 1) * GAP_Y;

  const recalc = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const ls = SCHEME.edges.map(e => {
      const a = nodeRefs.current[e.from];
      const b = nodeRefs.current[e.to];
      if (!a || !b) return null;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const ax = ar.left + ar.width / 2 - cr.left;
      const ay = ar.top + ar.height / 2 - cr.top;
      const bx = br.left + br.width / 2 - cr.left;
      const by = br.top + br.height / 2 - cr.top;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const x1 = ax + ux * (ar.width / 2 + 2);
      const y1 = ay + uy * (ar.height / 2 + 2);
      const x2 = bx - ux * (br.width / 2 + 11);
      const y2 = by - uy * (br.height / 2 + 11);
      return { e, x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
    }).filter(Boolean);
    setLines(ls);
  }, []);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", recalc);
    return () => { ro.disconnect(); window.removeEventListener("resize", recalc); };
  }, [recalc, view]);

  const toggleReveal = (num) => setRevealed(r => ({ ...r, [num]: !r[num] }));
  const allRevealed = SCHEME.edges.length > 0 && SCHEME.edges.every(e => revealed[e.num]);
  const toggleAll = () => {
    const v = !allRevealed;
    const next = {};
    SCHEME.edges.forEach(e => { next[e.num] = v; });
    setRevealed(next);
  };

  const activeNode = active?.type === "node" ? SCHEME.nodes.find(n => n.id === active.id) : null;
  const activeEdge = active?.type === "edge" ? SCHEME.edges.find(e => e.num === active.id) : null;

  const pillStyle = (on, color = "info") => ({
    padding: "5px 14px", fontSize: 12, borderRadius: 20, cursor: "pointer",
    border: on ? `1.5px solid var(--color-text-${color})` : "0.5px solid var(--color-border-secondary)",
    background: on ? `var(--color-background-${color})` : "var(--color-background-primary)",
    color: on ? `var(--color-text-${color})` : "var(--color-text-secondary)",
    fontWeight: on ? 500 : 400,
  });

  return (
    <div style={{ fontFamily: "sans-serif", padding: "0 0 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>{SCHEME.title}</div>
        {SCHEME.subtitle && (
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 }}>{SCHEME.subtitle}</div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setView("diagram")} style={pillStyle(view === "diagram")}>⬡ Sơ đồ</button>
        <button onClick={() => setView("list")} style={pillStyle(view === "list")}>≡ Danh sách</button>
        <button onClick={() => setSelfTest(s => !s)} style={{ ...pillStyle(selfTest, "warning"), marginLeft: "auto" }}>
          ✎ Tự kiểm tra
        </button>
        {selfTest && (
          <button onClick={toggleAll} style={pillStyle(false)}>
            {allRevealed ? "Ẩn tất cả" : "Hiện tất cả"}
          </button>
        )}
      </div>

      {/* DIAGRAM VIEW */}
      {view === "diagram" && (
        <div style={{
          overflowX: "auto", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 12, padding: PAD, background: "var(--color-background-primary)",
        }}>
          <div ref={containerRef} style={{
            position: "relative", width: gridW, height: gridH,
            display: "grid",
            gridTemplateColumns: `repeat(${maxCol}, ${CELL_W}px)`,
            gridTemplateRows: `repeat(${maxRow}, ${CELL_H}px)`,
            columnGap: GAP_X, rowGap: GAP_Y,
          }}>
            <svg width={gridW} height={gridH}
              style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              <defs>
                <marker id="tn-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--color-text-tertiary)" />
                </marker>
              </defs>
              {lines.map(({ e, x1, y1, x2, y2 }) => {
                const isActive = active?.type === "edge" && active.id === e.num;
                return (
                  <line key={e.num} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isActive ? "var(--color-text-info)" : "var(--color-border-secondary)"}
                    strokeWidth={isActive ? 2 : 1.5}
                    markerEnd="url(#tn-arrow)" />
                );
              })}
            </svg>

            {lines.map(({ e, mx, my }) => {
              const isActive = active?.type === "edge" && active.id === e.num;
              const show = !selfTest || revealed[e.num];
              return (
                <div key={e.num}
                  onClick={() => setActive(a => (a?.type === "edge" && a.id === e.num) ? null : { type: "edge", id: e.num })}
                  style={{
                    position: "absolute", left: mx, top: my, transform: "translate(-50%,-50%)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    cursor: "pointer", zIndex: 2,
                  }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
                    background: isActive ? "var(--color-text-info)" : "var(--color-background-info)",
                    color: isActive ? "var(--color-background-primary)" : "var(--color-text-info)",
                    border: "2px solid var(--color-background-primary)",
                  }}>{e.num}</div>
                  <div style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 6, whiteSpace: "nowrap",
                    maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis",
                    border: "0.5px solid var(--color-border-tertiary)",
                    background: "var(--color-background-primary)",
                    color: "var(--color-text-tertiary)",
                  }}>
                    {show ? e.condition : "?"}
                  </div>
                </div>
              );
            })}

            {SCHEME.nodes.map(n => {
              const isActive = active?.type === "node" && active.id === n.id;
              return (
                <div key={n.id} ref={el => { nodeRefs.current[n.id] = el; }}
                  onClick={() => setActive(a => (a?.type === "node" && a.id === n.id) ? null : { type: "node", id: n.id })}
                  style={{
                    gridColumn: n.col, gridRow: n.row,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    border: isActive ? "1.5px solid var(--color-text-info)" : "0.5px solid var(--color-border-secondary)",
                    borderRadius: 10, background: "var(--color-background-primary)",
                    cursor: "pointer", zIndex: 1, padding: "6px 10px", textAlign: "center",
                    boxShadow: isActive ? "0 0 0 3px var(--color-background-info)" : "none",
                    transition: "box-shadow .15s",
                  }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>{n.formula}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>{n.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SCHEME.edges.map(e => {
            const fromNode = SCHEME.nodes.find(n => n.id === e.from);
            const toNode = SCHEME.nodes.find(n => n.id === e.to);
            const show = !selfTest || revealed[e.num];
            return (
              <div key={e.num} onClick={() => selfTest && toggleReveal(e.num)}
                style={{
                  border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10,
                  padding: "10px 12px", cursor: selfTest ? "pointer" : "default",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, fontWeight: 600, flexShrink: 0,
                    background: "var(--color-background-info)", color: "var(--color-text-info)",
                  }}>{e.num}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {fromNode?.formula} → {toNode?.formula}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
                    {e.condition}
                  </span>
                </div>
                {show ? (
                  <div style={{
                    fontSize: 13, fontFamily: "monospace", color: "var(--color-text-secondary)",
                    background: "var(--color-background-secondary)", padding: "6px 10px", borderRadius: 6,
                  }}>{e.equation}</div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                    Bấm để xem phương trình
                  </div>
                )}
                {show && e.note && (
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>{e.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {(activeNode || activeEdge) && (
        <div style={{
          marginTop: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12,
          padding: 14, background: "var(--color-background-secondary)",
        }}>
          {activeNode && (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>{activeNode.formula}</span>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{activeNode.name}</span>
              </div>
              {activeNode.desc && (
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0", lineHeight: 1.6 }}>
                  {activeNode.desc}
                </p>
              )}
              {activeNode.cid && (
                <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "0.5px solid var(--color-border-tertiary)" }}>
                  <iframe src={`https://embed.molview.org/v1/?mode=balls&cid=${activeNode.cid}&bg=white`}
                    allow="fullscreen" loading="lazy"
                    style={{ width: "100%", height: 200, border: "none", display: "block" }}
                    title={`3D ${activeNode.name}`} />
                </div>
              )}
            </div>
          )}
          {activeEdge && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-info)", marginBottom: 6 }}>
                Phản ứng ({activeEdge.num})
              </div>
              <div style={{
                fontSize: 14, fontFamily: "monospace", color: "var(--color-text-primary)",
                background: "var(--color-background-primary)", padding: "8px 12px", borderRadius: 8, marginBottom: 6,
              }}>{activeEdge.equation}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                <strong>Điều kiện:</strong> {activeEdge.condition}
              </div>
              {activeEdge.note && (
                <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>{activeEdge.note}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-text-tertiary)" }}>
        💡 Bấm vào ô chất hoặc số trên mũi tên để xem chi tiết. Bật "Tự kiểm tra" để ẩn điều kiện/phương trình và tự viết trước khi xem đáp án.
      </div>
    </div>
  );
}
