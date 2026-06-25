---
name: chem-courseware-base
description: Use this whenever building chemistry courseware visuals that need richer liquid/smoke/particle effects, before calling a 3D chemistry lesson's interaction "render-verified", or when assembling a lesson's HUD/scene/metadata drafts into generated/ output — provides shared Three.js effect helpers, a 3-checkpoint visibility verification script plus checklist, a vendored offline Three.js runtime + shared theme/shell templates, and the assemble-courseware.mjs build step.
---

# Chemistry courseware base — effects & visibility

## Current scope (read this first)
This skill provides three things:
- `effects/` — shared Three.js helper functions for liquid/smoke/particle/porous-surface effects.
- `scripts/pw-capture-checkpoints.mjs` + `references/visibility-checklist.md` — a 3-screenshot
  capture script and manual checklist for verifying a lesson's key phenomenon is actually visible.
- `templates/`, `vendor/three/`, and `scripts/assemble-courseware.mjs` — the shared visual theme,
  a vendored offline Three.js runtime, and the build step that turns a content skill's
  `<slug>.hud.html` / `<slug>.scene.js` / `<slug>.meta.json` draft into a standard
  `generated/<kind>/<slug>/` lesson.

## When to use this skill
Called by a content skill (`chem-3d-experiment`, or any future courseware skill) at the point it
would otherwise hand-write a liquid shader, a steam/smoke sprite texture, or a porous/charred
surface; at the point it would otherwise hand-write a full `index.html` shell instead of providing
`.hud.html`/`.scene.js`/`.meta.json` drafts; and again at the point it would otherwise skip
checking whether the phenomenon it just built is actually visible on screen.

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

## Authoring contract (what a content skill provides)
Instead of hand-writing a full `index.html`, write three small inputs per lesson into a drafts
folder (any path; pass it as the third CLI argument):

- `<slug>.hud.html` — the HUD fragment only (the `.panel`/`.secondary`/`.status` markup), no
  `<style>`/`<head>`/`<canvas>`.
- `<slug>.scene.js` — scene setup, animation, and interaction logic. Imports `three` via a bare
  specifier (`import * as THREE from 'three'`) — the assembled page's importmap resolves it.
- `<slug>.meta.json` — `{ topic, level, skill, renderMode, themeVersion }`. `renderMode` must be
  `"threejs"` or `"dom"`. All five fields are required; the build step rejects a draft missing any
  of them.

## Build step
Run:

```
node skills/chem-courseware-base/scripts/assemble-courseware.mjs <kind> <slug> <draftsDir>
```

This reads `<draftsDir>/<slug>.hud.html`, `.scene.js`, `.meta.json` and writes
`generated/<kind>/<slug>/index.html` + `scene.js` (copied as-is) + `metadata.json`. `theme.css` is
always inlined into `<style>`. When `renderMode` is `"threejs"`, a relative-path
`<script type="importmap">` pointing into `vendor/three/` is added — never the CDN, never an
inlined copy, so every lesson stays runnable with no network access. When `renderMode` is `"dom"`,
no importmap or Three.js reference is added at all.

## `metadata.json` schema
```json
{
  "topic": "string",
  "level": "string",
  "skill": "string",
  "renderMode": "threejs | dom",
  "themeVersion": "string",
  "created_at": "ISO 8601 timestamp",
  "verify_status": "pending | pass | fail"
}
```
`created_at` and `verify_status` are written by the build step, not the calling skill.
`verify_status` starts `"pending"`; a later verification step (not yet implemented) is responsible
for updating it to `"pass"` or `"fail"`.

## Draft/final screenshot convention
Verification screenshots that are not the accepted final state go in an `iterations/` subfolder
under the lesson directory; only screenshots that passed verification stay alongside `index.html`.
This is a naming convention for whoever runs verification — `assemble-courseware.mjs` does not
create or touch screenshots.

## Visibility verification
Before calling any 3D chemistry lesson done:
1. Run `node skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs <html-path>
   <trigger-selector> <out-dir>` to produce `idle.png`, `mid.png`, `aftermath.png`.
2. Review the three screenshots against
   `skills/chem-courseware-base/references/visibility-checklist.md`.
3. Do not skip this because the scene "renders without errors" — a scene can render cleanly and
   still make its own chemistry phenomenon invisible (this is exactly the defect this checklist
   was written to catch).

## Proving a lesson is actually offline
After assembling, run:

```
node skills/chem-courseware-base/scripts/pw-assert-offline.mjs generated/<kind>/<slug>/index.html
```

This opens the lesson via `file://` with all non-`file://` network requests blocked in Playwright,
and asserts it still renders a canvas with no console/page errors. Module scripts loaded from a
separate `scene.js` file require Chromium to be launched with `--allow-file-access-from-files`
even with network otherwise blocked — `pw-assert-offline.mjs` already does this.

## What this skill does not do
- Does not pick the courseware type or write lesson content.
- Does not yet have any caller actually using the `.hud.html`/`.scene.js`/`.meta.json` authoring
  contract — `chem-3d-experiment`, `chem-3d-visualization`, and `chem-process-storyboard` still
  hand-write a complete `index.html` themselves. Adopting this build step in those skills is a
  separate, future decision.
- Does not migrate the six lessons already in `generated/` to this build step.
- Does not replace `chem-3d-experiment`, `chem-3d-visualization`, or `chem-process-storyboard`.
