# Math Canvas Baseline (Rename + Mode Switcher) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `geometry-canvas` skill to `math-canvas`, add a 4-way mode switcher (Geometry / Graphing / Vector / Statistics) to the toolbar, and keep Geometry mode working exactly as before — Graphing/Vector/Statistics render as inert placeholders for now, to be implemented in later plans.

**Architecture:** Single shared canvas/state object as defined in `docs/superpowers/specs/2026-06-25-math-canvas-design.md`. A `mode` variable gates which draw functions run in `redraw()` and which toolbar section is visible. Non-geometry modes draw a centered placeholder message and ignore pointer input, leaving existing Geometry data (`pts/segs/circs/polys`) untouched when switching away and back.

**Tech Stack:** Plain HTML/Canvas2D/vanilla JS widget template embedded in a skill markdown file (no build step, no framework). Manual browser verification (no test runner exists for this asset type) plus `node --check` for JS syntax sanity.

---

### Task 1: Rename skill file, update frontmatter and intro

**Files:**
- Rename: `skills/geometry-canvas-SKILL.md` → `skills/math-canvas-SKILL.md`

- [ ] **Step 1: Rename the file with git mv**

```bash
git mv skills/geometry-canvas-SKILL.md skills/math-canvas-SKILL.md
```

- [ ] **Step 2: Update the frontmatter**

Replace lines 1-12 of `skills/math-canvas-SKILL.md`:

```yaml
---
name: geometry-canvas
description: >
  Tạo interactive geometry workspace kiểu Desmos/GeoGebra — canvas trắng, grid nhạt,
  axes đen có mũi tên, font Helvetica Neue, màu Desmos. Dùng skill này BẤT CỨ KHI NÀO
  user muốn: vẽ hình học tương tác, đặt points/segments/circles/polygons trên canvas,
  workspace có thể kéo thả reshape, geometry canvas để học toán, coordinate plane cho
  phép người dùng vẽ lên đó. Trigger khi thấy: "geometry canvas", "vẽ hình học",
  "draw points segments circles", "GeoGebra style", "Desmos workspace", "coordinate
  canvas", "interactive geometry", "canvas vẽ", "hình học tương tác", "kéo thả điểm",
  "drag points", "live measurements", "math drawing tool".
---
```

with:

```yaml
---
name: math-canvas
description: >
  Tạo interactive math workspace kiểu Desmos/GeoGebra — canvas trắng, grid nhạt,
  axes đen có mũi tên, font Helvetica Neue, màu Desmos. Hỗ trợ nhiều mode: Geometry
  (points/segments/circles/polygons, kéo thả reshape — đầy đủ), Graphing, Vector,
  Statistics (đang phát triển). Dùng skill này BẤT CỨ KHI NÀO user muốn: vẽ hình học
  tương tác, vẽ đồ thị hàm số, vẽ vector và phép biến hình, vẽ biểu đồ thống kê,
  coordinate plane cho phép người dùng vẽ lên đó. Trigger khi thấy: "geometry canvas",
  "math canvas", "vẽ hình học", "draw points segments circles", "GeoGebra style",
  "Desmos workspace", "coordinate canvas", "interactive geometry", "canvas vẽ",
  "hình học tương tác", "kéo thả điểm", "drag points", "live measurements",
  "math drawing tool", "vẽ đồ thị hàm số", "graphing calculator", "function plot",
  "vector", "phép biến hình", "biểu đồ thống kê", "histogram".
---
```

- [ ] **Step 3: Update the H1 title and add a status note**

Replace:

```markdown
# Geometry Canvas Skill

Tạo interactive geometry workspace dùng `show_widget`. Canvas dùng Desmos visual
language: nền trắng cứng, grid nhạt, trục đen có mũi tên filled, font Helvetica Neue,
và màu Desmos chính xác.

**Output:** Luôn dùng `show_widget` — không tạo file. Widget tự chứa HTML + JS.
```

with:

```markdown
# Math Canvas Skill

Tạo interactive math workspace dùng `show_widget`. Canvas dùng Desmos visual
language: nền trắng cứng, grid nhạt, trục đen có mũi tên filled, font Helvetica Neue,
và màu Desmos chính xác.

**Output:** Luôn dùng `show_widget` — không tạo file. Widget tự chứa HTML + JS.

## Trạng thái hiện tại

- **Geometry mode** — đầy đủ: Point/Segment/Circle/Polygon, drag-to-reshape, live
  measurements.
- **Graphing, Vector, Statistics mode** — toolbar/mode switcher đã có, nhưng canvas
  hiện chỉ hiện placeholder "sắp có". Sẽ được triển khai ở các bản sau (xem
  `docs/superpowers/specs/2026-06-25-math-canvas-design.md`).
```

- [ ] **Step 4: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "rename: geometry-canvas skill to math-canvas, update triggers"
```

---

### Task 2: Add mode-switcher markup and CSS

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template section — CSS block and toolbar HTML)

- [ ] **Step 1: Add CSS rules for mode buttons and disabled state**

In the `<style>` block inside the Base Template, find:

```css
.dbt.on{border-color:#2d70b3;background:#edf3fb;color:#2d70b3;font-weight:500}
```

Add immediately after it:

```css
.dbt.on{border-color:#2d70b3;background:#edf3fb;color:#2d70b3;font-weight:500}
.dbt:disabled{opacity:.4;cursor:not-allowed}
#dmodes{display:flex;gap:5px;padding:8px 10px 0;flex-wrap:wrap}
.dbm{padding:5px 12px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer}
.dbm:hover{background:var(--color-background-secondary)}
.dbm.on{border-color:#fa7e19;background:#fff4ea;color:#fa7e19}
```

- [ ] **Step 2: Add the mode-switcher row and wrap geometry tool buttons**

Find:

```html
<div id="dw">
  <div id="dtb">
    <button class="dbt on" id="t-drag" onclick="setT('drag')"><i class="ti ti-cursor-arrow" aria-hidden="true"></i> Select</button>
    <button class="dbt" id="t-pt"   onclick="setT('pt')"  ><i class="ti ti-point-filled"  aria-hidden="true"></i> Point</button>
    <button class="dbt" id="t-seg"  onclick="setT('seg')" ><i class="ti ti-minus"          aria-hidden="true"></i> Segment</button>
    <button class="dbt" id="t-circ" onclick="setT('circ')"><i class="ti ti-circle"         aria-hidden="true"></i> Circle</button>
    <button class="dbt" id="t-poly" onclick="setT('poly')"><i class="ti ti-shape"          aria-hidden="true"></i> Polygon</button>
    <div style="flex:1"></div>
    <button class="dbt" onclick="adjZ(1.25)" style="font-size:16px;padding:3px 9px" aria-label="Zoom in">+</button>
    <button class="dbt" onclick="adjZ(0.8)"  style="font-size:16px;padding:3px 9px" aria-label="Zoom out">−</button>
    <button class="dbt" onclick="resetV()" aria-label="Reset view"><i class="ti ti-maximize" aria-hidden="true"></i></button>
    <button class="dbt" onclick="loadEx()"  style="color:#388c46;border-color:#388c46"><i class="ti ti-refresh" aria-hidden="true"></i> Example</button>
    <button class="dbt" onclick="clearAll()" style="color:#c74440;border-color:#c74440" aria-label="Clear"><i class="ti ti-x" aria-hidden="true"></i></button>
  </div>
  <canvas id="ggc"></canvas>
  <div id="dst">Select a tool and click on the canvas to start building.</div>
</div>
```

Replace with:

```html
<div id="dw">
  <div id="dmodes">
    <button class="dbm on" id="m-geometry"   onclick="setMode('geometry')">Geometry</button>
    <button class="dbm" id="m-graphing"      onclick="setMode('graphing')">Graphing</button>
    <button class="dbm" id="m-vector"        onclick="setMode('vector')">Vector</button>
    <button class="dbm" id="m-statistics"    onclick="setMode('statistics')">Statistics</button>
  </div>
  <div id="dtb">
    <div id="dtb-geo" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
      <button class="dbt on" id="t-drag" onclick="setT('drag')"><i class="ti ti-cursor-arrow" aria-hidden="true"></i> Select</button>
      <button class="dbt" id="t-pt"   onclick="setT('pt')"  ><i class="ti ti-point-filled"  aria-hidden="true"></i> Point</button>
      <button class="dbt" id="t-seg"  onclick="setT('seg')" ><i class="ti ti-minus"          aria-hidden="true"></i> Segment</button>
      <button class="dbt" id="t-circ" onclick="setT('circ')"><i class="ti ti-circle"         aria-hidden="true"></i> Circle</button>
      <button class="dbt" id="t-poly" onclick="setT('poly')"><i class="ti ti-shape"          aria-hidden="true"></i> Polygon</button>
    </div>
    <div id="dtb-placeholder" style="display:none;font-size:12.5px;color:var(--color-text-secondary)"></div>
    <div style="flex:1"></div>
    <button class="dbt" onclick="adjZ(1.25)" style="font-size:16px;padding:3px 9px" aria-label="Zoom in">+</button>
    <button class="dbt" onclick="adjZ(0.8)"  style="font-size:16px;padding:3px 9px" aria-label="Zoom out">−</button>
    <button class="dbt" onclick="resetV()" aria-label="Reset view"><i class="ti ti-maximize" aria-hidden="true"></i></button>
    <button class="dbt dbt-geoaction" onclick="loadEx()"  style="color:#388c46;border-color:#388c46"><i class="ti ti-refresh" aria-hidden="true"></i> Example</button>
    <button class="dbt dbt-geoaction" onclick="clearAll()" style="color:#c74440;border-color:#c74440" aria-label="Clear"><i class="ti ti-x" aria-hidden="true"></i></button>
  </div>
  <canvas id="ggc"></canvas>
  <div id="dst">Select a tool and click on the canvas to start building.</div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add mode-switcher markup and CSS to math-canvas template"
```

---

### Task 3: Add mode state, setMode(), and mode-aware redraw

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` section)

- [ ] **Step 1: Add the `mode` variable and placeholder messages**

Find:

```javascript
let pX=0,pY=0,Z=55;
let tool='drag',pend=[],dragId=null,hovId=null,panOn=false,panL={};
let mCX=0,mCY=0;
let pts=[],segs=[],circs=[],polys=[],pCnt=0;
```

Replace with:

```javascript
let pX=0,pY=0,Z=55;
let mode='geometry';
let tool='drag',pend=[],dragId=null,hovId=null,panOn=false,panL={};
let mCX=0,mCY=0;
let pts=[],segs=[],circs=[],polys=[],pCnt=0;

const PLACEHOLDER_MSG={
  graphing:'Graphing mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  statistics:'Statistics mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};
```

- [ ] **Step 2: Add `drawModePlaceholder()` and update `redraw()`**

Find:

```javascript
function redraw(){drawBg();drawGrid();drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
```

Replace with:

```javascript
function drawModePlaceholder(){
  X.save();
  X.fillStyle='#999';X.font=`13px ${HF}`;X.textAlign='center';
  X.fillText(PLACEHOLDER_MSG[mode]||'',C.width/2,C.height/2);
  X.restore();
}

function redraw(){
  drawBg();drawGrid();
  if(mode==='geometry'){drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else{drawModePlaceholder();}
}
```

- [ ] **Step 3: Add `setMode()`**

Find:

```javascript
function setT(t){
```

Insert immediately before it:

```javascript
function setMode(m){
  mode=m;
  document.querySelectorAll('.dbm').forEach(b=>b.classList.remove('on'));
  document.getElementById('m-'+m).classList.add('on');
  const isGeo=m==='geometry';
  document.getElementById('dtb-geo').style.display=isGeo?'flex':'none';
  const ph=document.getElementById('dtb-placeholder');
  ph.style.display=isGeo?'none':'block';
  ph.textContent=PLACEHOLDER_MSG[m]||'';
  document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isGeo);
  if(isGeo){DST.innerHTML=TMSG[tool]||'';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}

function setT(t){
```

- [ ] **Step 4: Guard pointer handlers so only Geometry mode responds to clicks/drags**

Find:

```javascript
function onDown(e){
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(tool==='drag'){
```

Replace with:

```javascript
function onDown(e){
  if(mode!=='geometry')return;
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(tool==='drag'){
```

Find:

```javascript
function onMove(e){
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(dragId){const pt=byId(dragId);if(pt){pt.x=gmx(p.x);pt.y=gmy(p.y);}redraw();return;}
```

Replace with:

```javascript
function onMove(e){
  if(mode!=='geometry')return;
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(dragId){const pt=byId(dragId);if(pt){pt.x=gmx(p.x);pt.y=gmy(p.y);}redraw();return;}
```

- [ ] **Step 5: Initialize mode explicitly on load**

Find:

```javascript
function resize(){const w=C.parentElement.clientWidth||660;C.width=w;C.height=Math.round(w*.54);redraw();}
window.addEventListener('resize',resize);
resize();loadEx();setT('drag');
```

Replace with:

```javascript
function resize(){const w=C.parentElement.clientWidth||660;C.width=w;C.height=Math.round(w*.54);redraw();}
window.addEventListener('resize',resize);
resize();loadEx();setT('drag');setMode('geometry');
```

- [ ] **Step 6: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add mode state, setMode(), and mode-aware redraw to math-canvas"
```

---

### Task 4: Syntax sanity check of the embedded script

**Files:**
- Read-only check against: `skills/math-canvas-SKILL.md`
- Temp file: `/tmp/claude-1009/-home-sofier-skills-material-K12/7490e813-5e2b-49aa-9518-7d2944e0e617/scratchpad/math-canvas-check.js`

- [ ] **Step 1: Extract the `<script>` body from the Base Template into a temp file**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/7490e813-5e2b-49aa-9518-7d2944e0e617/scratchpad/math-canvas-check.js
```

- [ ] **Step 2: Run Node's syntax checker**

Run: `node --check /tmp/claude-1009/-home-sofier-skills-material-K12/7490e813-5e2b-49aa-9518-7d2944e0e617/scratchpad/math-canvas-check.js`

Expected: no output (exit code 0). If it reports a `SyntaxError`, open `skills/math-canvas-SKILL.md`, fix the reported line in the Base Template script, and re-run this command until it passes.

- [ ] **Step 3: Commit only if a fix was needed**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "fix: syntax error in math-canvas template script"
```

(Skip this step if Step 2 passed without edits.)

---

### Task 5: Regenerate the standalone demo HTML and add the verification checklist

**Files:**
- Rename: `skills/geometry-canvas-outputs/geometry-canvas-demo.html` → `skills/math-canvas-outputs/math-canvas-demo.html`
- Modify: `skills/math-canvas-SKILL.md` (append checklist section)

- [ ] **Step 1: Rename the outputs directory and demo file**

```bash
git mv skills/geometry-canvas-outputs skills/math-canvas-outputs
git mv skills/math-canvas-outputs/geometry-canvas-demo.html skills/math-canvas-outputs/math-canvas-demo.html
```

- [ ] **Step 2: Replace the demo file's body with the updated Base Template**

Open `skills/math-canvas-outputs/math-canvas-demo.html`. It is a full HTML document (`<!DOCTYPE html>` ... `</html>`) whose `<body>` wraps the same widget markup defined in the Base Template section of `skills/math-canvas-SKILL.md`. Replace everything from the `<div id="dw">` opening tag through the closing `</script>` tag (i.e. the entire widget block) with the current, post-Task-4 Base Template content from `skills/math-canvas-SKILL.md` (the block between ` ```html ` and the closing ` ``` ` fence), so the demo file reflects the mode switcher and placeholder modes. Keep the surrounding `<!DOCTYPE html>`, `<head>` (CSS variables, Tabler icons link), and closing tags from the existing demo file unchanged.

- [ ] **Step 3: Update the demo file's `<title>`**

Find in `skills/math-canvas-outputs/math-canvas-demo.html`:

```html
<title>Geometry Canvas — Interactive Workspace</title>
```

Replace with:

```html
<title>Math Canvas — Interactive Workspace</title>
```

- [ ] **Step 4: Append the manual verification checklist to the skill doc**

Append to the end of `skills/math-canvas-SKILL.md`:

```markdown

---

## Manual Verification Checklist (Mode Switcher Baseline)

Không có test runner tự động cho widget này. Trước khi coi baseline mode-switcher là
"done", mở `skills/math-canvas-outputs/math-canvas-demo.html` trực tiếp trong browser
và kiểm tra tay:

- [ ] Load trang: thấy tam giác mẫu (Example) trong Geometry mode, 4 nút mode ở trên
      toolbar, nút "Geometry" đang active (viền cam).
- [ ] Kéo 1 điểm của tam giác — tam giác reshape, số đo cạnh cập nhật theo thời gian
      thực (giống hành vi cũ, không regress).
- [ ] Click "Graphing" — toolbar tool Geometry (Select/Point/Segment/Circle/Polygon)
      biến mất, canvas hiện chữ placeholder màu xám giữa canvas, nút Example/Clear bị
      mờ và không bấm được.
- [ ] Click "Vector", rồi "Statistics" — mỗi mode hiện đúng câu placeholder tương ứng
      của mode đó (không phải câu của mode khác).
- [ ] Click lại "Geometry" — tam giác đã kéo ở bước 2 vẫn còn nguyên đúng vị trí đã kéo
      (không bị reset về Example ban đầu), Example/Clear hoạt động lại.
- [ ] Mở DevTools console — không có lỗi JS nào xuất hiện trong toàn bộ quá trình trên.
```

- [ ] **Step 5: Commit**

```bash
git add skills/math-canvas-outputs skills/math-canvas-SKILL.md
git commit -m "feat: regenerate math-canvas demo HTML and add manual verification checklist"
```

---

### Task 6: Run the manual verification checklist

**Files:** none (verification only)

- [ ] **Step 1: Open the demo file in a browser**

```bash
xdg-open skills/math-canvas-outputs/math-canvas-demo.html 2>/dev/null || echo "Open skills/math-canvas-outputs/math-canvas-demo.html manually in a browser"
```

- [ ] **Step 2: Walk through every checkbox in the "Manual Verification Checklist" section added in Task 5, Step 4**

For each unchecked box: perform the action, confirm the expected result, then check it off in `skills/math-canvas-SKILL.md`.

- [ ] **Step 3: If any checklist item fails, fix the underlying code in `skills/math-canvas-SKILL.md` and `skills/math-canvas-outputs/math-canvas-demo.html` (keeping them in sync), then re-run Task 4's syntax check and retest before proceeding.**

- [ ] **Step 4: Commit the checked-off checklist**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "docs: confirm math-canvas mode-switcher baseline passes manual verification"
```
