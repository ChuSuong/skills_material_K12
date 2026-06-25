---
name: chem-courseware-base
description: Use this as the entry point for any chemistry courseware request. It reads the learner's intent, routes to an existing content skill under references/content-skills/ if one fits, builds a new one via references/skill-creation/ if not, then provides the shared Three.js effect helpers, visual theme/shell templates, a vendored offline Three.js runtime, the assemble-courseware.mjs build step, and visibility/offline verification used to produce the final generated/<kind>/<slug>/ lesson.
---

# Chemistry courseware base

## Core goal
Single entry point for chemistry courseware generation: decide *what* to build — route to an
existing content skill, or build a new one — then provide everything needed to *build it*
(effects, templates, vendored Three.js, the assemble step, and visibility/offline verification).

## Folder map
```
SKILL.md
effects/                          shared Three.js effect helpers (see "Effects API")
templates/                        shell.html + theme.css (see "Build step")
vendor/three/                     vendored Three.js + OrbitControls (offline, no CDN)
scripts/                          assemble-courseware.mjs, pw-assert-offline.mjs,
                                   pw-capture-checkpoints.mjs (+ its 2 runtime helpers)
references/
  content-skills/                 chem-3d-experiment, chem-3d-visualization,
                                   chem-process-storyboard — read these to decide what to build
                                   and how to author it
  threejs/                        threejs-fundamentals, -interaction, -animation, -shaders,
                                   -textures, -materials, -lighting, -geometry, -loaders,
                                   -postprocessing — Three.js technique reference, used as needed
                                   while writing a lesson's scene.js
  skill-creation/                 chem-skill-builder (chemistry-specific decision process) +
                                   skill-creator (the generic tool it calls) — only consulted when
                                   no content-skill fits
  visibility-checklist.md         see "Visibility verification"
```

## Routing workflow
1. **Read intent.** Extract: chemistry topic, target learner level, whether the goal is
   conceptual/procedural/observational/interactive, and what the learner should see or do on
   screen.
2. **Check `references/content-skills/` for a fit.** Read each candidate's `SKILL.md`:
   - `chem-3d-experiment` — lab actions, apparatus, pouring, heating, bubbling, color change,
     precipitate, smoke, reaction aftermath.
   - `chem-3d-visualization` — molecules, orbitals, lattices, structure, spatial explanation.
   - `chem-process-storyboard` — mechanisms, intermediates, staged "step 1 → step 2 → step 3"
     processes.
   If the prompt sounds like a graph/table/definition (rate vs. time, amount vs. time), do not
   default to a schematic diagram — identify the observable variable over time and prefer
   `chem-3d-experiment` with a specimen-first stage, unless the user explicitly asks for a
   graph-first lesson.
3. **If none fit, build a new content skill** via `references/skill-creation/`:
   - `chem-skill-builder/SKILL.md` first — its workflow requires confirming no existing skill
     (local or external/adjacent) can be reused or adapted before writing anything new, keeping
     the new skill narrow enough to trigger reliably, and defining eval prompts plus a
     verification checklist.
   - `skill-creation/skill-creator/` is the generic tool `chem-skill-builder` calls to draft,
     validate (`scripts/quick_validate.py`), and package (`scripts/package_skill.py`) the new
     skill's `SKILL.md` and resources.
   - Feed the resulting skill back into `references/content-skills/` so future requests route to
     it directly instead of rebuilding it. Building a new content skill should stay rare — most
     requests should match an existing one in step 2.
4. **Author the lesson** following the chosen content skill's rules, consulting
   `references/threejs/*` for Three.js technique as needed, and using this skill's own `effects/`
   helpers instead of hand-writing liquid/smoke/particle/porous-surface code.
5. **Assemble and verify** using the build step and verification scripts below.

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

Drive any per-specimen timer (reaction progress, particle lifetime) from elapsed wall-clock time,
not from accumulating a per-frame `dt` — a frame-clamped `dt` accumulator advances far slower than
real time whenever the actual frame rate drops below the clamp's assumed rate (seen in headless
Playwright runs at ~2fps, and plausible on weak classroom hardware).

## Authoring contract (what a content skill provides)
Instead of hand-writing a full `index.html`, write three small inputs per lesson into a drafts
folder (any path; pass it as the third CLI argument):

- `<slug>.hud.html` — the HUD fragment only (the `.panel`/`.secondary`/`.status` markup), no
  `<style>`/`<head>`/`<canvas>`. A lesson needing CSS beyond the shared `theme.css` classes can
  include its own scoped `<style>` block at the top of this fragment.
- `<slug>.scene.js` — scene setup, animation, and interaction logic. Imports `three` via a bare
  specifier (`import * as THREE from 'three'`) — the assembled page's importmap resolves it.
  Targets `#stage` (the shell template's fixed canvas id).
- `<slug>.meta.json` — `{ topic, level, skill, renderMode, themeVersion }`. `renderMode` must be
  `"threejs"` or `"dom"`. All five fields are required; the build step rejects a draft missing any
  of them.

## Build step
Run:

```
node scripts/assemble-courseware.mjs <kind> <slug> <draftsDir>
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
1. Run `node scripts/pw-capture-checkpoints.mjs <html-path> <trigger-selector> <out-dir>` to
   produce `idle.png`, `mid.png`, `aftermath.png`.
2. Review the three screenshots against `references/visibility-checklist.md`.
3. Do not skip this because the scene "renders without errors" — a scene can render cleanly and
   still make its own chemistry phenomenon invisible (this is exactly the defect this checklist
   was written to catch). A material with high `metalness` and no environment map can render a
   color change as nearly invisible even when the underlying value is changing correctly — check
   actual rendered contrast, not just the code.

## Proving a lesson is actually offline
After assembling, run:

```
node scripts/pw-assert-offline.mjs generated/<kind>/<slug>/index.html
```

This opens the lesson via `file://` with all non-`file://` network requests blocked in Playwright,
and asserts it still renders a canvas with no console/page errors. Module scripts loaded from a
separate `scene.js` file require Chromium to be launched with `--allow-file-access-from-files`
even with network otherwise blocked — `pw-assert-offline.mjs` already does this.

## What this skill does not do
- Does not write a lesson's actual scene/HUD content itself — that judgment belongs to whichever
  content skill under `references/content-skills/` the routing step selects. This skill provides
  the shared tooling (effects, build, verify), not chemistry-specific authoring decisions.
- Does not migrate the six lessons already in `generated/` that predate this build step.
- Treats "build a new content skill" (routing step 3) as the rare path — `chem-skill-builder`'s
  own workflow requires exhausting local/external reuse first.
