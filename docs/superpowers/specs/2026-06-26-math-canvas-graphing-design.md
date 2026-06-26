# Math Canvas — Graphing Mode Design Spec

Date: 2026-06-26
Status: Approved

Parent spec: `docs/superpowers/specs/2026-06-25-math-canvas-design.md`

---

## 1. Goal

Implement the Graphing mode of `math-canvas`, replacing the current placeholder with a working
function plotter: left panel listing y = f(x) functions, canvas plots them simultaneously,
auto-updates on every keystroke.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Simultaneous functions | Multiple (up to 8) | Richer exploration; colors auto-assigned from DCOLS |
| Layout | Left panel 160px + canvas flex:1 | Desmos-familiar; canvas stays full-width flex |
| Plot trigger | Auto on keystroke (debounce 150ms) | Instant feedback like Desmos |
| Expression notation | `x^2`, implicit multiplication (`2x` = `2*x`) | K12-friendly; no need to type `*` |
| Parser | `Function()` + text replacement | Sufficient for K12 y=f(x); widget is already sandboxed |
| Built-in functions | sin, cos, tan, asin, acos, atan, sqrt, abs, log, log2, log10, floor, ceil, round + pi, e | Standard K12 curriculum coverage |
| Layout integration | CSS Flexbox (`#dw-body` wrapper) | Minimal change to base template; mode switcher/toolbar/status bar unaffected |

---

## 3. Layout & DOM

Add `#dw-body` between `#dtb` and `#dst`:

```
#dw
  #dmodes         (mode switcher row — full width, unchanged)
  #dtb            (toolbar row — full width, unchanged)
  #dw-body        (NEW — display:flex; flex-direction:row)
    #dgraph-panel (160px fixed; visible only in graphing mode)
    <canvas id="ggc"> (flex:1; always visible)
  #dst            (status bar — full width, unchanged)
```

`#dgraph-panel` is `display:none` in all non-graphing modes; `display:flex;flex-direction:column`
in graphing mode. This change does not affect geometry or placeholder modes.

---

## 4. State

Add to the global state block (alongside existing `pts`, `segs`, etc.):

```javascript
let funcs = []; // [{id, expr, color, compiled, error}]
let fCnt = 0;   // monotonic counter for id and color assignment
```

Fields per function object:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `'f0'`, `'f1'`, ... |
| `expr` | string | Raw expression string as typed |
| `color` | string | `DCOLS[fCnt % DCOLS.length]` assigned at creation |
| `compiled` | Function \| null | Compiled JS function `(x) => number`, null if parse error |
| `error` | string \| null | Error message from last parse attempt, null if ok |

`funcs[]` is never cleared on mode switch. `clearAll()` resets `funcs = []; fCnt = 0;` and
removes all DOM rows from `#dgraph-list`.

---

## 5. Expression Parser

```javascript
function compileExpr(raw) {
  let s = raw.trim();
  if (!s) return null;

  s = s.replace(/\^/g, '**');

  // Implicit multiplication
  s = s.replace(/(\d)(x|pi|\()/g, '$1*$2');   // 2x→2*x, 2(→2*(, 2pi→2*pi
  s = s.replace(/(x|\))(\d|\()/g, '$1*$2');   // x2→x*2, )(→)*(
  s = s.replace(/(x)\s*(x)/g, '$1*$2');        // xx→x*x

  // Constants — before function replacement to avoid mangling 'ceil', 'acos', etc.
  s = s.replace(/\bpi\b/g, 'Math.PI');
  s = s.replace(/\be\b/g, 'Math.E');

  // Math functions
  const fns = ['asin','acos','atan','sin','cos','tan',
                'sqrt','abs','log2','log10','log',
                'floor','ceil','round'];
  for (const f of fns)
    s = s.replace(new RegExp(`\\b${f}\\b`, 'g'), `Math.${f}`);

  return new Function('x', `'use strict'; return (${s});`);
}
```

Note: longer function names (`asin`, `log2`, `log10`) appear before shorter overlapping ones
(`sin`, `log`) in the replacement list to prevent partial matches.

Called in a `try/catch` on every debounced input event. On success: `fn.compiled = result`,
`fn.error = null`. On throw: `fn.compiled = null`, `fn.error = e.message`.

---

## 6. Left Panel UI

### Markup (static)

```html
<div id="dgraph-panel" style="display:none">
  <div id="dgraph-list"></div>
  <button id="dgraph-add" onclick="addFunc()">+ Thêm hàm</button>
</div>
```

### Function row (injected by `addFunc()`)

```html
<div id="frow-{id}" class="frow">
  <div class="fcolor" style="background:{color}"></div>
  <div class="finput-wrap">
    <input id="finput-{id}" value="{expr}" oninput="onFuncInput('{id}', this.value)" />
    <div id="ferr-{id}" class="ferr"></div>
  </div>
  <button class="fdel" onclick="removeFunc('{id}')">×</button>
</div>
```

### CSS classes (add to `<style>` block)

```css
#dgraph-panel{width:160px;border-right:.5px solid var(--color-border-tertiary);
  display:flex;flex-direction:column;background:var(--color-background-primary);overflow-y:auto}
#dgraph-list{flex:1;padding:6px;display:flex;flex-direction:column;gap:4px}
#dgraph-add{margin:0 6px 6px;padding:5px 8px;border:1px dashed var(--color-border-secondary);
  border-radius:var(--border-radius-md);background:none;color:var(--color-text-secondary);
  font-size:12px;cursor:pointer;font-family:inherit;text-align:left}
#dgraph-add:hover{background:var(--color-background-secondary)}
#dgraph-add:disabled{opacity:.4;cursor:not-allowed}
.frow{display:flex;align-items:flex-start;gap:4px}
.fcolor{width:10px;height:10px;border-radius:2px;flex-shrink:0;margin-top:6px}
.finput-wrap{flex:1;min-width:0}
.finput-wrap input{width:100%;box-sizing:border-box;font-size:12px;padding:3px 5px;
  border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);
  font-family:inherit;background:var(--color-background-primary);color:var(--color-text-primary)}
.finput-wrap input.err{border-color:#c74440}
.ferr{font-size:10px;color:#c74440;margin-top:2px;line-height:1.3;display:none}
.fdel{padding:2px 5px;border:none;background:none;color:var(--color-text-secondary);
  cursor:pointer;font-size:14px;line-height:1;flex-shrink:0;margin-top:2px}
.fdel:hover{color:#c74440}
```

### JS functions

```javascript
let _fTimers = {}; // debounce timers keyed by func id

function addFunc(expr='') {
  if (funcs.length >= 8) return;
  const id = 'f' + fCnt;
  const color = DCOLS[fCnt % DCOLS.length];
  fCnt++;
  const fn = {id, expr, color, compiled: null, error: null};
  if (expr) {
    try { fn.compiled = compileExpr(expr); } catch(e) { fn.error = e.message; }
  }
  funcs.push(fn);
  // inject DOM row
  const list = document.getElementById('dgraph-list');
  const row = document.createElement('div');
  row.id = 'frow-' + id;
  row.className = 'frow';
  row.innerHTML = `
    <div class="fcolor" style="background:${color}"></div>
    <div class="finput-wrap">
      <input id="finput-${id}" value="${expr.replace(/"/g,'&quot;')}"
             oninput="onFuncInput('${id}',this.value)" />
      <div id="ferr-${id}" class="ferr"></div>
    </div>
    <button class="fdel" onclick="removeFunc('${id}')">×</button>`;
  list.appendChild(row);
  document.getElementById('dgraph-add').disabled = funcs.length >= 8;
  document.getElementById('finput-' + id).focus();
  redraw();
}

function removeFunc(id) {
  funcs = funcs.filter(f => f.id !== id);
  const row = document.getElementById('frow-' + id);
  if (row) row.remove();
  document.getElementById('dgraph-add').disabled = funcs.length >= 8;
  redraw();
}

function onFuncInput(id, val) {
  clearTimeout(_fTimers[id]);
  _fTimers[id] = setTimeout(() => {
    const fn = funcs.find(f => f.id === id);
    if (!fn) return;
    fn.expr = val;
    const input = document.getElementById('finput-' + id);
    const errEl = document.getElementById('ferr-' + id);
    fn.error = null; fn.compiled = null;
    if (val.trim()) {
      try {
        fn.compiled = compileExpr(val);
        input.classList.remove('err');
        errEl.style.display = 'none';
      } catch(e) {
        fn.error = e.message;
        input.classList.add('err');
        errEl.textContent = e.message;
        errEl.style.display = 'block';
      }
    } else {
      input.classList.remove('err');
      errEl.style.display = 'none';
    }
    redraw();
  }, 150);
}
```

---

## 7. `drawFuncs()`

```javascript
function drawFuncs() {
  for (const fn of funcs) {
    if (!fn.compiled) continue;
    X.save();
    X.strokeStyle = fn.color;
    X.lineWidth = 2;
    X.lineJoin = 'round';
    X.beginPath();
    let penDown = false;
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const sx = i / steps * C.width;
      const mx = gmx(sx);
      let my;
      try { my = fn.compiled(mx); } catch { penDown = false; continue; }
      if (!isFinite(my)) { penDown = false; continue; }
      const sy = gsy(my);
      if (!penDown) { X.moveTo(sx, sy); penDown = true; }
      else X.lineTo(sx, sy);
    }
    X.stroke();
    X.restore();
  }
}
```

Update `redraw()`:

```javascript
function redraw() {
  drawBg(); drawGrid();
  if (mode === 'geometry')  { drawPolys(); drawCircs(); drawSegs(); drawPrev(); drawPts(); }
  else if (mode === 'graphing') { drawFuncs(); }
  else { drawModePlaceholder(); }
}
```

---

## 8. `loadEx()` — mode-aware

```javascript
function loadEx() {
  if (mode === 'graphing') { loadExGraphing(); return; }
  // existing geometry example:
  clearAll();
  const A=addPt(-3,0),B=addPt(3,0),Cp=addPt(0,3);
  segs.push({a:A.id,b:B.id},{a:B.id,b:Cp.id},{a:Cp.id,b:A.id});
  polys.push([A.id,B.id,Cp.id]);
  DST.innerHTML='<strong>Drag any point</strong> to reshape the triangle.';
  redraw();
}

function loadExGraphing() {
  // clear funcs and rebuild panel
  funcs = [];
  document.getElementById('dgraph-list').innerHTML = '';
  document.getElementById('dgraph-add').disabled = false;
  addFunc('x^2');
  addFunc('sin(x)');
  DST.innerHTML = 'Graphing mode — gõ biểu thức vào panel trái để vẽ đồ thị.';
}
```

---

## 9. `setMode()` changes for Graphing

In `setMode(m)`, add handling for the `#dw-body` layout and `#dgraph-panel` visibility:

```javascript
// inside setMode(m), after existing panel/toolbar logic:
const panel = document.getElementById('dgraph-panel');
if (m === 'graphing') {
  panel.style.display = 'flex';
  if (funcs.length === 0) loadExGraphing();
} else {
  panel.style.display = 'none';
}
```

**Example & Clear button fix:** The existing `setMode()` disables `.dbt-geoaction` buttons
(Example, Clear) for all non-geometry modes. Graphing mode needs both buttons enabled (Example
calls `loadExGraphing()`, Clear resets `funcs`). Change the disable logic from:

```javascript
document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isGeo);
```

to:

```javascript
const activeMode = m === 'geometry' || m === 'graphing';
document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!activeMode);
```

---

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid expression | `fn.compiled = null`; input border red; error message below input; other functions plot normally |
| NaN / Infinity at point x | Skip point, lift pen — automatic domain handling |
| Empty input | `fn.compiled = null`; no error shown; nothing plotted for that row |
| `clearAll()` called | `funcs = []; fCnt = 0;` + clear `#dgraph-list` DOM + call `redraw()` |
| Mode switch away | `funcs[]` preserved; panel hidden |
| Mode switch back | Panel shown; `redraw()` re-plots all valid functions |

---

## 11. Manual Verification Checklist

Open `skills/math-canvas-outputs/math-canvas-demo.html` and verify:

- [ ] Switch to Graphing mode: left panel appears, 2 example functions (`x^2`, `sin(x)`) plotted with correct colors
- [ ] Gõ `2x+1` → đường thẳng xuất hiện ngay (implicit multiplication)
- [ ] Gõ `x^3 - 2x` → cubic curve với đúng hình dạng
- [ ] Gõ `sin(x)*cos(x)` → đường đúng (= 0.5·sin(2x))
- [ ] Gõ `x^^2` → border đỏ, error message, canvas không crash, hàm cũ vẫn plot
- [ ] `log(x)` → gap ở x ≤ 0, không vẽ phần undefined
- [ ] Thêm hàm thứ 3, 4 → màu khác nhau, tất cả plot đồng thời
- [ ] Xóa một hàm → đường đó biến mất, hàm còn lại giữ nguyên
- [ ] Switch sang Geometry, vẽ hình, switch lại Graphing → funcs còn nguyên, geometry còn nguyên
- [ ] Zoom/pan trong Graphing → tất cả đồ thị redraw đúng
- [ ] `clearAll()` → xóa hết funcs + geometry
- [ ] DevTools console: không có lỗi JS
