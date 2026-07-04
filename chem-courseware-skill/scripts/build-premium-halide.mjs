import fs from 'fs';
import path from 'path';

const apparatusJs = fs.readFileSync('templates/apparatus-inline-snippet.js', 'utf8');
const sharedJs = fs.readFileSync('templates/shared-inline-snippet.js', 'utf8');

const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thí nghiệm: Nhận biết ion Halide</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: radial-gradient(circle at top, #1f2a44 0%, #0b1220 48%, #05070d 100%);
        color: #f7f7f7;
      }
      #stage {
        position: fixed;
        inset: 0;
        display: block;
        width: 100vw;
        height: 100vh;
        touch-action: none;
        z-index: 0;
      }
      .hud {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10;
      }
      .panel {
        position: absolute;
        left: 24px;
        top: 24px;
        max-width: 420px;
        padding: 18px 20px;
        border-radius: 18px;
        background: rgba(12, 18, 32, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(18px);
        pointer-events: auto;
      }
      .panel h1 {
        margin: 0 0 8px;
        font-size: 22px;
        line-height: 1.2;
        color: #67d8ff;
      }
      .panel p {
        margin: 0 0 16px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        font-size: 14.5px;
      }
      .btn-group {
        display: flex;
        gap: 10px;
      }
      button {
        padding: 10px 16px;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      button[data-action="autoplay"] {
        background: #0ea5e9;
        color: white;
        flex: 1;
      }
      button[data-action="autoplay"]:hover { background: #0284c7; }
      button[data-action="reset"] {
        background: rgba(255,255,255,0.1);
        color: white;
      }
      button[data-action="reset"]:hover { background: rgba(255,255,255,0.2); }
      
      .instruction {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.6);
        padding: 10px 24px;
        border-radius: 20px;
        font-size: 14px;
        color: #94a3b8;
        border: 1px solid rgba(255,255,255,0.05);
      }
    </style>
</head>
<body>
    <canvas id="stage"></canvas>
    <div class="hud">
        <div class="panel">
            <h1 id="statusText">Nhận biết ion Halide</h1>
            <p id="statusSub">Chuẩn bị 4 ống nghiệm chứa lần lượt dung dịch NaF, NaCl, NaBr, NaI. Nhỏ dung dịch AgNO₃ vào từng ống để nhận biết qua màu sắc kết tủa.</p>
            <div class="btn-group">
                <button data-action="autoplay">Bắt đầu thí nghiệm</button>
                <button data-action="reset">Làm lại</button>
            </div>
        </div>
        <div class="instruction">Chuột trái: Xoay | Cuộn: Thu phóng | Chuột phải: Di chuyển</div>
    </div>
    
    <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
    </script>
    <script type="module">
      import * as THREE from 'three';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      globalThis.THREE = THREE;
      globalThis.OrbitControls = OrbitControls;
    </script>
    <script type="module">
      ${apparatusJs}
      globalThis.ChemApparatusLib = ChemApparatusLib;
    </script>
    <script type="module">
      ${sharedJs}
      globalThis.ChemSharedLib = ChemSharedLib;
    </script>
    <script type="module" src="./scene-premium.js"></script>
</body>
</html>`;

fs.writeFileSync('generated/chem-halide-identification-premium.html', htmlContent);
console.log('Generated HTML.');
