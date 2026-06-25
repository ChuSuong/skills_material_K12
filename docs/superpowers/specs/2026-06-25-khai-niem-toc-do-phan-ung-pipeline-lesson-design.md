
# Khái niệm tốc độ phản ứng hoá học — pipeline-built lesson design

Date: 2026-06-25
Scope: `chem-courseware-skill/`

## Background

A hand-written lesson already exists at
`generated/3d-experiment/khai-niem-toc-do-phan-ung/index.html`, covering the exact
textbook content supplied as input (Hình 19.1 — lượng chất theo thời gian; Hình
19.2 — than cháy nhanh / sắt gỉ chậm / tinh bột lên men rượu chậm). It predates
`chem-courseware-base`'s authoring contract and effects library, and was built
by hand-writing the full `index.html` (752 lines), including ad-hoc canvas/shader
code for the char glow, rust texture, and fermentation bubbles.

This spec covers rebuilding the same lesson content through the new
`chem-courseware-base` pipeline (`assemble-courseware.mjs` + the authoring
contract + the effects library), as the first real adopter of that pipeline,
without touching or replacing the existing approved lesson.

## Decision: new slug, not a migration

Output goes to a new slug, `khai-niem-toc-do-phan-ung-pipeline`, under the same
`3d-experiment` kind. The existing `khai-niem-toc-do-phan-ung` lesson and its
accepted screenshots are left untouched. This is explicitly a parallel rebuild
to prove the pipeline on real content — not a replacement decision, which is
out of scope here.

## Content (unchanged from the textbook input)

Three specimens, each independently clickable, each with its own
reactant/product mini line-chart, matching Hình 19.1 + 19.2:

- **a) Than cháy (charcoal burning)** — fast. `rate: 1.0`. Char lumps darken→glow
  orange, sparks rise and fade.
- **b) Sắt bị gỉ (iron rusting)** — slow. `rate: 0.045`. Iron bar gradually grows
  rust-colored blotches via a procedural canvas texture.
- **c) Tinh bột lên men rượu (starch fermentation)** — slow. `rate: 0.085`. Rice
  grains darken toward a fermented color, a liquid pool appears and rises in
  opacity, bubbles rise intermittently.

HUD: primary panel (title, description, hint, "Bắt đầu cả 3 phản ứng" +
"Đặt lại" buttons), secondary panel (chart legend + 3 mini canvases, one per
specimen, each redrawn every frame from a rolling history buffer), status panel
(`#statusText` / `#statusSub`).

This is a 1:1 content port of the existing lesson — no new chemistry content is
added. What changes is *how* it's built and which underlying effect code it uses.

## Effects library adoption

Per `chem-3d-experiment/SKILL.md`'s "Effect library reuse" section, replace the
hand-written effect code with `chem-courseware-base/effects/*`:

| Original hand-written code | Replaced with |
|---|---|
| Per-lump `MeshStandardMaterial` color/emissive lerp, no surface bumpiness | `jitterGeometry(geometry, 0.05)` applied to each char lump's `DodecahedronGeometry` before building the mesh, for a porous/charred surface |
| Manual spark `life`/`opacity` countdown loop | `popThenFade(t, baseScale)` from `particle-pop.mjs` driving each spark's scale/opacity over its lifetime |
| `MeshPhysicalMaterial` with `transmission`/`ior` for the fermentation liquid | `createFlowMaterial({ color: 0xf3ecd6, glow: 0xffce6b })` from `liquid-shader.mjs` |
| Plain `MeshPhysicalMaterial` spheres for rice-wine bubbles | `makeBubbleTexture(THREE)` from `organic-texture.mjs` applied as each bubble's material map |

The rust texture (procedural canvas blotches painted directly onto a
`CanvasTexture`) has no equivalent in the current effects library and stays
hand-written — `organic-texture.mjs` only covers cloud/bubble blob drawing, not
rust-blotch drawing. This is a known gap, not addressed by this lesson (adding a
generic "blotch/stain" texture helper to `chem-courseware-base/effects/` is a
candidate for a future, separate change if a second lesson needs the same
pattern).

## Authoring contract draft files

Per `chem-courseware-base/SKILL.md`'s authoring contract, write three inputs to
a drafts folder (not committed under `generated/`):

- `khai-niem-toc-do-phan-ung-pipeline.hud.html` — the `.panel`/`.secondary`/
  `.status` HUD markup, **plus an inline `<style>` block** at the top of the
  fragment for lesson-specific CSS the shared `theme.css` doesn't cover (chart
  grid layout, legend dot, button row layout). This is the chosen resolution to
  the gap identified during design: `theme.css` stays a small, generic shared
  base; anything lesson-specific travels with the lesson's own HUD draft instead
  of bloating the shared file or being invented ad hoc per lesson.
- `khai-niem-toc-do-phan-ung-pipeline.scene.js` — full scene setup (bench,
  camera, lights, OrbitControls, the three specimen groups, raycaster pick
  handling, animate loop), importing both `three` (bare specifier, resolved by
  the assembled page's importmap) and the four `chem-courseware-base/effects/*`
  helpers via a relative import path. Targets `document.getElementById('stage')`
  (the shell template's fixed canvas id) instead of the original's
  `'stageCanvas'`.
- `khai-niem-toc-do-phan-ung-pipeline.meta.json`:
  ```json
  {
    "topic": "Khái niệm tốc độ phản ứng hoá học",
    "level": "lop10",
    "skill": "chem-3d-experiment",
    "renderMode": "threejs",
    "themeVersion": "1.0.0"
  }
  ```

## Build and verify

1. `node skills/chem-courseware-base/scripts/assemble-courseware.mjs 3d-experiment khai-niem-toc-do-phan-ung-pipeline <draftsDir>`
   → produces `generated/3d-experiment/khai-niem-toc-do-phan-ung-pipeline/{index.html,scene.js,metadata.json}`.
2. `node skills/chem-courseware-base/scripts/pw-assert-offline.mjs generated/3d-experiment/khai-niem-toc-do-phan-ung-pipeline/index.html`
   → must report `ok: true` (proves the assembled lesson has no CDN/network dependency).
3. `node skills/chem-courseware-base/scripts/pw-capture-checkpoints.mjs generated/3d-experiment/khai-niem-toc-do-phan-ung-pipeline/index.html "#pourBtn" <out-dir>`
   → produces `idle.png`/`mid.png`/`aftermath.png`; review against
   `skills/chem-courseware-base/references/visibility-checklist.md` (char glow,
   rust blotches, and fermentation liquid/bubbles must each be distinguishable
   across the three screenshots, not just "renders without errors").

## Explicitly out of scope

- Migrating or deleting the existing `khai-niem-toc-do-phan-ung` lesson.
- Wiring `chem-3d-experiment` (the skill itself, as a reusable routing artifact)
  to always use this pipeline — this is one lesson built through it as a proof
  point, not an adoption decision for the skill in general.
- Adding a rust/blotch-stain helper to the effects library (noted gap above,
  not solved here).
- A `verify_status` update mechanism for `metadata.json` (stays `"pending"`
  after the build step, per the existing schema — no automated promotion to
  `"pass"` exists yet).
