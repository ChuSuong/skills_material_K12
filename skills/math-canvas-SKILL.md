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
- **Graphing, Vector, Statistics mode** — toolbar/mode switcher đã có, nhưng canvas
  hiện chỉ hiện placeholder "sắp có". Sẽ được triển khai ở các bản sau (xem
  `docs/superpowers/specs/2026-06-25-math-canvas-design.md`).

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
#dw{border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);overflow:hidden;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
#dtb{display:flex;gap:5px;padding:8px 10px;background:var(--color-background-primary);border-bottom:.5px solid var(--color-border-tertiary);align-items:center;flex-wrap:wrap}
.dbt{padding:5px 10px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);font-family:inherit;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;line-height:1.4}
.dbt:hover{background:var(--color-background-secondary)}
.dbt.on{border-color:#2d70b3;background:#edf3fb;color:#2d70b3;font-weight:500}
.dbt:disabled{opacity:.4;cursor:not-allowed}
#dmodes{display:flex;gap:5px;padding:8px 10px 0;flex-wrap:wrap}
.dbm{padding:5px 12px;border-radius:var(--border-radius-md);border:.5px solid var(--color-border-secondary);background:var(--color-background-primary);color:var(--color-text-secondary);font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer}
.dbm:hover{background:var(--color-background-secondary)}
.dbm.on{border-color:#fa7e19;background:#fff4ea;color:#fa7e19}
#ggc{display:block;touch-action:none}
#dst{padding:6px 13px;font-size:11.5px;color:var(--color-text-secondary);background:var(--color-background-secondary);border-top:.5px solid var(--color-border-tertiary);min-height:26px;font-family:inherit;line-height:1.5}
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
  <canvas id="ggc"></canvas>
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

const PLACEHOLDER_MSG={
  graphing:'Graphing mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  vector:'Vector mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
  statistics:'Statistics mode — sắp có. Chuyển sang Geometry để tiếp tục vẽ hình học.',
};

const gsx=x=>C.width/2+(x+pX)*Z;
const gsy=y=>C.height/2-(y+pY)*Z;
const gmx=cx=>(cx-C.width/2)/Z-pX;
const gmy=cy=>-(cy-C.height/2)/Z-pY;

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

function redraw(){
  drawBg();drawGrid();
  if(mode==='geometry'){drawPolys();drawCircs();drawSegs();drawPrev();drawPts();}
  else{drawModePlaceholder();}
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
  const ph=document.getElementById('dtb-placeholder');
  ph.style.display=isGeo?'none':'block';
  ph.textContent=PLACEHOLDER_MSG[m]||'';
  document.querySelectorAll('.dbt-geoaction').forEach(b=>b.disabled=!isGeo);
  if(isGeo){DST.innerHTML=TMSG[tool]||'';}
  else{DST.innerHTML=PLACEHOLDER_MSG[m]||'';}
  redraw();
}

function setT(t){
  tool=t;pend=[];
  document.querySelectorAll('.dbt[id^="t-"]').forEach(b=>b.classList.remove('on'));
  const el=document.getElementById('t-'+t);if(el)el.classList.add('on');
  DST.innerHTML=TMSG[t]||'';
  C.style.cursor=t==='drag'?'grab':'crosshair';
  redraw();
}
function clearAll(){pts=[];segs=[];circs=[];polys=[];pCnt=0;pend=[];dragId=null;hovId=null;redraw();DST.innerHTML='Canvas cleared.';}
function resetV(){pX=0;pY=0;Z=55;redraw();}
function adjZ(f){Z=Math.max(10,Math.min(600,Z*f));redraw();}

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

function resize(){const w=C.parentElement.clientWidth||660;C.width=w;C.height=Math.round(w*.54);redraw();}
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
