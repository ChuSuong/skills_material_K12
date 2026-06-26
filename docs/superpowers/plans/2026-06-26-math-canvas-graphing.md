# Math Canvas — Graphing Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Graphing mode in `skills/math-canvas-SKILL.md` — a left panel listing y = f(x) functions, auto-plotting on every keystroke, using a `Function()` + text-replacement expression parser.

**Architecture:** Add a `#dw-body` flex-row wrapper between the toolbar and status bar; the left `#dgraph-panel` (160 px) holds the function list, the canvas takes the remaining width. `funcs[]` holds compiled function objects; `redraw()` routes to `drawFuncs()` in graphing mode. `compileExpr()` handles notation transforms (caret, implicit multiplication, math function names) then compiles via `new Function()`.

**Tech Stack:** Plain HTML/Canvas2D/vanilla JS widget in a Markdown skill file. No build step, no framework, no external libraries. Syntax verification via `node --check`. Manual browser verification.

**Spec:** `docs/superpowers/specs/2026-06-26-math-canvas-graphing-design.md`

---

### Task 1: Add `#dw-body` flex wrapper — DOM + CSS + resize fix

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<style>` block, HTML, and `resize()`)

- [ ] **Step 1: Add `display:flex;flex-direction:column` to `#dw` CSS rule**

In `skills/math-canvas-SKILL.md`, find:

```css
#dw{border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
```

Replace with:

```css
#dw{border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;display:flex;flex-direction:column}
```

- [ ] **Step 2: Add `#dw-body` CSS and update `#ggc`**

Find:

```css
#ggc{display:block;touch-action:none}
```

Replace with:

```css
#dw-body{display:flex;flex:1}
#ggc{display:block;touch-action:none;flex:1;min-width:0}
```

- [ ] **Step 3: Wrap `<canvas>` in `#dw-body`**

Find:

```html
  <canvas id="ggc"></canvas>
  <div id="dst">Select a tool and click on the canvas to start building.</div>
```

Replace with:

```html
  <div id="dw-body">
    <canvas id="ggc"></canvas>
  </div>
  <div id="dst">Select a tool and click on the canvas to start building.</div>
```

- [ ] **Step 4: Fix `resize()` to subtract panel width**

Find:

```javascript
function resize(){const w=C.parentElement.clientWidth||660;C.width=w;C.height=Math.round(w*.54);redraw();}
```

Replace with:

```javascript
function resize(){const panel=document.getElementById('dgraph-panel');const panelW=(panel&&panel.style.display!=='none')?panel.offsetWidth:0;const w=(C.parentElement.clientWidth-panelW)||660;C.width=w;C.height=Math.round(w*.54);redraw();}
```

- [ ] **Step 5: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0). Fix any SyntaxError before continuing.

- [ ] **Step 6: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add #dw-body flex wrapper and fix resize() for graphing panel"
```

---

### Task 2: Add `#dgraph-panel` HTML and CSS

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<style>` block and HTML)

- [ ] **Step 1: Add panel CSS rules after `#ggc` rule**

Find (this is the line right after `#ggc` after Task 1's changes):

```css
#dw-body{display:flex;flex:1}
#ggc{display:block;touch-action:none;flex:1;min-width:0}
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
```

Replace with:

```css
#dw-body{display:flex;flex:1}
#ggc{display:block;touch-action:none;flex:1;min-width:0}
#dgraph-panel{width:160px;flex-shrink:0;border-right:.5px solid var(--color-border-tertiary);display:flex;flex-direction:column;background:var(--color-background-primary);overflow-y:auto}
#dgraph-list{flex:1;padding:6px;display:flex;flex-direction:column;gap:4px}
#dgraph-add{margin:0 6px 6px;padding:5px 8px;border:1px dashed var(--color-border-secondary);border-radius:var(--border-radius-md);background:none;color:var(--color-text-secondary);font-size:12px;cursor:pointer;font-family:inherit;text-align:left}
#dgraph-add:hover{background:var(--color-background-secondary)}
#dgraph-add:disabled{opacity:.4;cursor:not-allowed}
.frow{display:flex;align-items:flex-start;gap:4px}
.fcolor{width:10px;height:10px;border-radius:2px;flex-shrink:0;margin-top:6px}
.finput-wrap{flex:1;min-width:0}
.finput-wrap input{width:100%;box-sizing:border-box;font-size:12px;padding:3px 5px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-family:inherit;background:var(--color-background-primary);color:var(--color-text-primary)}
.finput-wrap input.err{border-color:#c74440}
.ferr{font-size:10px;color:#c74440;margin-top:2px;line-height:1.3;display:none}
.fdel{padding:2px 5px;border:none;background:none;color:var(--color-text-secondary);cursor:pointer;font-size:14px;line-height:1;flex-shrink:0;margin-top:2px}
.fdel:hover{color:#c74440}
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
```

- [ ] **Step 2: Add panel HTML inside `#dw-body`, before `<canvas>`**

Find:

```html
  <div id="dw-body">
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
    <canvas id="ggc"></canvas>
  </div>
```

- [ ] **Step 3: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add #dgraph-panel HTML and CSS to math-canvas base template"
```

---

### Task 3: Add state variables and `compileExpr()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Add `funcs`, `fCnt`, `_fTimers` state variables**

Find:

```javascript
let pts=[],segs=[],circs=[],polys=[],pCnt=0;
```

Replace with:

```javascript
let pts=[],segs=[],circs=[],polys=[],pCnt=0;
let funcs=[],fCnt=0,_fTimers={};
```

- [ ] **Step 2: Add `compileExpr()` function**

Find:

```javascript
function byId(id){return pts.find(p=>p.id===id);}
```

Insert immediately before it:

```javascript
function compileExpr(raw){
  let s=raw.trim();if(!s)return null;
  s=s.replace(/\^/g,'**');
  s=s.replace(/(\d)(x|pi|\()/g,'$1*$2');
  s=s.replace(/(x|\))(\d|\()/g,'$1*$2');
  s=s.replace(/(x)\s*(x)/g,'$1*$2');
  s=s.replace(/\bpi\b/g,'Math.PI');
  s=s.replace(/\be\b/g,'Math.E');
  const fns=['asin','acos','atan','sin','cos','tan','sqrt','abs','log2','log10','log','floor','ceil','round'];
  for(const f of fns)s=s.replace(new RegExp(`\\b${f}\\b`,'g'),`Math.${f}`);
  return new Function('x',`'use strict';return(${s});`);
}

```

- [ ] **Step 3: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add funcs state and compileExpr() to math-canvas"
```

---

### Task 4: Add `addFunc()`, `removeFunc()`, `onFuncInput()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Insert three panel-management functions before `setT()`**

Find:

```javascript
function setT(t){
```

Insert immediately before it:

```javascript
function addFunc(expr=''){
  if(funcs.length>=8)return;
  const id='f'+fCnt;
  const color=DCOLS[fCnt%DCOLS.length];
  fCnt++;
  const fn={id,expr,color,compiled:null,error:null};
  if(expr.trim()){try{fn.compiled=compileExpr(expr);}catch(e){fn.error=e.message;}}
  funcs.push(fn);
  const list=document.getElementById('dgraph-list');
  const row=document.createElement('div');
  row.id='frow-'+id;row.className='frow';
  row.innerHTML=`<div class="fcolor" style="background:${color}"></div><div class="finput-wrap"><input id="finput-${id}" value="${expr.replace(/"/g,'&quot;')}" oninput="onFuncInput('${id}',this.value)"/><div id="ferr-${id}" class="ferr"></div></div><button class="fdel" onclick="removeFunc('${id}')">×</button>`;
  list.appendChild(row);
  document.getElementById('dgraph-add').disabled=funcs.length>=8;
  document.getElementById('finput-'+id).focus();
  redraw();
}
function removeFunc(id){
  funcs=funcs.filter(f=>f.id!==id);
  const row=document.getElementById('frow-'+id);if(row)row.remove();
  document.getElementById('dgraph-add').disabled=funcs.length>=8;
  redraw();
}
function onFuncInput(id,val){
  clearTimeout(_fTimers[id]);
  _fTimers[id]=setTimeout(()=>{
    const fn=funcs.find(f=>f.id===id);if(!fn)return;
    fn.expr=val;
    const inp=document.getElementById('finput-'+id);
    const errEl=document.getElementById('ferr-'+id);
    fn.error=null;fn.compiled=null;
    if(val.trim()){
      try{fn.compiled=compileExpr(val);inp.classList.remove('err');errEl.style.display='none';}
      catch(e){fn.error=e.message;inp.classList.add('err');errEl.textContent=e.message;errEl.style.display='block';}
    }else{inp.classList.remove('err');errEl.style.display='none';}
    redraw();
  },150);
}

```

- [ ] **Step 2: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add addFunc/removeFunc/onFuncInput panel management to math-canvas"
```

---

### Task 5: Add `drawFuncs()` and update `redraw()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Add `drawFuncs()` before `redraw()`**

Find:

```javascript
function redraw(){
  drawBg();drawGrid();
  if(mode==='geometry'){drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else{drawModePlaceholder();}
}
```

Replace with:

```javascript
function drawFuncs(){
  for(const fn of funcs){
    if(!fn.compiled)continue;
    X.save();
    X.strokeStyle=fn.color;X.lineWidth=2;X.lineJoin='round';
    X.beginPath();let penDown=false;
    const steps=400;
    for(let i=0;i<=steps;i++){
      const sx=i/steps*C.width,mx=gmx(sx);
      let my;try{my=fn.compiled(mx);}catch{penDown=false;continue;}
      if(!isFinite(my)){penDown=false;continue;}
      const sy=gsy(my);
      if(!penDown){X.moveTo(sx,sy);penDown=true;}else X.lineTo(sx,sy);
    }
    X.stroke();X.restore();
  }
}

function redraw(){
  drawBg();drawGrid();
  if(mode==='geometry'){drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else if(mode==='graphing'){drawFuncs();}
  else{drawModePlaceholder();}
}
```

- [ ] **Step 2: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 3: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: add drawFuncs() and graphing branch to redraw() in math-canvas"
```

---

### Task 6: Update `setMode()`, `clearAll()`, and `loadEx()`

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (Base Template `<script>` block)

- [ ] **Step 1: Update `setMode()` — panel visibility, button fix, placeholder fix**

Find (from the `ph` lines through the closing `}` of `setMode()`):

```javascript
  const ph=document.getElementById('dtb-placeholder');
  ph.style.display=isGeo?'none':'block';
  ph.textContent=PLACEHOLDER_MSG[m]||'';
  document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isGeo);
  if(isGeo){DST.innerHTML=TMSG[tool]||'';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}
```

Replace with:

```javascript
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

- [ ] **Step 2: Update `clearAll()` to reset funcs and panel DOM**

Find:

```javascript
function clearAll(){pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;redraw();DST.innerHTML='Canvas cleared.';}
```

Replace with:

```javascript
function clearAll(){
  pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  redraw();DST.innerHTML='Canvas cleared.';
}
```

- [ ] **Step 3: Make `loadEx()` mode-aware and add `loadExGraphing()`**

Find:

```javascript
/* ════════════════════════════════════════════════════
   CUSTOMIZE: thay loadEx() bằng starter state phù hợp
   ════════════════════════════════════════════════════ */
function loadEx(){
  clearAll();
  const A=addPt(-3,0),B=addPt(3,0),Cp=addPt(0,3);
  segs.push({a:A.id,b:B.id},{a:B.id,b:Cp.id},{a:Cp.id,b:A.id});
  polys.push([A.id,B.id,Cp.id]);
  DST.innerHTML='<strong>Drag any point</strong> to reshape the triangle.';
  redraw();
}
/* ════════════════════════════════════════════════════ */
```

Replace with:

```javascript
/* ════════════════════════════════════════════════════
   CUSTOMIZE: thay loadEx() bằng starter state phù hợp
   ════════════════════════════════════════════════════ */
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
/* ════════════════════════════════════════════════════ */
```

- [ ] **Step 4: Syntax check**

```bash
awk '/^<script>$/{flag=1;next}/^<\/script>$/{flag=0}flag' skills/math-canvas-SKILL.md > /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js && node --check /tmp/claude-1009/-home-sofier-skills-material-K12/c50fb8f9-d989-4928-9009-1680c70696b4/scratchpad/math-canvas-check.js
```

Expected: no output (exit code 0).

- [ ] **Step 5: Commit**

```bash
git add skills/math-canvas-SKILL.md
git commit -m "feat: update setMode/clearAll/loadEx for graphing mode in math-canvas"
```

---

### Task 7: Sync demo HTML

**Files:**
- Modify: `skills/math-canvas-outputs/math-canvas-demo.html`

- [ ] **Step 1: Replace the widget block in the demo HTML**

Open `skills/math-canvas-outputs/math-canvas-demo.html`. The file is a full HTML document whose body contains a `.wrap` div wrapping the widget (`<h2 class="sr-only">` through `</script>`).

Replace everything from `<h2 class="sr-only">` through the closing `</script>` tag with the current Base Template content from `skills/math-canvas-SKILL.md` — the block between the ` ```html ` and ` ``` ` fences (lines ~122 to ~445 of the SKILL.md).

Keep the surrounding `<!DOCTYPE html>`, `<head>`, `<body><div class="wrap">`, closing `</div></body></html>` unchanged.

- [ ] **Step 2: Update the title if needed**

Verify `<title>Math Canvas — Interactive Workspace</title>` is still present. No change needed if it already reads "Math Canvas".

- [ ] **Step 3: Commit**

```bash
git add skills/math-canvas-outputs/math-canvas-demo.html
git commit -m "feat: sync math-canvas demo HTML with graphing mode changes"
```

---

### Task 8: Manual verification and checklist

**Files:**
- Modify: `skills/math-canvas-SKILL.md` (check boxes in the Manual Verification Checklist section)

- [ ] **Step 1: Open the demo in a browser**

```bash
xdg-open skills/math-canvas-outputs/math-canvas-demo.html 2>/dev/null || echo "Open skills/math-canvas-outputs/math-canvas-demo.html in a browser"
```

- [ ] **Step 2: Walk through each checklist item below and verify the expected result**

| # | Action | Expected |
|---|--------|----------|
| 1 | Switch to Graphing | Left panel appears, 2 functions (`x^2`, `sin(x)`) plotted with blue and red colors |
| 2 | Gõ `2x+1` vào ô mới | Đường thẳng xuất hiện ngay (implicit mult hoạt động) |
| 3 | Gõ `x^3-2x` | Cubic curve đúng hình dạng |
| 4 | Gõ `x^^2` | Border đỏ, error message hiện dưới input, canvas không crash |
| 5 | Gõ `log(x)` | Gap ở x ≤ 0, phần x > 0 vẽ bình thường |
| 6 | Xóa một hàm bằng × | Đường đó biến mất, hàm còn lại giữ nguyên |
| 7 | Switch sang Geometry, vẽ điểm, switch lại Graphing | Funcs còn nguyên, geometry còn nguyên |
| 8 | Zoom/pan trong Graphing | Tất cả đồ thị redraw đúng |
| 9 | Click Example trong Graphing | `loadExGraphing()` chạy: reset về 2 hàm mẫu |
| 10 | Click Clear | Xóa hết funcs và panel rows |
| 11 | DevTools console | Không có lỗi JS |

- [ ] **Step 3: For each failing item, fix the underlying code in `skills/math-canvas-SKILL.md` (and keep demo HTML in sync), re-run syntax check, then retest**

Fix pattern: edit SKILL.md → `node --check` → update demo HTML → retest.

- [ ] **Step 4: Check off all boxes in the SKILL.md verification section**

Append a new checklist section to `skills/math-canvas-SKILL.md`:

```markdown

## Manual Verification Checklist (Graphing Mode)

- [ ] Switch to Graphing: left panel appears, 2 hàm mẫu (`x^2`, `sin(x)`) plotted
- [ ] Gõ `2x+1` → đường thẳng xuất hiện ngay (implicit multiplication)
- [ ] Gõ `x^3-2x` → cubic curve đúng hình dạng
- [ ] Gõ `x^^2` → border đỏ, error message, canvas không crash
- [ ] `log(x)` → gap ở x ≤ 0, x > 0 vẽ bình thường
- [ ] Xóa hàm bằng × → đường biến mất, hàm còn lại giữ nguyên
- [ ] Switch Geometry → vẽ điểm → switch Graphing lại: funcs còn nguyên
- [ ] Zoom/pan → đồ thị redraw đúng
- [ ] Example trong Graphing → reset về 2 hàm mẫu
- [ ] Clear → xóa hết funcs và DOM rows
- [ ] DevTools console: không có lỗi JS
```

After verifying all items, change `- [ ]` to `- [x]` for each passed item.

- [ ] **Step 5: Commit**

```bash
git add skills/math-canvas-SKILL.md skills/math-canvas-outputs/math-canvas-demo.html
git commit -m "docs: confirm math-canvas graphing mode passes manual verification"
```
