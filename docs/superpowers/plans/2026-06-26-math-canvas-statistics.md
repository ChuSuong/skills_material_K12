# Math Canvas — Statistics Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Statistics mode in `skills/math-canvas-SKILL.md` — a left panel accepting comma/space/newline-separated numbers, auto-rendering a frequency histogram on the canvas.

**Architecture:** Add `let dataset = []` to global state; add `#dstats-panel` (180px) to `#dw-body` alongside the existing `#dgraph-panel`; `drawChart()` renders a histogram in canvas pixel coordinates (skips coordinate-plane transforms and grid). `redraw()` gains a `statistics` branch calling `drawChart()` without `drawGrid()`. `setMode()`, `clearAll()`, and `loadEx()` handle statistics state the same pattern as graphing mode.

**Tech Stack:** Plain HTML/Canvas2D/vanilla JS widget in a Markdown skill file. No build step, no framework. Syntax verification via `node --check`. Manual browser verification.

**Spec:** `docs/superpowers/specs/2026-06-25-math-canvas-design.md` (parent architecture spec, section 3.1 and 3.3)

---

### Task 0: Cleanup — remove dead `PLACEHOLDER_MSG.graphing` entry

Graphing mode is fully implemented; its entry in `PLACEHOLDER_MSG` is dead code that was never removed.

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Remove `graphing` from `PLACEHOLDER_MSG`**

In `skills/math-canvas-SKILL.md`, find:

```javascript
const PLACEHOLDER_MSG={
  graphing:'Graphing mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  statistics:'Statistics mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};
```

Replace with:

```javascript
const PLACEHOLDER_MSG={
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  statistics:'Statistics mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};
```

- [ ] **Step 2: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0). Fix any SyntaxError before continuing.

- [ ] **Step 3: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "chore: remove dead PLACEHOLDER_MSG.graphing (graphing mode is implemented)"
```

---

### Task 1: Add `dataset` state variable + Statistics panel CSS

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block + `<style>` block)

- [ ] **Step 1: Add `dataset` to global state**

Find:

```javascript
let funcs=[],fCnt=0,_fTimers={};
```

Replace with:

```javascript
let funcs=[],fCnt=0,_fTimers={};
let dataset=[];
```

- [ ] **Step 2: Add statistics panel CSS — append after the last existing CSS rule**

Find (this is the last CSS rule before `</style>`):

```css
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
```

Replace with:

```css
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
#dstats-panel{width:180px;flex-shrink:0;border-right:.5px solid var(--color-border-tertiary);display:flex;flex-direction:column;background:var(--color-background-primary)}
#dstats-inner{flex:1;display:flex;flex-direction:column;padding:8px;gap:6px;overflow-y:auto}
#dstats-label{font-size:11.5px;font-weight:600;color:var(--color-text-secondary)}
#dstats-input{flex:1;resize:none;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);padding:5px;font-size:12px;font-family:inherit;background:var(--color-background-primary);color:var(--color-text-primary);min-height:80px}
#dstats-binrow{display:flex;align-items:center;font-size:12px;color:var(--color-text-secondary)}
#dstats-binrow input[type=number]{width:44px;margin-left:6px;padding:2px 4px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-family:inherit;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)}
```

- [ ] **Step 3: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add dataset state and statistics panel CSS to math-canvas"
```

---

### Task 2: Add Statistics panel HTML

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template HTML)

- [ ] **Step 1: Add `#dstats-panel` inside `#dw-body`, before `<canvas>`**

Find:

```html
  <div id="dw-body">
    <div id="dgraph-panel" style="display:none">
      <div id="dgraph-list"></div>
      <button id="dgraph-add" onclick="addFunc()">+ Thêm hàm</button>
    </div>
    <canvas id="ggc"></canvas>
  </div>
```

Replace with:

```html
  <div id="dw-body">
    <div id="dgraph-panel" style="display:none">
      <div id="dgraph-list"></div>
      <button id="dgraph-add" onclick="addFunc()">+ Thêm hàm</button>
    </div>
    <div id="dstats-panel" style="display:none">
      <div id="dstats-inner">
        <div id="dstats-label">Nhập số liệu</div>
        <textarea id="dstats-input" oninput="onStatsInput(this.value)" placeholder="VD: 3, 7, 2, 9, 4, 6, 1, 8, 5, 3..."></textarea>
        <div id="dstats-binrow">Bins <input type="number" id="dstats-bins" value="10" min="2" max="50" oninput="redraw()"></div>
      </div>
    </div>
    <canvas id="ggc"></canvas>
  </div>
```

- [ ] **Step 2: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add statistics panel HTML to math-canvas"
```

---

### Task 3: Add `parseDataset()`, `onStatsInput()`, `drawChart()`; update `redraw()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Add `parseDataset()` and `onStatsInput()` before `byId()`**

Find:

```javascript
function byId(id){return pts.find(p=>p.id===id);}
```

Insert immediately before it:

```javascript
function parseDataset(raw){
  return raw.split(/[\s,;\n]+/).filter(s=>s.trim()).map(Number).filter(n=>isFinite(n));
}
function onStatsInput(val){
  dataset=parseDataset(val);
  const n=dataset.length;
  DST.innerHTML=n>0?`Statistics mode — ${n} số.`:'Statistics mode — nhập số liệu vào panel trái.';
  redraw();
}

```

- [ ] **Step 2: Add `drawChart()` and update `redraw()` with statistics branch**

`drawChart()` renders in raw canvas pixels — it does not use `gsx/gsy/gmx/gmy`. `redraw()` is updated to move `drawGrid()` into the per-mode branches so statistics mode gets a clean white canvas.

Find:

```javascript
function redraw(){
  drawBg();drawGrid();
  if(mode==='geometry'){drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else if(mode==='graphing'){drawFuncs();}
  else{drawModePlaceholder();}
}
```

Replace with:

```javascript
function drawChart(){
  const pad={t:30,r:20,b:40,l:50};
  const cw=C.width-pad.l-pad.r,ch=C.height-pad.t-pad.b;
  if(!dataset.length){
    X.save();X.fillStyle='#999';X.font=`13px ${HF}`;X.textAlign='center';
    X.fillText('Nhập số liệu vào panel trái để vẽ biểu đồ.',C.width/2,C.height/2);
    X.restore();return;
  }
  const dMin=Math.min(...dataset),dMax=Math.max(...dataset);
  if(dMin===dMax){
    X.save();
    X.fillStyle=DCOLS[0];X.fillRect(pad.l+cw*0.3,pad.t,cw*0.4,ch);
    X.strokeStyle='#222';X.lineWidth=1;
    X.beginPath();X.moveTo(pad.l,pad.t);X.lineTo(pad.l,pad.t+ch);X.lineTo(pad.l+cw,pad.t+ch);X.stroke();
    X.fillStyle='#555';X.font=`11px ${HF}`;X.textAlign='center';
    X.fillText(dMin,pad.l+cw/2,pad.t+ch+14);
    X.textAlign='left';X.fillStyle='#888';
    X.fillText(`n=${dataset.length}  value=${dMin}`,pad.l,pad.t-8);
    X.restore();return;
  }
  const binsEl=document.getElementById('dstats-bins');
  const bins=Math.max(2,Math.min(50,parseInt(binsEl&&binsEl.value)||10));
  const binW=(dMax-dMin)/bins;
  const counts=new Array(bins).fill(0);
  for(const v of dataset){const bi=Math.min(Math.floor((v-dMin)/binW),bins-1);counts[bi]++;}
  const maxCount=Math.max(...counts);
  const bw=cw/bins;
  X.save();
  X.fillStyle='#fafafa';X.fillRect(pad.l,pad.t,cw,ch);
  X.strokeStyle='#e8e8e8';X.lineWidth=0.5;
  for(let i=0;i<=4;i++){const y=pad.t+ch-(i/4)*ch;X.beginPath();X.moveTo(pad.l,y);X.lineTo(pad.l+cw,y);X.stroke();}
  for(let i=0;i<bins;i++){
    const bh=maxCount>0?(counts[i]/maxCount)*ch:0;
    const bx=pad.l+i*bw,by=pad.t+ch-bh;
    X.fillStyle=DCOLS[0];X.fillRect(bx+1,by,bw-2,bh);
  }
  X.strokeStyle='#222';X.lineWidth=1;
  X.beginPath();X.moveTo(pad.l,pad.t);X.lineTo(pad.l,pad.t+ch);X.lineTo(pad.l+cw,pad.t+ch);X.stroke();
  X.fillStyle='#555';X.font=`11px ${HF}`;
  const xStep=Math.ceil(bins/6);
  for(let i=0;i<=bins;i+=xStep){
    const xv=dMin+i*binW;
    X.textAlign='center';
    X.fillText(xv%1===0?xv:xv.toFixed(1),pad.l+i*bw,pad.t+ch+14);
  }
  X.textAlign='right';
  for(let i=0;i<=4;i++){
    const y=pad.t+ch-(i/4)*ch;
    X.fillText(Math.round((i/4)*maxCount),pad.l-5,y+4);
  }
  const mean=(dataset.reduce((a,b)=>a+b,0)/dataset.length).toFixed(2);
  X.textAlign='left';X.fillStyle='#888';
  X.fillText(`n=${dataset.length}  mean=${mean}  min=${dMin}  max=${dMax}`,pad.l,pad.t-8);
  X.restore();
}

function redraw(){
  drawBg();
  if(mode==='geometry'){drawGrid();drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else if(mode==='graphing'){drawGrid();drawFuncs();}
  else if(mode==='statistics'){drawChart();}
  else{drawGrid();drawModePlaceholder();}
}
```

- [ ] **Step 3: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0). Fix any SyntaxError before continuing.

- [ ] **Step 4: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add parseDataset/onStatsInput/drawChart and statistics branch in redraw()"
```

---

### Task 4: Update `setMode()`, `clearAll()`, `loadEx()`; add `loadExStats()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Update `setMode()` — panel visibility, button states, status message**

Find:

```javascript
function setMode(m){
  mode=m;
  document.querySelectorAll('.dbm').forEach(b=>b.classList.remove('on'));
  document.getElementById('m-'+m).classList.add('on');
  const isGeo=m==='geometry';
  document.getElementById('dtb-geo').style.display=isGeo?'flex':'none';
  const isActive=m==='geometry'||m==='graphing';
  document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isActive);
  const ph=document.getElementById('dtb-placeholder');
  ph.style.display=(isGeo||m==='graphing')?'none':'block';
  ph.textContent=PLACEHOLDER_MSG[m]||'';
  const panel=document.getElementById('dgraph-panel');
  if(m==='graphing'){panel.style.display='flex';if(funcs.length===0)loadExGraphing();}
  else{panel.style.display='none';}
  if(isGeo){DST.innerHTML=TMSG[tool]||'';}
  else if(m==='graphing'){DST.innerHTML='Graphing mode — gõ biểu thức vào panel trái để vẽ đồ thị.';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}
```

Replace with:

```javascript
function setMode(m){
  mode=m;
  document.querySelectorAll('.dbm').forEach(b=>b.classList.remove('on'));
  document.getElementById('m-'+m).classList.add('on');
  const isGeo=m==='geometry';
  document.getElementById('dtb-geo').style.display=isGeo?'flex':'none';
  const isActive=m==='geometry'||m==='graphing'||m==='statistics';
  document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isActive);
  const ph=document.getElementById('dtb-placeholder');
  ph.style.display=(isGeo||m==='graphing'||m==='statistics')?'none':'block';
  ph.textContent=PLACEHOLDER_MSG[m]||'';
  const gPanel=document.getElementById('dgraph-panel');
  const sPanel=document.getElementById('dstats-panel');
  if(m==='graphing'){gPanel.style.display='flex';sPanel.style.display='none';if(funcs.length===0)loadExGraphing();}
  else if(m==='statistics'){sPanel.style.display='flex';gPanel.style.display='none';if(dataset.length===0)loadExStats();}
  else{gPanel.style.display='none';sPanel.style.display='none';}
  if(isGeo){DST.innerHTML=TMSG[tool]||'';}
  else if(m==='graphing'){DST.innerHTML='Graphing mode — gõ biểu thức vào panel trái để vẽ đồ thị.';}
  else if(m==='statistics'){DST.innerHTML='Statistics mode — nhập số liệu vào panel trái.';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}
```

- [ ] **Step 2: Update `clearAll()` to reset `dataset` and clear the textarea**

Find:

```javascript
function clearAll(){
  pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  redraw();DST.innerHTML='Canvas cleared.';
}
```

Replace with:

```javascript
function clearAll(){
  pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  dataset=[];
  const inp=document.getElementById('dstats-input');if(inp)inp.value='';
  redraw();DST.innerHTML='Canvas cleared.';
}
```

- [ ] **Step 3: Update `loadEx()` and add `loadExStats()`**

Find:

```javascript
function loadEx(){
  if(mode==='graphing'){loadExGraphing();return;}
  clearAll();
  const A=addPt(-3,0),B=addPt(3,0),Cp=addPt(0,3);
  segs.push({a:A.id,b:B.id},{a:B.id,b:Cp.id},{a:Cp.id,b:A.id});
  polys.push([A.id,B.id,Cp.id]);
  DST.innerHTML='<strong>Drag any point</strong> to reshape the triangle.';
  redraw();
}
function loadExGraphing(){
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  addFunc('x^2');
  addFunc('sin(x)');
  DST.innerHTML='Graphing mode — gõ biểu thức vào panel trái để vẽ đồ thị.';
}
```

Replace with:

```javascript
function loadEx(){
  if(mode==='graphing'){loadExGraphing();return;}
  if(mode==='statistics'){loadExStats();return;}
  clearAll();
  const A=addPt(-3,0),B=addPt(3,0),Cp=addPt(0,3);
  segs.push({a:A.id,b:B.id},{a:B.id,b:Cp.id},{a:Cp.id,b:A.id});
  polys.push([A.id,B.id,Cp.id]);
  DST.innerHTML='<strong>Drag any point</strong> to reshape the triangle.';
  redraw();
}
function loadExGraphing(){
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  addFunc('x^2');
  addFunc('sin(x)');
  DST.innerHTML='Graphing mode — gõ biểu thức vào panel trái để vẽ đồ thị.';
}
function loadExStats(){
  const ex='72,68,74,65,71,69,73,70,67,75,72,68,71,69,70,73,66,74,70,71,68,72,69,71,70';
  const inp=document.getElementById('dstats-input');if(inp)inp.value=ex;
  dataset=parseDataset(ex);
  DST.innerHTML=`Statistics mode — ${dataset.length} số mẫu (điểm thi học sinh).`;
  redraw();
}
```

- [ ] **Step 4: Remove dead `statistics` entry from `PLACEHOLDER_MSG`**

Now that statistics is implemented, `PLACEHOLDER_MSG.statistics` is never displayed. Remove it.

Find:

```javascript
const PLACEHOLDER_MSG={
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  statistics:'Statistics mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};
```

Replace with:

```javascript
const PLACEHOLDER_MSG={
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};
```

- [ ] **Step 5: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0). Fix any SyntaxError before continuing.

- [ ] **Step 6: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: update setMode/clearAll/loadEx for statistics mode in math-canvas"
```

---

### Task 5: Sync demo HTML

**Files:**
- Modify: `skills/math-canvas-outputs/math-canvas-demo.html`

- [ ] **Step 1: Replace the widget block in the demo HTML**

Open `skills/math-canvas-outputs/math-canvas-demo.html`. The body wraps the widget in `<div class="wrap">`.

Replace everything from `<h2 class="sr-only">` through the closing `</script>` tag with the current Base Template from `skills/math-canvas-SKILL.md` — the block between the opening ` ```html ` fence and its matching ` ``` ` (the entire `<h2 class="sr-only">…</script>` section).

Keep the surrounding `<!DOCTYPE html>`, `<head>`, `<body><div class="wrap">`, closing `</div></body></html>` unchanged.

- [ ] **Step 2: Commit**

```bash
git add skills/math-canvas-outputs/math-canvas-demo.html
git commit -m "feat: sync math-canvas demo HTML with statistics mode"
```

---

### Task 6: Manual verification + documentation update

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (status note + append checklist)
- Modify: `skills/math-canvas-outputs/math-canvas-demo.html` (if fixes needed)

- [ ] **Step 1: Open the demo in a browser**

```bash
xdg-open skills/math-canvas-outputs/math-canvas-demo.html 2>/dev/null || echo "Open skills/math-canvas-outputs/math-canvas-demo.html in a browser"
```

- [ ] **Step 2: Walk through each checklist item**

| # | Action | Expected |
|---|--------|----------|
| 1 | Switch to Statistics | Left panel (180px) appears, canvas shows "Nhập số liệu vào panel trái để vẽ biểu đồ.", Example/Clear enabled |
| 2 | Click Example | 25 điểm thi load vào textarea, histogram hiện ngay, status bar: "25 số mẫu (điểm thi học sinh)." |
| 3 | Xóa textarea, nhập `5, 10, 5, 15, 10, 5, 20` | Histogram 7 số vẽ ngay khi gõ, stats đúng (n=7, mean=8.57) |
| 4 | Nhập `42` (một số duy nhất) | Một cột cao 40% ở giữa, không crash, label hiện "value=42" |
| 5 | Nhập `a, b, c` | `dataset=[]`, canvas hiện "Nhập số liệu vào panel trái để vẽ biểu đồ." |
| 6 | Nhập `1, 2, abc, 3, 4` | Parse bỏ qua "abc", dataset = [1,2,3,4], histogram 4 số |
| 7 | Thay Bins từ 10 sang 3 | Histogram redraw ngay với 3 bins, không crash |
| 8 | Click Clear | Textarea cleared, dataset=[], canvas hiện placeholder |
| 9 | Switch sang Geometry, vẽ điểm, switch lại Statistics | Dataset còn nguyên trong textarea, geometry còn nguyên |
| 10 | Switch sang Graphing, switch lại Statistics | Funcs còn nguyên, dataset còn nguyên |
| 11 | Zoom/pan buttons (+/−/reset) trong Statistics mode | Buttons hoạt động (không crash) nhưng không ảnh hưởng chart (chart dùng pixel coords) |
| 12 | DevTools console | Không có lỗi JS trong toàn bộ quá trình trên |

- [ ] **Step 3: Fix any failing items**

Fix pattern: edit `skills/math-canvas-SKILL.md` → syntax check → update demo HTML → retest.

Syntax check:
```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/ccac0137-0c73-4056-a8a3-ee2256b86cf2/scratchpad/math-canvas-check.js
```

- [ ] **Step 4: Update status note in SKILL.md**

Find:

```markdown
- **Graphing, Vector, Statistics mode** — toolbar/mode switcher đã có, nhưng canvas
  hiện chỉ hiện placeholder "sắp có". Sẽ được triển khai ở các bản sau (xem
  `docs/superpowers/specs/2026-06-25-math-canvas-design.md`).
```

Replace with:

```markdown
- **Graphing mode** — đầy đủ: function plotter, implicit multiplication, tối đa 8 hàm đồng thời.
- **Statistics mode** — đầy đủ: frequency histogram từ comma/space-separated numbers, tự chọn số bins.
- **Vector mode** — placeholder, sẽ triển khai ở bản sau.
```

- [ ] **Step 5: Append verification checklist to SKILL.md**

Append at the end of `skills/math-canvas-SKILL.md`:

```markdown

## Manual Verification Checklist (Statistics Mode)

- [ ] Switch to Statistics: panel 180px xuất hiện, canvas hiện placeholder, Example/Clear enabled
- [ ] Click Example: 25 điểm thi load, histogram vẽ với n/mean/min/max đúng
- [ ] Nhập `5, 10, 5, 15, 10, 5, 20`: histogram 7 số đúng hình dạng
- [ ] Nhập `42` (một giá trị): một cột giữa, không crash
- [ ] Nhập `a, b, c`: dataset rỗng, canvas hiện placeholder
- [ ] Nhập `1, 2, abc, 3, 4`: bỏ qua ký tự không hợp lệ, histogram 4 số
- [ ] Thay Bins → 3: histogram redraw ngay với 3 bins
- [ ] Click Clear: textarea cleared, dataset rỗng, canvas hiện placeholder
- [ ] Switch Geometry → vẽ điểm → switch Statistics: dataset còn nguyên trong textarea
- [ ] Switch Graphing → switch Statistics: funcs và dataset cả hai còn nguyên
- [ ] Zoom/pan buttons: không crash, không ảnh hưởng chart
- [ ] DevTools console: không có lỗi JS
```

After verifying all items, change `- [ ]` to `- [x]` for each passed item.

- [ ] **Step 6: Commit**

```bash
git add skills/math-canvas-SKILL.md skills/math-canvas-outputs/math-canvas-demo.html
git commit -m "docs: confirm math-canvas statistics mode passes manual verification"
```
