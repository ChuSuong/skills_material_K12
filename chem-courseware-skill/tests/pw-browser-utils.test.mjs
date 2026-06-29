import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { runPlaywrightPage } from '../scripts/pw-browser-utils.mjs';

test('runPlaywrightPage executes generic golden-path verifier steps through courseware test API', async () => {
  const tempDir = await fs.mkdtemp(path.join('/home/ding', `chem-pw-browser-utils-${process.pid}-`));
  const htmlPath = path.join(tempDir, 'index.html');

  await fs.writeFile(htmlPath, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifier step fixture</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      #stage { display: block; width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <canvas id="stage"></canvas>
    <div id="statusText">Sẵn sàng</div>
    <div id="statusSub">Chưa chạy</div>
    <button data-action="autoplay">Tự chạy</button>
    <button data-action="reset">Làm lại</button>
    <script>
      const state = { phase: 'idle' };
      window.__coursewareTestApi = {
        getState() {
          return { ...state };
        },
        getVerifierMeta() {
          return { successPhase: 'result', supportsGoldenPath: true };
        },
        getGoldenPath() {
          return [{ type: 'custom-verifier-step', afterMs: 10 }];
        },
        runVerifierStep(step) {
          if (step?.type !== 'custom-verifier-step') return false;
          state.phase = 'result';
          document.querySelector('#statusText').textContent = 'Đã chạy';
          document.querySelector('#statusSub').textContent = 'Verifier step completed';
          return true;
        },
      };
    </script>
  </body>
</html>
`);

  const result = await runPlaywrightPage({
    htmlPath,
    actions: [{ type: 'runGoldenPathFromPageApi', afterMs: 20 }],
    timeoutMs: 12000,
  });

  await fs.rm(tempDir, { recursive: true, force: true });

  assert.equal(result.pageState?.phase, 'result');
  assert.equal(result.statusTextAfter, 'Đã chạy');
  assert.equal(result.statusSubAfter, 'Verifier step completed');
  assert.equal(result.statusTextChanged, true);
  assert.equal(result.statusSubChanged, true);
});
