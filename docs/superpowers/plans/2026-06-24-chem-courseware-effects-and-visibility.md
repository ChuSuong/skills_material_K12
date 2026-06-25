# Chem Courseware Effects & Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a minimal `chem-courseware-base` skill that provides (a) four reusable Three.js effect helpers (flowing-liquid shader, organic particle textures, bumpy-surface geometry jitter, particle pop-then-fade) and (b) a 3-checkpoint screenshot script + manual checklist for verifying a lesson's key phenomenon is actually observable — then wire `chem-3d-experiment/SKILL.md` to require both.

**Architecture:** New skill folder `chem-courseware-skill/skills/chem-courseware-base/` with `effects/`, `references/`, `scripts/` subfolders. Effect helpers are dependency-injected pure functions/factories (no scene-graph coupling) so they're unit-testable in plain Node via `three` as a new dev dependency, except for the two DOM-wrapping convenience functions in `organic-texture.mjs` which stay browser-only and are exercised through the existing manual screenshot workflow instead. The visibility script reuses the existing `runPlaywrightPage` helper — no new browser-automation code.

**Tech Stack:** Node.js ESM (`type: module`), `node:test` + `node:assert/strict`, `three` (new devDependency, matching the `0.165.0` CDN version already used in `examples/`), Playwright (already a dependency, via existing `scripts/pw-browser-utils.mjs`).

---

## File Structure

```
chem-courseware-skill/
├── package.json                                   (modify — add three devDependency + test:effects script)
├── skills/
│   ├── chem-courseware-base/                       (new)
│   │   ├── SKILL.md                                (new)
│   │   ├── effects/
│   │   │   ├── particle-pop.mjs                    (new)
│   │   │   ├── jitter-geometry.mjs                 (new)
│   │   │   ├── organic-texture.mjs                 (new)
│   │   │   └── liquid-shader.mjs                   (new)
│   │   ├── references/
│   │   │   └── visibility-checklist.md             (new)
│   │   └── scripts/
│   │       └── pw-capture-checkpoints.mjs          (new)
│   └── chem-3d-experiment/
│       └── SKILL.md                                (modify — add effect-reuse + visibility rules)
└── tests/
    └── effects.test.mjs                            (new)
```

---

### Task 1: Add `three` as a dev dependency

**Files:**
- Modify: `chem-courseware-skill/package.json`

- [ ] **Step 1: Install three as a devDependency**

Run:
```bash
cd chem-courseware-skill && npm install --save-dev three@0.165.0
```
Expected: `package.json` gains a `devDependencies` block containing `"three": "^0.165.0"` (or the installed exact resolution), and `node_modules/three` exists.

- [ ] **Step 2: Add the effects test script**

Modify `chem-courseware-skill/package.json` — add a `test:effects` entry to `"scripts"` (keep every existing script unchanged):

```json
    "test:effects": "node --test tests/effects.test.mjs",
```

Insert it directly after the `"test:format:example"` line so the scripts block reads:

```json
  "scripts": {
    "verify:pw:smoke": "node scripts/pw-smoke-open-html.mjs \"$COURSEWARE_HTML\"",
    "verify:pw:canvas": "node scripts/pw-assert-canvas-visible.mjs \"$COURSEWARE_HTML\"",
    "verify:pw:interaction": "node scripts/pw-interaction-golden-path.mjs \"$COURSEWARE_HTML\"",
    "verify:pw:screenshot": "node scripts/pw-capture-screenshot.mjs",
    "verify:pw": "node scripts/pw-smoke-open-html.mjs \"$COURSEWARE_HTML\" && node scripts/pw-assert-canvas-visible.mjs \"$COURSEWARE_HTML\" && node scripts/pw-interaction-golden-path.mjs \"$COURSEWARE_HTML\"",
    "verify": "node scripts/pw-smoke-open-html.mjs \"$COURSEWARE_HTML\" && node scripts/pw-assert-canvas-visible.mjs \"$COURSEWARE_HTML\" && node scripts/pw-interaction-golden-path.mjs \"$COURSEWARE_HTML\"",
    "test:format": "node --test tests/courseware-format.test.mjs",
    "test:format:example": "COURSEWARE_HTML=/home/ding/chem-courseware-skill-base/examples/sugar-h2so4/sugar-h2so4.html node --test tests/courseware-format.test.mjs",
    "test:effects": "node --test tests/effects.test.mjs"
  },
```

- [ ] **Step 3: Commit**

```bash
cd chem-courseware-skill && git add package.json package-lock.json && git commit -m "chore: add three devDependency for effect-helper unit tests"
```

---

### Task 2: `particle-pop.mjs` (pure math, no dependencies)

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/effects/particle-pop.mjs`
- Test: `chem-courseware-skill/tests/effects.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `chem-courseware-skill/tests/effects.test.mjs` with:

```javascript
import assert from 'node:assert/strict';
import test from 'node:test';

import { popThenFade } from '../skills/chem-courseware-base/effects/particle-pop.mjs';

test('popThenFade fades linearly before the pop threshold', () => {
  const result = popThenFade(0.5, 1);
  assert.equal(result.scale, 0.5);
  assert.equal(result.alpha, 0.5);
});

test('popThenFade swells then drops alpha after the pop threshold', () => {
  const result = popThenFade(0.9, 1, 0.82);
  const popT = (0.9 - 0.82) / (1 - 0.82);
  assert.ok(Math.abs(result.scale - (1 + popT * 0.9)) < 1e-9);
  assert.ok(Math.abs(result.alpha - (1 - popT) * 0.9) < 1e-9);
});

test('popThenFade reaches zero alpha at t=1', () => {
  const result = popThenFade(1, 1);
  assert.ok(Math.abs(result.alpha) < 1e-9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: FAIL — `Cannot find module '../skills/chem-courseware-base/effects/particle-pop.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `chem-courseware-skill/skills/chem-courseware-base/effects/particle-pop.mjs`:

```javascript
export function popThenFade(t, baseScale, popStart = 0.82) {
  if (t > popStart) {
    const popT = (t - popStart) / (1 - popStart);
    return {
      scale: baseScale * (1 + popT * 0.9),
      alpha: (1 - popT) * 0.9
    };
  }
  return {
    scale: (1 - t) * baseScale,
    alpha: 1 - t
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: PASS — 3 tests passed

- [ ] **Step 5: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/effects/particle-pop.mjs tests/effects.test.mjs && git commit -m "feat: add particle-pop effect helper"
```

---

### Task 3: `jitter-geometry.mjs`

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/effects/jitter-geometry.mjs`
- Test: `chem-courseware-skill/tests/effects.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

Append to `chem-courseware-skill/tests/effects.test.mjs`:

```javascript
import * as THREE from 'three';
import { jitterGeometry } from '../skills/chem-courseware-base/effects/jitter-geometry.mjs';

test('jitterGeometry displaces vertices and recomputes normals', () => {
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const before = geometry.attributes.position.array.slice();
  const result = jitterGeometry(geometry, 0.05);
  const after = geometry.attributes.position.array;

  assert.equal(result, geometry, 'should mutate and return the same geometry');
  let changed = false;
  for (let i = 0; i < before.length; i++) {
    if (Math.abs(before[i] - after[i]) > 1e-9) {
      changed = true;
      break;
    }
  }
  assert.ok(changed, 'expected at least one vertex to move');
  assert.ok(geometry.attributes.normal, 'expected normals to be recomputed');
});

test('jitterGeometry with amount 0 leaves positions unchanged', () => {
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const before = geometry.attributes.position.array.slice();
  jitterGeometry(geometry, 0);
  const after = geometry.attributes.position.array;
  for (let i = 0; i < before.length; i++) {
    assert.ok(Math.abs(before[i] - after[i]) < 1e-9);
  }
});
```

Move the `import * as THREE from 'three';` line to the top of the file alongside the other imports (Node ESM requires imports at module top level, not interleaved mid-file).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: FAIL — `Cannot find module '../skills/chem-courseware-base/effects/jitter-geometry.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `chem-courseware-skill/skills/chem-courseware-base/effects/jitter-geometry.mjs`:

```javascript
export function jitterGeometry(geometry, amount) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i);
    const ny = pos.getY(i);
    const nz = pos.getZ(i);
    const bump = (Math.sin(nx * 23.1 + ny * 17.7) * 0.5 + Math.cos(nz * 19.3 - ny * 11.4) * 0.5) * amount;
    const len = Math.hypot(nx, nz) || 1;
    pos.setX(i, nx + (nx / len) * bump);
    pos.setZ(i, nz + (nz / len) * bump);
  }
  geometry.computeVertexNormals();
  return geometry;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: PASS — 5 tests passed

- [ ] **Step 5: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/effects/jitter-geometry.mjs tests/effects.test.mjs && git commit -m "feat: add jitter-geometry effect helper"
```

---

### Task 4: `organic-texture.mjs`

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/effects/organic-texture.mjs`
- Test: `chem-courseware-skill/tests/effects.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

Append to `chem-courseware-skill/tests/effects.test.mjs`:

```javascript
import { drawCloudBlobs, drawBubbleGlow, DEFAULT_CLOUD_BLOBS } from '../skills/chem-courseware-base/effects/organic-texture.mjs';

function createMockContext() {
  const calls = { createRadialGradient: 0, fillRect: 0, fill: 0, beginPath: 0, arc: 0 };
  const gradient = { addColorStop: () => {} };
  return {
    calls,
    fillStyle: null,
    createRadialGradient: () => {
      calls.createRadialGradient++;
      return gradient;
    },
    fillRect: () => { calls.fillRect++; },
    fill: () => { calls.fill++; },
    beginPath: () => { calls.beginPath++; },
    arc: () => { calls.arc++; }
  };
}

test('drawCloudBlobs draws one radial gradient per blob', () => {
  const ctx = createMockContext();
  drawCloudBlobs(ctx, 128);
  assert.equal(ctx.calls.createRadialGradient, DEFAULT_CLOUD_BLOBS.length);
  assert.equal(ctx.calls.fillRect, DEFAULT_CLOUD_BLOBS.length);
});

test('drawCloudBlobs accepts a custom blob list', () => {
  const ctx = createMockContext();
  drawCloudBlobs(ctx, 128, [{ x: 0.5, y: 0.5, r: 0.4, a: 0.5 }]);
  assert.equal(ctx.calls.createRadialGradient, 1);
  assert.equal(ctx.calls.fillRect, 1);
});

test('drawBubbleGlow draws a single radial gradient filled as a circle', () => {
  const ctx = createMockContext();
  drawBubbleGlow(ctx, 128);
  assert.equal(ctx.calls.createRadialGradient, 1);
  assert.equal(ctx.calls.beginPath, 1);
  assert.equal(ctx.calls.arc, 1);
  assert.equal(ctx.calls.fill, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: FAIL — `Cannot find module '../skills/chem-courseware-base/effects/organic-texture.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `chem-courseware-skill/skills/chem-courseware-base/effects/organic-texture.mjs`:

```javascript
export const DEFAULT_CLOUD_BLOBS = [
  { x: 0.5, y: 0.5, r: 0.46, a: 0.55 },
  { x: 0.34, y: 0.42, r: 0.3, a: 0.5 },
  { x: 0.64, y: 0.4, r: 0.28, a: 0.46 },
  { x: 0.46, y: 0.62, r: 0.26, a: 0.42 },
  { x: 0.6, y: 0.6, r: 0.22, a: 0.4 }
];

export function drawCloudBlobs(ctx, size, blobs = DEFAULT_CLOUD_BLOBS) {
  for (const b of blobs) {
    const gradient = ctx.createRadialGradient(size * b.x, size * b.y, size * 0.02, size * b.x, size * b.y, size * b.r);
    gradient.addColorStop(0, `rgba(255,255,255,${b.a})`);
    gradient.addColorStop(0.4, `rgba(220,230,235,${b.a * 0.55})`);
    gradient.addColorStop(1, 'rgba(220,230,235,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
}

export function drawBubbleGlow(ctx, size) {
  const gradient = ctx.createRadialGradient(size * 0.48, size * 0.42, size * 0.06, size * 0.5, size * 0.5, size * 0.48);
  gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
  gradient.addColorStop(0.3, 'rgba(196,239,255,0.9)');
  gradient.addColorStop(0.55, 'rgba(127,205,255,0.48)');
  gradient.addColorStop(1, 'rgba(127,205,255,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

export function makeCloudTexture(THREE, size = 128, blobs = DEFAULT_CLOUD_BLOBS) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawCloudBlobs(ctx, size, blobs);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeBubbleTexture(THREE, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawBubbleGlow(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
```

`makeCloudTexture`/`makeBubbleTexture` reference the global `document` and take `THREE` as a parameter instead of importing it, so this module has no import-time dependency on a DOM or on `three` — only calling those two functions requires a browser. They are exercised by the lesson screenshots in Task 7, not by `node:test`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: PASS — 8 tests passed

- [ ] **Step 5: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/effects/organic-texture.mjs tests/effects.test.mjs && git commit -m "feat: add organic-texture effect helper"
```

---

### Task 5: `liquid-shader.mjs`

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/effects/liquid-shader.mjs`
- Test: `chem-courseware-skill/tests/effects.test.mjs` (append)

- [ ] **Step 1: Write the failing test**

Append to `chem-courseware-skill/tests/effects.test.mjs`:

```javascript
import { createFlowMaterial } from '../skills/chem-courseware-base/effects/liquid-shader.mjs';

test('createFlowMaterial returns a ShaderMaterial with default uniforms', () => {
  const material = createFlowMaterial();
  assert.ok(material instanceof THREE.ShaderMaterial);
  assert.equal(material.uniforms.uOpacity.value, 0.7);
  assert.equal(material.uniforms.uColor.value.getHexString(), 'bcecff');
  assert.equal(material.uniforms.uGlow.value.getHexString(), '67d8ff');
  assert.match(material.vertexShader, /uTime/);
  assert.match(material.fragmentShader, /fresnel/);
});

test('createFlowMaterial accepts custom color and glow', () => {
  const material = createFlowMaterial({ color: 0xff0000, glow: 0x00ff00 });
  assert.equal(material.uniforms.uColor.value.getHexString(), 'ff0000');
  assert.equal(material.uniforms.uGlow.value.getHexString(), '00ff00');
});
```

(The `import * as THREE from 'three';` already added in Task 3 covers this file too — no new import needed.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: FAIL — `Cannot find module '../skills/chem-courseware-base/effects/liquid-shader.mjs'`

- [ ] **Step 3: Write minimal implementation**

Create `chem-courseware-skill/skills/chem-courseware-base/effects/liquid-shader.mjs`:

```javascript
import * as THREE from 'three';

export function createFlowMaterial({ color = 0xbcecff, glow = 0x67d8ff } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.7 },
      uColor: { value: new THREE.Color(color) },
      uGlow: { value: new THREE.Color(glow) }
    },
    vertexShader: `
      varying vec3 vViewNormal;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wobble = sin(pos.y * 14.0 + uTime * 9.0) * 0.012
          + sin(pos.y * 31.0 - uTime * 14.0) * 0.006;
        pos.x += wobble;
        pos.z += wobble * 0.6;
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vViewNormal;
      varying vec2 vUv;
      uniform float uOpacity;
      uniform vec3 uColor;
      uniform vec3 uGlow;
      void main() {
        float fresnel = pow(1.0 - abs(vViewNormal.z), 2.2);
        vec3 color = mix(uColor, uGlow, fresnel);
        float edgeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        gl_FragColor = vec4(color, uOpacity * (0.55 + fresnel * 0.6) * edgeFade);
      }
    `
  });
}
```

This is the same shader already proven to render without console errors in
`examples/sugar-h2so4-v2.html` (built earlier in this project), now generalized
into a reusable factory with configurable `color`/`glow`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd chem-courseware-skill && node --test tests/effects.test.mjs`
Expected: PASS — 10 tests passed

- [ ] **Step 5: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/effects/liquid-shader.mjs tests/effects.test.mjs && git commit -m "feat: add liquid-shader effect helper"
```

---

### Task 6: Visibility checklist reference

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/references/visibility-checklist.md`

- [ ] **Step 1: Write the checklist file**

Create `chem-courseware-skill/skills/chem-courseware-base/references/visibility-checklist.md`:

```markdown
# Visibility checklist

Review against the three screenshots produced by `scripts/pw-capture-checkpoints.mjs`
(`idle.png`, `mid.png`, `aftermath.png`) before calling a lesson render-verified.

- [ ] At rest (after an auto-trigger animation finishes, or after a manual drag is
      released), is the interactive object actually inside its own activation zone —
      not just visually close to it? Check the activation-condition function in the
      lesson's own code (e.g. an `isXAboveY()`-style check) against the resting
      position's actual coordinates, not just how it looks in the screenshot.
- [ ] Is the main reactive object (beaker/flask contents, reaction mass, precipitate,
      etc.) clearly identifiable in the screenshot, not blended into a background prop
      or a near-invisible transparent material?
- [ ] Do `idle.png`, `mid.png`, and `aftermath.png` read as three visually distinct
      states at a glance, without zooming in or reading the HUD text?
- [ ] If any of the above fails, fix the underlying scene (position, material opacity,
      camera framing) before spending more effort on shader/particle polish — cosmetic
      upgrades on an invisible phenomenon are wasted work.
```

- [ ] **Step 2: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/references/visibility-checklist.md && git commit -m "docs: add visibility checklist reference"
```

---

### Task 7: `pw-capture-checkpoints.mjs` script

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs`

- [ ] **Step 1: Write the script**

Create `chem-courseware-skill/skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs`:

```javascript
import path from 'node:path';
import { runPlaywrightPage } from '../../../scripts/pw-browser-utils.mjs';

const [, , htmlPath, triggerSelector, outDir, midMs = '3500', aftermathMs = '9000'] = process.argv;

if (!htmlPath || !triggerSelector || !outDir) {
  console.error('Usage: node pw-capture-checkpoints.mjs <html-path> <trigger-selector> <out-dir> [midMs] [aftermathMs]');
  process.exit(1);
}

const resolvedHtmlPath = path.resolve(htmlPath);

const idle = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  screenshotPath: path.join(outDir, 'idle.png')
});

const mid = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  actions: [{ type: 'click', selector: triggerSelector, afterMs: Number(midMs) }],
  screenshotPath: path.join(outDir, 'mid.png')
});

const aftermath = await runPlaywrightPage({
  htmlPath: resolvedHtmlPath,
  actions: [{ type: 'click', selector: triggerSelector, afterMs: Number(aftermathMs) }],
  screenshotPath: path.join(outDir, 'aftermath.png')
});

console.log(JSON.stringify({
  check: 'pw-capture-checkpoints',
  idle: { ok: idle.ok, screenshot: idle.screenshotPath },
  mid: { ok: mid.ok, screenshot: mid.screenshotPath },
  aftermath: { ok: aftermath.ok, screenshot: aftermath.screenshotPath }
}, null, 2));

process.exit(0);
```

The relative import `../../../scripts/pw-browser-utils.mjs` resolves from
`chem-courseware-skill/skills/chem-courseware-base/scripts/` up to
`chem-courseware-skill/scripts/pw-browser-utils.mjs` — the same helper already used
by `scripts/pw-capture-screenshot.mjs`, so no new browser-automation code is added.

- [ ] **Step 2: Run it against the existing v2 prototype to verify it works end-to-end**

Run:
```bash
cd chem-courseware-skill && mkdir -p /tmp/visibility-check && node skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs examples/sugar-h2so4-v2.html '#pourBtn' /tmp/visibility-check
```
Expected: prints a JSON object with `idle.ok`, `mid.ok`, `aftermath.ok` all `true`, and
`/tmp/visibility-check/idle.png`, `mid.png`, `aftermath.png` all exist.

Verify the files were created:
```bash
ls -la /tmp/visibility-check/
```
Expected: three `.png` files listed.

- [ ] **Step 3: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs && git commit -m "feat: add pw-capture-checkpoints visibility verification script"
```

---

### Task 8: `chem-courseware-base/SKILL.md`

**Files:**
- Create: `chem-courseware-skill/skills/chem-courseware-base/SKILL.md`

- [ ] **Step 1: Write the SKILL.md**

Create `chem-courseware-skill/skills/chem-courseware-base/SKILL.md`:

```markdown
---
name: chem-courseware-base
description: Use this whenever building chemistry courseware visuals that need richer liquid/smoke/particle effects, or before calling a 3D chemistry lesson's interaction "render-verified" — provides shared Three.js effect helpers (flowing-liquid shader, organic particle textures, bumpy/porous surface displacement, particle pop-then-fade) and a 3-checkpoint visibility verification script plus checklist. Does not yet provide the shared HTML shell/theme/build pipeline (tracked separately).
---

# Chemistry courseware base — effects & visibility

## Current scope (read this first)
This skill currently provides two things only:
- `effects/` — shared Three.js helper functions for liquid/smoke/particle/porous-surface effects.
- `scripts/pw-capture-checkpoints.mjs` + `references/visibility-checklist.md` — a 3-screenshot
  capture script and manual checklist for verifying a lesson's key phenomenon is actually visible.

It does **not** yet provide the shared HTML shell, visual theme, vendored Three.js runtime, or
`assemble-courseware.mjs` build step described in
`docs/superpowers/specs/2026-06-24-chem-courseware-base-skill-design.md` — that remains a
separate, not-yet-implemented plan. Do not assume `templates/`, `vendor/`, or a build step exist
here yet.

## When to use this skill
Called by a content skill (`chem-3d-experiment`, or any future courseware skill) at the point it
would otherwise hand-write a liquid shader, a steam/smoke sprite texture, or a porous/charred
surface — and again at the point it would otherwise skip checking whether the phenomenon it just
built is actually visible on screen.

## Effects API
Import from `effects/<name>.mjs` (ESM, browser-side, via the calling lesson's own `three`
importmap):

- `liquid-shader.mjs` — `createFlowMaterial({ color, glow })` returns a `THREE.ShaderMaterial`
  with vertical wave displacement and a fresnel-style edge glow, for pour streams and flowing
  liquids. Defaults: `color: 0xbcecff`, `glow: 0x67d8ff`.
- `organic-texture.mjs` — `drawCloudBlobs(ctx, size, blobs?)` and `drawBubbleGlow(ctx, size)` draw
  onto a given 2D canvas context (multi-blob cloud vs. single radial bubble glow);
  `makeCloudTexture(THREE, size?, blobs?)` and `makeBubbleTexture(THREE, size?)` wrap those into a
  ready-to-use `THREE.CanvasTexture` (browser-only — pass in the lesson's own `THREE` namespace).
- `jitter-geometry.mjs` — `jitterGeometry(geometry, amount)` mutates a `THREE.BufferGeometry` in
  place with one-time per-vertex bump displacement (then recomputes normals), for organic-looking
  char/rock/porous surfaces. Returns the same geometry instance.
- `particle-pop.mjs` — `popThenFade(t, baseScale, popStart = 0.82)` returns `{ scale, alpha }`:
  linear fade before `popStart`, a swell-then-vanish curve after — use inside a particle's
  per-frame update instead of a plain `1 - t` fade.

## Visibility verification
Before calling any 3D chemistry lesson done:
1. Run `node skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs <html-path>
   <trigger-selector> <out-dir>` to produce `idle.png`, `mid.png`, `aftermath.png`.
2. Review the three screenshots against
   `skills/chem-courseware-base/references/visibility-checklist.md`.
3. Do not skip this because the scene "renders without errors" — a scene can render cleanly and
   still make its own chemistry phenomenon invisible (this is exactly the defect this checklist
   was written to catch).

## What this skill does not do
- Does not pick the courseware type or write lesson content.
- Does not provide the shared HTML shell, theme CSS, vendored Three.js runtime, or build step —
  see "Current scope" above.
- Does not replace `chem-3d-experiment`, `chem-3d-visualization`, or `chem-process-storyboard`.
```

- [ ] **Step 2: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-courseware-base/SKILL.md && git commit -m "docs: add chem-courseware-base SKILL.md (effects + visibility scope)"
```

---

### Task 9: Update `chem-3d-experiment/SKILL.md`

**Files:**
- Modify: `chem-courseware-skill/skills/chem-3d-experiment/SKILL.md:25-34` (insert new section after "Reuse existing skills")
- Modify: `chem-courseware-skill/skills/chem-3d-experiment/SKILL.md:69-76` (extend "Verification rules")

- [ ] **Step 1: Insert the effect-library reuse section**

In `chem-courseware-skill/skills/chem-3d-experiment/SKILL.md`, find this block (lines 25–34):

```markdown
## Reuse existing skills
- use `threejs-fundamentals` for scene, camera, lights, renderer, timing, resize handling
- use `threejs-interaction` for dragging, clicking, controls, hover states, and gesture flow
- use `threejs-animation` for liquid motion, bubbles, steam, expansion, glow, particle behavior, and temporal reaction phases
- use `threejs-shaders` for procedural flames/smoke (vertex displacement + fragment noise), additive blending looks, and custom materials
- use `threejs-textures` for gradient/noise canvas/data textures and any texture tuning needed for readability
- use `threejs-postprocessing` for bloom/glow and subtle screen-space polish when the phenomenon’s look matters (flame, sparks, smoke)
- use `threejs-materials` + `threejs-lighting` when realism/legibility matters (PBR tuning, rim/key/fill balance)
- use `threejs-geometry` only when primitives are too limiting for clear apparatus shapes (tubes, custom vessels)
- use `threejs-loaders` only when bundling local assets is justified (avoid remote fetch dependencies)
```

Replace it with the same block plus a new section immediately after:

```markdown
## Reuse existing skills
- use `threejs-fundamentals` for scene, camera, lights, renderer, timing, resize handling
- use `threejs-interaction` for dragging, clicking, controls, hover states, and gesture flow
- use `threejs-animation` for liquid motion, bubbles, steam, expansion, glow, particle behavior, and temporal reaction phases
- use `threejs-shaders` for procedural flames/smoke (vertex displacement + fragment noise), additive blending looks, and custom materials
- use `threejs-textures` for gradient/noise canvas/data textures and any texture tuning needed for readability
- use `threejs-postprocessing` for bloom/glow and subtle screen-space polish when the phenomenon’s look matters (flame, sparks, smoke)
- use `threejs-materials` + `threejs-lighting` when realism/legibility matters (PBR tuning, rim/key/fill balance)
- use `threejs-geometry` only when primitives are too limiting for clear apparatus shapes (tubes, custom vessels)
- use `threejs-loaders` only when bundling local assets is justified (avoid remote fetch dependencies)

## Effect library reuse
Build liquids, smoke/steam, and porous/charred masses using `chem-courseware-base`'s effect
helpers instead of hand-writing inline shaders or canvas gradients per lesson:
- pour streams / flowing liquids → `chem-courseware-base/effects/liquid-shader.mjs`
- smoke/steam puffs and bubble glow sprites → `chem-courseware-base/effects/organic-texture.mjs`
- char/rock/porous surface bumpiness → `chem-courseware-base/effects/jitter-geometry.mjs`
- particle fade-out near end of life → `chem-courseware-base/effects/particle-pop.mjs`

A fix to one of these helpers should improve every lesson built after it, instead of drifting
per-file the way the visual theme already has.
```

- [ ] **Step 2: Extend the verification rules**

In the same file, find this block (lines 69–76):

```markdown
## Verification rules
The output is not complete until:
- the module imports work
- the scene visibly renders
- the golden path interaction works
- reset works
- the main chemistry state change is observable
- `ui-ux-tester` has reviewed the page
```

Replace it with:

```markdown
## Verification rules
The output is not complete until:
- the module imports work
- the scene visibly renders
- the golden path interaction works
- reset works
- the main chemistry state change is observable
- any automatic rest/trigger position satisfies its own activation-condition function (e.g. an
  `isXAboveY()`-style check) — verified by running
  `chem-courseware-base/scripts/pw-capture-checkpoints.mjs` and reviewing the result against
  `chem-courseware-base/references/visibility-checklist.md`
- transparent container contents (glass beakers/bottles/vessels) stay legible against the chosen
  background — confirmed via the same 3-checkpoint screenshots
- `ui-ux-tester` has reviewed the page
```

- [ ] **Step 3: Commit**

```bash
cd chem-courseware-skill && git add skills/chem-3d-experiment/SKILL.md && git commit -m "docs: require chem-courseware-base effects and visibility verification in chem-3d-experiment"
```

---

### Task 10: Full regression check

**Files:** none (verification only)

- [ ] **Step 1: Run the new effects test suite**

Run: `cd chem-courseware-skill && npm run test:effects`
Expected: all 10 tests pass, 0 failures.

- [ ] **Step 2: Re-run the checkpoint script once more to confirm nothing regressed after the SKILL.md edits**

Run:
```bash
cd chem-courseware-skill && node skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs examples/sugar-h2so4-v2.html '#pourBtn' /tmp/visibility-check
```
Expected: same JSON output shape as Task 7 Step 2, all three `ok: true`.

- [ ] **Step 3: Confirm git history is clean**

Run: `cd chem-courseware-skill && git log --oneline -10`
Expected: one commit per task (1 through 9), newest first, no uncommitted changes (`git status --short` empty for these paths).

---

## Explicitly out of scope (for this plan)

- Fixing the auto-trigger position or glass opacity inside `examples/sugar-h2so4.html` or
  `examples/sugar-h2so4-v2.html` themselves — this plan builds the *tools* to catch and fix that
  class of bug; applying them to the prototype lesson is the "Next step" called out in
  `docs/superpowers/specs/2026-06-24-chem-courseware-effects-and-visibility-design.md`, and should
  be its own follow-up plan.
- Building the shared HTML shell, vendored Three.js runtime, or `assemble-courseware.mjs` build
  step from `docs/superpowers/specs/2026-06-24-chem-courseware-base-skill-design.md`.
- Changing `chem-3d-visualization/SKILL.md` or `chem-process-storyboard/SKILL.md`.
- Any automated geometric/heuristic pass/fail assertion for visibility (the spec explicitly chose
  a manual checklist over this).
