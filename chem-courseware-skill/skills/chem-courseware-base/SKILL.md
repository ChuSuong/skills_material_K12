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
