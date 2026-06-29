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

# Math Canvas Skill

Tạo interactive math workspace dùng `show_widget`. Canvas dùng Desmos visual
language: nền trắng cứng, grid nhạt, trục đen có mũi tên filled, font Helvetica Neue,
và màu Desmos chính xác.

**Output:** Luôn dùng `show_widget` — không tạo file. Widget tự chứa HTML + JS.

## Trạng thái hiện tại

- **Geometry mode** — đầy đủ: Point/Segment/Circle/Polygon, drag-to-reshape, live
  measurements.
- **Graphing mode** — đầy đủ: function plotter, implicit multiplication, tối đa 8 hàm đồng thời.
- **Statistics mode** — đầy đủ: frequency histogram từ comma/space-separated numbers, tự chọn số bins.
- **Vector mode** — placeholder, sẽ triển khai ở bản sau.

---

## Design System (Desmos Layer)

### Color palette — đúng màu Desmos
```
DCOLS = ['#2d70b3','#c74440','#388c46','#6042a6','#fa7e19']
```
Points, segments, circles, polygons xoay vòng qua các màu này theo thứ tự.

### Font
```
"Helvetica Neue", Helvetica, Arial, sans-serif  →  const HF = '"Helvetica Neue",Helvetica,Arial,sans-serif'
```
Dùng ở mọi nơi trong canvas. Point labels: `500 italic 13px`.

### Canvas aesthetics
| Element | Giá trị |
|---------|---------|
| Background | `#ffffff` hardcode — Desmos luôn light |
| Grid lines | `#e8e8e8`, 1px |
| Axes | `#222`, 1.5px, filled triangle arrowheads |
| Axis labels (x, y) | italic 13px HF, `#333` |
| Tick labels | 11px HF, `#999` |

### Measurement pill
White rounded background + colored border + colored text:
```javascript
function pill(txt, x, y, col) {
  X.save();
  X.font = `500 11px ${HF}`; X.textAlign = 'center';
  const w = X.measureText(txt).width;
  X.fillStyle = 'rgba(255,255,255,.92)';
  X.strokeStyle = col + '55'; X.lineWidth = .8;
  X.beginPath();
  if (X.roundRect) X.roundRect(x-w/2-5, y-13, w+10, 15, 3);
  else X.rect(x-w/2-5, y-13, w+10, 15);
  X.fill(); X.stroke();
  X.fillStyle = col; X.fillText(txt, x, y-1);
  X.restore();
}
```

### Outer UI (toolbar, status)
Dùng CSS variables → tự adapt dark/light mode. Canvas bên trong luôn trắng.

---

## Object Model

Tất cả geometry đều **point-based**: di chuyển một point sẽ reshape mọi object liên
kết tự động.

```javascript
pts   = [{ id, x, y, label, color }]     // named points (A, B, C, ...)
segs  = [{ a: ptId, b: ptId }]           // segment giữa 2 points
circs = [{ c: ptId, r: ptId }]           // circle: center + radius point
polys = [[ptId, ptId, ptId, ...]]        // polygon khép kín
```

---

## Coordinate System

```javascript
const gsx = x  => C.width/2  + (x  + pX) * Z;   // math → screen x
const gsy = y  => C.height/2 - (y  + pY) * Z;   // math → screen y
const gmx = cx => (cx - C.width/2)  / Z - pX;   // screen → math x
const gmy = cy => -(cy - C.height/2) / Z - pY;  // screen → math y
```

`pX`, `pY` = pan offset (math units). `Z` = zoom (pixels/unit, default 55).

**Zoom toward cursor** (wheel handler):
```javascript
const mx0 = gmx(p.x), my0 = gmy(p.y);   // capture math coords trước
Z = clamp(Z * factor, 10, 600);
pX = (p.x - C.width/2) / Z - mx0;        // adjust pan để giữ điểm dưới cursor
pY = (C.height/2 - p.y) / Z - my0;
```

---

## Base Template

Copy toàn bộ đoạn này vào `show_widget`. Chỉ cần thay `loadEx()` và toolbar buttons
tùy context.

```html
<h2 class="sr-only">[MÔ TẢ MỤC ĐÍCH CANVAS NÀY]</h2>
<style>
#dw{border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;display:flex;flex-direction:column}
#dtb{display:flex;gap:5px;padding:8px 10px;background:var(--color-background-primary);border-bottom:.5px solid var(--color-border-tertiary);align-items:center;flex-wrap:wrap}
.dbt{padding:5px 10px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);font-family:inherit;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;line-height:1.4}
.dbt:hover{background:var(--color-background-secondary)}
.dbt.on{border-color:#2d70b3;background:#edf3fb;color:#2d70b3;font-weight:500}
.dbt:disabled{opacity:.4;cursor:not-allowed}
#dmodes{display:flex;gap:5px;padding:8px 10px 0;flex-wrap:wrap}
.dbm{padding:5px 12px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer}
.dbm:hover{background:var(--color-background-secondary)}
.dbm.on{border-color:#fa7e19;background:#fff4ea;color:#fa7e19}
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
.finput-wrap input{width:100%;box-sizing:border-box;font-size:12px;padding:3px 5px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-family:inherit;background:var(--color-background-primary);color:var(--color-text-secondary)}
.finput-wrap input.err{border-color:#c74440}
.ferr{font-size:10px;color:#c74440;margin-top:2px;line-height:1.3;display:none}
.fdel{padding:2px 5px;border:none;background:none;color:var(--color-text-secondary);cursor:pointer;font-size:14px;line-height:1;flex-shrink:0;margin-top:2px}
.fdel:hover{color:#c74440}
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
#dstats-panel{width:180px;flex-shrink:0;border-right:.5px solid var(--color-border-tertiary);display:flex;flex-direction:column;background:var(--color-background-primary)}
#dstats-inner{flex:1;display:flex;flex-direction:column;padding:8px;gap:6px;overflow-y:auto}
#dstats-label{font-size:11.5px;font-weight:600;color:var(--color-text-secondary)}
#dstats-input{flex:1;resize:none;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);padding:5px;font-size:12px;font-family:inherit;background:var(--color-background-primary);color:var(--color-text-primary);min-height:80px}
#dstats-binrow{display:flex;align-items:center;font-size:12px;color:var(--color-text-secondary)}
#dstats-binrow input[type=number]{width:44px;margin-left:6px;padding:2px 4px;border:.5px solid var(--color-border-secondary);border-radius:var(--border-radius-md);font-family:inherit;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)}
</style>

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
  <div id="dst">Select a tool and click on the canvas to start building.</div>
</div>

<script>
const C=document.getElementById('ggc');
const X=C.getContext('2d');
const DST=document.getElementById('dst');
const HF='"Helvetica Neue",Helvetica,Arial,sans-serif';
const DCOLS=['#2d70b3','#c74440','#388c46','#6042a6','#fa7e19'];

let pX=0,pY=0,Z=55;
let mode='geometry';
let tool='drag',pend=[],dragId=null,hovId=null,panOn=false,panL={};
let mCX=0,mCY=0;
let pts=[],segs=[],circs=[],polys=[],pCnt=0;
let funcs=[],fCnt=0,_fTimers={};
let dataset=[];

const PLACEHOLDER_MSG={
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};

const gsx=x=>C.width/2+(x+pX)*Z;
const gsy=y=>C.height/2-(y+pY)*Z;
const gmx=cx=>(cx-C.width/2)/Z-pX;
const gmy=cy=>-(cy-C.height/2)/Z-pY;

function compileExpr(raw){
  let s=raw.trim();if(!s)return null;
  s=s.replace(/^[yY]\s*=\s*/,'');
  s=s.replace(/\^/g,'**');
  s=s.replace(/(?<![a-zA-Z])(\d)(x|pi|\()/g,'$1*$2');
  s=s.replace(/(x|\))(\d|\(|x)/g,'$1*$2');
  s=s.replace(/(x)\s*(x)/g,'$1*$2');
  s=s.replace(/\bpi\b/g,'Math.PI');
  s=s.replace(/\be\b/g,'Math.E');
  const fns=['exp','asin','acos','atan','sin','cos','tan','sqrt','abs','log2','log10','log','floor','ceil','round'];
  for(const f of fns)s=s.replace(new RegExp(`\\b${f}\\b`,'g'),`Math.${f}`);
  s=s.replace(/(\d)(Math\.)/g,'$1*$2');
  return new Function('x',`'use strict';return(${s});`);
}

function parseDataset(raw){
  return raw.split(/[\s,;\n]+/).filter(s=>s.trim()).map(Number).filter(n=>isFinite(n));
}
function onStatsInput(val){
  dataset=parseDataset(val);
  const n=dataset.length;
  DST.innerHTML=n>0?`Statistics mode — ${n} số.`:'Statistics mode — nhập số liệu vào panel trái.';
  redraw();
}

function byId(id){return pts.find(p=>p.id===id);}
function near(cx,cy,r=16){let b=null,bd=r*r;for(const p of pts){const dx=gsx(p.x)-cx,dy=gsy(p.y)-cy,d=dx*dx+dy*dy;if(d<bd){b=p;bd=d;}}return b;}
function dist(a,b){return Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);}
function addPt(x,y){
  const n=pCnt++;
  const lbl=String.fromCharCode(65+n%26)+(n>=26?''+Math.floor(n/26):'');
  pts.push({id:'p'+n,x,y,label:lbl,color:DCOLS[n%DCOLS.length]});
  return pts[pts.length-1];
}

function pill(txt,x,y,col){
  X.save();
  X.font=`500 11px ${HF}`;X.textAlign='center';
  const w=X.measureText(txt).width;
  X.fillStyle='rgba(255,255,255,.92)';X.strokeStyle=col+'55';X.lineWidth=.8;
  X.beginPath();
  if(X.roundRect)X.roundRect(x-w/2-5,y-13,w+10,15,3);else X.rect(x-w/2-5,y-13,w+10,15);
  X.fill();X.stroke();
  X.fillStyle=col;X.fillText(txt,x,y-1);
  X.restore();
}

function drawBg(){X.fillStyle='#ffffff';X.fillRect(0,0,C.width,C.height);}

function drawGrid(){
  const t=80/Z,mag=Math.pow(10,Math.floor(Math.log10(Math.max(t,1e-10))));
  const nv=t/mag,s=nv<1.5?mag:nv<3.5?2*mag:5*mag;
  const x0=gmx(0),x1=gmx(C.width),y0=gmy(0),y1=gmy(C.height);
  const ox=Math.max(32,Math.min(C.width-60,gsx(0)));
  const oy=Math.max(14,Math.min(C.height-16,gsy(0)));
  X.strokeStyle='#e8e8e8';X.lineWidth=1;
  for(let x=Math.ceil(x0/s)*s-s;x<=x1+s;x+=s){X.beginPath();X.moveTo(gsx(x),0);X.lineTo(gsx(x),C.height);X.stroke();}
  for(let y=Math.ceil(y1/s)*s-s;y<=y0+s;y+=s){X.beginPath();X.moveTo(0,gsy(y));X.lineTo(C.width,gsy(y));X.stroke();}
  X.strokeStyle='#222';X.lineWidth=1.5;
  X.beginPath();X.moveTo(0,gsy(0));X.lineTo(C.width-16,gsy(0));X.stroke();
  X.beginPath();X.moveTo(gsx(0),C.height);X.lineTo(gsx(0),16);X.stroke();
  X.fillStyle='#222';
  X.beginPath();X.moveTo(C.width,gsy(0));X.lineTo(C.width-16,gsy(0)-5);X.lineTo(C.width-16,gsy(0)+5);X.fill();
  X.beginPath();X.moveTo(gsx(0),0);X.lineTo(gsx(0)-5,16);X.lineTo(gsx(0)+5,16);X.fill();
  X.fillStyle='#333';X.font=`italic 13px ${HF}`;
  X.textAlign='left';X.fillText('x',C.width-8,gsy(0)+14);
  X.textAlign='center';X.fillText('y',gsx(0)+13,13);
  const dec=s<1?1:0;
  X.fillStyle='#999';X.font=`11px ${HF}`;
  for(let x=Math.ceil(x0/s)*s;x<=x1;x+=s){
    if(Math.abs(x)<s*.01)continue;
    X.textAlign='center';X.fillText(x.toFixed(dec),gsx(x),Math.min(C.height-4,oy+13));
  }
  for(let y=Math.ceil(y1/s)*s;y<=y0;y+=s){
    if(Math.abs(y)<s*.01)continue;
    X.textAlign='right';X.fillText(y.toFixed(dec),Math.max(38,ox-5),gsy(y)+3.5);
  }
}

function drawPolys(){
  for(const pg of polys){
    const ps=pg.map(id=>byId(id)).filter(Boolean);if(ps.length<3)continue;
    const col=ps[0].color;
    X.save();
    X.fillStyle=col+'18';X.strokeStyle=col;X.lineWidth=1.8;X.lineJoin='round';
    X.beginPath();X.moveTo(gsx(ps[0].x),gsy(ps[0].y));
    for(let i=1;i<ps.length;i++)X.lineTo(gsx(ps[i].x),gsy(ps[i].y));
    X.closePath();X.fill();X.stroke();
    X.restore();
    let area=0;
    for(let i=0,j=ps.length-1;i<ps.length;j=i++)area+=ps[j].x*ps[i].y-ps[i].x*ps[j].y;
    const cx=ps.reduce((a,p)=>a+p.x,0)/ps.length,cy=ps.reduce((a,p)=>a+p.y,0)/ps.length;
    pill('Area = '+Math.abs(area/2).toFixed(2),gsx(cx),gsy(cy)+6,col);
  }
}

function drawCircs(){
  for(const ci of circs){
    const cp=byId(ci.c),rp=byId(ci.r);if(!cp||!rp)continue;
    const r=dist(cp,rp);if(r<.001)continue;
    X.save();
    X.strokeStyle=cp.color;X.lineWidth=1.8;
    X.beginPath();X.arc(gsx(cp.x),gsy(cp.y),r*Z,0,Math.PI*2);X.stroke();
    X.globalAlpha=.05;X.fillStyle=cp.color;X.fill();
    X.restore();
    X.save();X.strokeStyle=cp.color+'55';X.lineWidth=1;X.setLineDash([4,3]);
    X.beginPath();X.moveTo(gsx(cp.x),gsy(cp.y));X.lineTo(gsx(rp.x),gsy(rp.y));X.stroke();
    X.restore();
    pill('r = '+r.toFixed(2),(gsx(cp.x)+gsx(rp.x))/2,(gsy(cp.y)+gsy(rp.y))/2-4,cp.color);
  }
}

function drawSegs(){
  for(const sg of segs){
    const a=byId(sg.a),b=byId(sg.b);if(!a||!b)continue;
    X.save();X.strokeStyle='#555';X.lineWidth=2;X.lineCap='round';
    X.beginPath();X.moveTo(gsx(a.x),gsy(a.y));X.lineTo(gsx(b.x),gsy(b.y));X.stroke();
    X.restore();
    pill(dist(a,b).toFixed(2),(gsx(a.x)+gsx(b.x))/2,(gsy(a.y)+gsy(b.y))/2-4,'#444');
  }
}

function drawPrev(){
  if(!pend.length)return;
  const pp=byId(pend[pend.length-1]);if(!pp)return;
  X.save();X.strokeStyle='#2d70b344';X.lineWidth=1.5;X.setLineDash([5,4]);
  if(tool==='seg'||tool==='poly'){
    X.beginPath();X.moveTo(gsx(pp.x),gsy(pp.y));X.lineTo(mCX,mCY);X.stroke();
    if(tool==='poly'&&pend.length>2){
      const fp=byId(pend[0]);X.globalAlpha=.22;
      X.beginPath();X.moveTo(mCX,mCY);X.lineTo(gsx(fp.x),gsy(fp.y));X.stroke();
    }
  }else if(tool==='circ'){
    const r=Math.sqrt((gmx(mCX)-pp.x)**2+(gmy(mCY)-pp.y)**2);
    if(r>0){X.beginPath();X.arc(gsx(pp.x),gsy(pp.y),r*Z,0,Math.PI*2);X.stroke();}
    X.beginPath();X.moveTo(gsx(pp.x),gsy(pp.y));X.lineTo(mCX,mCY);X.stroke();
  }
  X.restore();
}

function drawPts(){
  for(const p of pts){
    const cx=gsx(p.x),cy=gsy(p.y);
    const isH=hovId===p.id,isP=pend.includes(p.id);
    if(isH||isP){
      X.save();X.globalAlpha=.15;X.fillStyle=isP?'#fa7e19':p.color;
      X.beginPath();X.arc(cx,cy,13,0,Math.PI*2);X.fill();X.restore();
    }
    X.save();
    X.fillStyle=isP?'#fa7e19':p.color;X.strokeStyle='#fff';X.lineWidth=2;
    X.beginPath();X.arc(cx,cy,5,0,Math.PI*2);X.fill();X.stroke();
    X.fillStyle=isP?'#fa7e19':p.color;
    X.font=`500 italic 13px ${HF}`;X.textAlign='left';
    X.fillText(p.label,cx+8,cy-7);
    if(isH){
      X.fillStyle='#999';X.font=`11px ${HF}`;
      X.fillText('('+p.x.toFixed(2)+', '+p.y.toFixed(2)+')',cx+8,cy+6);
    }
    X.restore();
  }
}

function drawModePlaceholder(){
  X.save();
  X.fillStyle='#999';X.font=`13px ${HF}`;X.textAlign='center';
  X.fillText(PLACEHOLDER_MSG[mode]||'',C.width/2,C.height/2);
  X.restore();
}

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

const TMSG={
  drag:'<strong>Select:</strong> drag any point to reshape — measurements update live. Drag background to pan. Scroll to zoom.',
  pt:'<strong>Point:</strong> click anywhere to place a named point.',
  seg:'<strong>Segment:</strong> click two points to draw a segment. Length shown automatically.',
  circ:'<strong>Circle:</strong> click to place center, then click to define radius.',
  poly:'<strong>Polygon:</strong> click vertices, click first point again (or Enter) to close. Area shown inside.',
};

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
  else if(m==='statistics'){DST.innerHTML=dataset.length>0?`Statistics mode — ${dataset.length} số.`:'Statistics mode — nhập số liệu vào panel trái.';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}

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
  clearTimeout(_fTimers[id]);delete _fTimers[id];
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

function setT(t){
  tool=t;pend=[];
  document.querySelectorAll('.dbt[id^="t-"]').forEach(b=>b.classList.remove('on'));
  const el=document.getElementById('t-'+t);if(el)el.classList.add('on');
  DST.innerHTML=TMSG[t]||'';
  C.style.cursor=t==='drag'?'grab':'crosshair';
  redraw();
}
function clearAll(){
  pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;
  funcs=[];fCnt=0;
  const list=document.getElementById('dgraph-list');if(list)list.innerHTML='';
  const add=document.getElementById('dgraph-add');if(add)add.disabled=false;
  dataset=[];
  const inp=document.getElementById('dstats-input');if(inp)inp.value='';
  redraw();DST.innerHTML='Canvas cleared.';
}
function resetV(){pX=0;pY=0;Z=55;redraw();}
function adjZ(f){Z=Math.max(10,Math.min(600,Z*f));redraw();}

/* ════════════════════════════════════════════════════
   CUSTOMIZE: thay loadEx() bằng starter state phù hợp
   ════════════════════════════════════════════════════ */
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
/* ════════════════════════════════════════════════════ */

function gpos(e){const r=C.getBoundingClientRect(),t=(e.touches&&e.touches[0])||e;return{x:t.clientX-r.left,y:t.clientY-r.top};}

function onDown(e){
  if(mode!=='geometry')return;
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(tool==='drag'){
    const pt=near(p.x,p.y,18);
    if(pt){dragId=pt.id;C.style.cursor='grabbing';}
    else{panOn=true;panL=p;}
    return;
  }
  if(tool==='pt'){if(!near(p.x,p.y,12))addPt(gmx(p.x),gmy(p.y));redraw();return;}
  let pt=near(p.x,p.y);if(!pt)pt=addPt(gmx(p.x),gmy(p.y));
  if(tool==='seg'){
    if(!pend.length){pend=[pt.id];DST.innerHTML='Click a second point to complete the segment.';}
    else if(pt.id!==pend[0]){segs.push({a:pend[0],b:pt.id});pend=[];DST.innerHTML='Segment created.';}
  }else if(tool==='circ'){
    if(!pend.length){pend=[pt.id];DST.innerHTML='Click a second point to set the radius.';}
    else if(pt.id!==pend[0]){circs.push({c:pend[0],r:pt.id});pend=[];DST.innerHTML='Circle created.';}
  }else if(tool==='poly'){
    if(pend.length>2&&pt.id===pend[0]){polys.push([...pend]);pend=[];DST.innerHTML='Polygon closed.';}
    else if(!pend.includes(pt.id)){pend.push(pt.id);DST.innerHTML='Keep clicking. Click the <strong>first point</strong> or press Enter to close.';}
  }
  redraw();
}
function onMove(e){
  if(mode!=='geometry')return;
  const p=gpos(e);mCX=p.x;mCY=p.y;
  if(dragId){const pt=byId(dragId);if(pt){pt.x=gmx(p.x);pt.y=gmy(p.y);}redraw();return;}
  if(panOn){pX+=(p.x-panL.x)/Z;pY-=(p.y-panL.y)/Z;panL=p;redraw();return;}
  hovId=(near(p.x,p.y,14)||{}).id||null;
  redraw();
}
function onUp(){dragId=null;panOn=false;if(tool==='drag')C.style.cursor='grab';}

C.addEventListener('mousedown',onDown);
C.addEventListener('mousemove',onMove);
C.addEventListener('mouseup',onUp);
C.addEventListener('mouseleave',()=>{hovId=null;dragId=null;panOn=false;redraw();});
C.addEventListener('wheel',e=>{
  e.preventDefault();
  const p=gpos(e),mx0=gmx(p.x),my0=gmy(p.y);
  Z=Math.max(10,Math.min(600,Z*(e.deltaY<0?1.12:.89)));
  pX=(p.x-C.width/2)/Z-mx0;pY=(C.height/2-p.y)/Z-my0;
  redraw();
},{passive:false});
let tld=null;
C.addEventListener('touchstart',e=>{e.preventDefault();if(e.touches.length===1)onDown(e);else if(e.touches.length===2)tld=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);},{passive:false});
C.addEventListener('touchmove',e=>{e.preventDefault();if(e.touches.length===1)onMove(e);else if(e.touches.length===2&&tld){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);Z=Math.max(10,Math.min(600,Z*d/tld));tld=d;redraw();}},{passive:false});
C.addEventListener('touchend',()=>{onUp();tld=null;});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){pend=[];redraw();}
  if(e.key==='Enter'&&tool==='poly'&&pend.length>=3){polys.push([...pend]);pend=[];redraw();DST.innerHTML='Polygon closed.';}
});

function resize(){const gp=document.getElementById('dgraph-panel');const sp=document.getElementById('dstats-panel');const panelW=(gp&&getComputedStyle(gp).display!=='none'?gp.offsetWidth:0)+(sp&&getComputedStyle(sp).display!=='none'?sp.offsetWidth:0);const w=(C.parentElement.clientWidth-panelW)||660;C.width=w;C.height=Math.round(w*.54);redraw();}
window.addEventListener('resize',resize);
resize();loadEx();setT('drag');setMode('geometry');
</script>
```

---

## Customization Guide

### Thay loadEx() — starter state
```javascript
// Tam giác vuông
function loadEx(){
  clearAll();
  const O=addPt(0,0), A=addPt(4,0), B=addPt(0,3);
  segs.push({a:O.id,b:A.id},{a:A.id,b:B.id},{a:B.id,b:O.id});
  polys.push([O.id,A.id,B.id]);
  DST.innerHTML='<strong>Pythagorean triangle</strong> — drag to reshape.';
  redraw();
}

// Hình vuông + đường chéo
function loadEx(){
  clearAll();
  const A=addPt(-3,-3),B=addPt(3,-3),Cp=addPt(3,3),D=addPt(-3,3);
  segs.push({a:A.id,b:B.id},{a:B.id,b:Cp.id},{a:Cp.id,b:D.id},{a:D.id,b:A.id},{a:A.id,b:Cp.id});
  polys.push([A.id,B.id,Cp.id,D.id]);
  redraw();
}

// Circle với điểm trên đường tròn
function loadEx(){
  clearAll();
  const O=addPt(0,0), R=addPt(3,0);
  circs.push({c:O.id,r:R.id});
  redraw();
}
```

### Thêm angle measurement
```javascript
function angleDeg(O,A,B){
  const a=Math.atan2(A.y-O.y,A.x-O.x);
  const b=Math.atan2(B.y-O.y,B.x-O.x);
  let deg=(b-a)*180/Math.PI;
  if(deg<0)deg+=360;
  return deg.toFixed(1)+'°';
}
// Gọi: pill(angleDeg(O,A,B), gsx(O.x), gsy(O.y)-18, '#6042a6')
```

### Snap to grid (0.5 units)
```javascript
function snap(v){return Math.round(v*2)/2;}
// Trong onDown khi tạo point:
addPt(snap(gmx(p.x)), snap(gmy(p.y)))
```

### Constrain point lên đường thẳng (ví dụ: x-axis)
```javascript
// Trong onMove, sau khi xác định dragId:
if(pt){ pt.x=gmx(p.x); pt.y=0; }  // lock y=0
```

### Xóa một tool khỏi toolbar
Xóa `<button>` tương ứng và xóa branch `else if(tool==='...')` trong `onDown`.

### Thay đổi initial zoom và view
```javascript
let pX=0, pY=0, Z=80;  // Z cao hơn = zoom in hơn
// Hoặc pan tới một vùng cụ thể:
let pX=2, pY=-1, Z=60; // center tại (−2, 1) trong math coords
```

### show_widget loading messages
```
loading_messages: ["Building geometry canvas...", "Wiring up drag interactions..."]
title: <snake_case mô tả nội dung, vd: pythagorean_theorem_canvas>
```

---

## Common Recipes

### Pre-populate từ data
```javascript
// Đa giác bất kỳ từ danh sách tọa độ
const coords = [[-3,0],[0,3],[3,0],[1.5,-2],[-1.5,-2]];
const ids = coords.map(([x,y]) => addPt(x,y).id);
ids.forEach((id,i) => segs.push({a:id, b:ids[(i+1)%ids.length]}));
polys.push(ids);
```

### Midpoint của segment
```javascript
function midpt(segIdx){
  const sg=segs[segIdx], a=byId(sg.a), b=byId(sg.b);
  return addPt((a.x+b.x)/2, (a.y+b.y)/2);
}
```

### Perpendicular bisector
```javascript
function perpBisector(segIdx){
  const sg=segs[segIdx], a=byId(sg.a), b=byId(sg.b);
  const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
  const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy);
  const P=addPt(mx-dy/len*2, my+dx/len*2);
  const Q=addPt(mx+dy/len*2, my-dx/len*2);
  segs.push({a:P.id, b:Q.id});
}
```

---

## Những điều KHÔNG làm

- **Canvas background:** KHÔNG dùng CSS variables trong canvas API — chỉ dùng hex
  literal (`#ffffff`, `#e8e8e8`, `rgba(...)`)
- **Outer container:** KHÔNG hardcode `background` trên `#dw` — CSS variables tự xử lý
  dark mode cho UI bên ngoài
- **Context state:** Luôn `X.save()` / `X.restore()` khi thay đổi `globalAlpha`,
  `setLineDash()`, `lineJoin` — context state persist giữa các draw calls
- **measureText:** Luôn set `X.font` TRƯỚC khi gọi `X.measureText()` — kết quả phụ
  thuộc vào font hiện tại
- **display:none:** KHÔNG dùng lúc streaming — content ẩn không được render

---

## Manual Verification Checklist (Mode Switcher Baseline)

Không có test runner tự động cho widget này. Trước khi coi baseline mode-switcher là
"done", mở `skills/math-canvas-outputs/math-canvas-demo.html` trực tiếp trong browser
và kiểm tra tay:

- [x] Load trang: thấy tam giác mẫu (Example) trong Geometry mode, 4 nút mode ở trên
      toolbar, nút "Geometry" đang active (viền cam).
- [x] Kéo 1 điểm của tam giác — tam giác reshape, số đo cạnh cập nhật theo thời gian
      thực (giống hành vi cũ, không regress).
- [x] Click "Graphing" — toolbar tool Geometry (Select/Point/Segment/Circle/Polygon)
      biến mất, canvas hiện chữ placeholder màu xám giữa canvas, nút Example/Clear bị
      mờ và không bấm được.
- [x] Click "Vector", rồi "Statistics" — mỗi mode hiện đúng câu placeholder tương ứng
      của mode đó (không phải câu của mode khác).
- [x] Click lại "Geometry" — tam giác đã kéo ở bước 2 vẫn còn nguyên đúng vị trí đã kéo
      (không bị reset về Example ban đầu), Example/Clear hoạt động lại.
- [x] Mở DevTools console — không có lỗi JS nào xuất hiện trong toàn bộ quá trình trên.

---

## Manual Verification Checklist (Graphing Mode)

- [x] Switch to Graphing: left panel appears, 2 hàm mẫu (`x^2`, `sin(x)`) plotted
- [x] Gõ `2x+1` → đường thẳng xuất hiện ngay (implicit multiplication: `compileExpr` trả về f(0)=1, f(1)=3)
- [x] Gõ `x^3-2x` → cubic curve đúng hình dạng (f(2)=4 ✓)
- [x] Gõ `x^^2` → border đỏ, error message "Unexpected token '**'", canvas không crash
- [x] `log(x)` → log(-1)=NaN (gap ở x ≤ 0), log(1)=0, log(10)≈2.303 ✓
- [x] Xóa hàm bằng × → đường biến mất, hàm còn lại giữ nguyên
- [x] Switch Geometry → vẽ điểm → switch Graphing lại: funcs còn nguyên (5 funcs preserved)
- [x] Zoom/pan → đồ thị redraw đúng, không có JS errors
- [x] Example trong Graphing → reset về 2 hàm mẫu (`x^2`, `sin(x)`)
- [x] Clear → xóa hết funcs và DOM rows (0 rows, Add button re-enabled)
- [x] DevTools console: không có lỗi JS
- [x] Max cap: 8 funcs → Add button tự disable, không thể thêm thêm

## Manual Verification Checklist (Statistics Mode)

- [x] Switch to Statistics: panel 180px xuất hiện, canvas hiện placeholder, Example/Clear enabled
- [x] Click Example: 25 điểm thi load, histogram vẽ với n/mean/min/max đúng
- [x] Nhập `5, 10, 5, 15, 10, 5, 20`: histogram 7 số đúng hình dạng
- [x] Nhập `42` (một giá trị): một cột giữa, không crash
- [x] Nhập `a, b, c`: dataset rỗng, canvas hiện placeholder
- [x] Nhập `1, 2, abc, 3, 4`: bỏ qua ký tự không hợp lệ, histogram 4 số
- [x] Thay Bins → 3: histogram redraw ngay với 3 bins
- [x] Click Clear: textarea cleared, dataset rỗng, canvas hiện placeholder
- [x] Switch Geometry → vẽ điểm → switch Statistics: dataset còn nguyên trong textarea
- [x] Switch Graphing → switch Statistics: funcs và dataset cả hai còn nguyên
- [x] Zoom/pan buttons: không crash, không ảnh hưởng chart
- [x] DevTools console: không có lỗi JS
