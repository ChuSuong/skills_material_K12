# Chem courseware effects & visibility verification — design spec

Date: 2026-06-24
Scope: `chem-courseware-skill/`
Addendum to: `2026-06-24-chem-courseware-base-skill-design.md` (that spec is unchanged;
this document adds to it before `chem-courseware-base` is built).

## Background

While prototyping a "wow" visual upgrade for `examples/sugar-h2so4.html` (in
`examples/sugar-h2so4-v2.html`, kept separate from the reference file), screenshot
checkpoints at idle / mid-pour / aftermath surfaced a defect: the reaction never
becomes visually legible when triggered through the "Rót thử ngay" auto-pour
button.

Root causes, confirmed identical in the untouched original `sugar-h2so4.html`
(same bug, not introduced by the prototype):

1. **Self-inconsistent auto-trigger position.** `isBottleAboveBeaker()` requires
   horizontal distance between nozzle and beaker mouth `< 0.92`. The auto-pour
   rest target `(0.55, 4.55, 0.85)` is `1.01` away. The bottle passes through the
   activation zone in transit (so `reactionStarted` does latch true and
   `reactionTime` keeps advancing), but the bottle's resting position fails its
   own activation check — every screenshot taken after the bottle "settles"
   shows no pour stream and a deceptively idle-looking scene.
2. **Insufficient contrast on transparent containers.** Beaker glass
   (`opacity: 0.28, transmission: 0.96`) against the dark scene background
   reads as a flat reflective disc; sugar/carbon contents sitting below the
   tray's visual rim are effectively invisible in every checkpoint screenshot.

Neither defect is a shader/effect-quality problem — they make the underlying
phenomenon unobservable regardless of how good the liquid/smoke/bloom effects
are. Cosmetic effect work done before fixing this is invisible work.

## Decision: two additions, both feeding into `chem-courseware-base`

This spec adds two things to the not-yet-built `chem-courseware-base` skill
(designed in the base spec, still unimplemented) before that skill is built:

1. A small shared **effects library** (generalizing the shader/texture work
   already prototyped in `sugar-h2so4-v2.html`) so content skills stop
   hand-writing shaders/canvas-gradients per lesson.
2. A **visibility verification step** (manual checklist + a scripted 3-checkpoint
   screenshot capture) that every content skill must run, codifying exactly the
   check that caught the bug above.

`chem-3d-experiment/SKILL.md` is updated to require both. The other two content
skills (`chem-3d-visualization`, `chem-process-storyboard`) are not touched by
this spec — they may adopt the same rules later, as a separate decision.

## Part A — Shared effects library

New bundled resources under `chem-courseware-base/effects/` (in addition to the
`templates/`, `vendor/`, `scripts/` already planned in the base spec):

```
chem-courseware-base/effects/
├── liquid-shader.mjs      # createFlowMaterial({ color, glow }) -> THREE.ShaderMaterial
│                            wavy vertical displacement + fresnel-style edge glow,
│                            generalized from sugar-h2so4-v2.html's stream material.
├── organic-texture.mjs    # makeCloudTexture(), makeBubbleTexture() -> THREE.CanvasTexture
│                            multi-blob radial gradients instead of one perfect circle.
├── jitter-geometry.mjs    # jitterGeometry(geometry, amount) -> mutates geometry in place
│                            one-time per-vertex bump displacement for organic surfaces
│                            (char/rock/porous masses), then recomputes normals.
└── particle-pop.mjs       # popThenFade(t, baseScale) -> { scale, alpha }
                             "swell then vanish" curve for the last ~18% of a
                             particle's life, replacing linear fade-out.
```

Each export is a pure function/factory: takes plain parameters (color, amount,
base scale), returns a `THREE.Material`/`THREE.Texture`/plain numbers. No
dependency on any specific scene graph — a calling content skill wires the
result onto its own meshes/particle pools. This mirrors how `threejs-*` skills
are already consumed (capability modules, not scene templates).

`chem-3d-experiment/SKILL.md` gains a new rule: liquids, smoke/steam, and
porous/charred masses must be built using these helpers instead of inline
`ShaderMaterial`/canvas-gradient code, so a future fix to one helper improves
every lesson built after it, instead of drifting per-file the way the visual
theme already did (per the base spec's problem 2).

## Part B — Visibility verification

### New rule: self-consistent auto-trigger positions

Whenever a content skill defines an automatic action that moves an object to a
rest pose meant to satisfy some activation condition (e.g., "hover above
target" for a pour/drop/contact interaction), the rest pose must be checked
against that literal activation-condition function before shipping — not
eyeballed as "looks close enough" in the 3D editor view. This is a new line in
`chem-3d-experiment/SKILL.md`'s verification rules section.

### New rule: minimum legibility for transparent containers

Transparent materials (glass beakers, bottles, vessels) must keep contents
identifiable against the chosen dark background. This is enforced by the
checklist below (visual judgment), not a numeric opacity floor — different
scenes have different lighting, so a fixed number would be wrong as often as
right.

### Scripted 3-checkpoint capture

New `chem-courseware-base/scripts/pw-capture-checkpoints.mjs`:

```
node scripts/pw-capture-checkpoints.mjs <html-path> <trigger-selector> <out-dir>
```

Reuses `runPlaywrightPage` from `chem-courseware-skill/scripts/pw-browser-utils.mjs`
(no new browser-automation code) to produce three fixed-name screenshots:

- `idle.png` — page loaded, no interaction.
- `mid.png` — `trigger-selector` clicked, short wait (tuned per lesson's own
  pacing, default 3.5s).
- `aftermath.png` — same click, longer wait (default 9s).

This is exactly the throwaway script used to catch the bug in this session,
promoted to a reusable, named tool instead of being written ad hoc each time.

### Manual checklist

New `chem-courseware-base/references/visibility-checklist.md`, reviewed against
the 3 screenshots above before a lesson is considered render-verified:

- [ ] At rest (post auto-trigger or post drag-release), is the interactive
      object actually inside its own activation zone, not just near it?
- [ ] Is the main reactive object (beaker contents, reaction mass, etc.)
      identifiable on screen, not blended into a background/prop?
- [ ] Do idle / mid / aftermath read as three visually distinct states at a
      glance?

This is a human-judgment checklist, not an automated pass/fail script — the
session that produced this spec showed that eyeballing real screenshots is
what caught the bug; a geometric/heuristic assertion would have caught only
this one known failure mode, not the broader "is it actually legible" question.

## What this spec does not do

- Does not fix `examples/sugar-h2so4.html` (the original reference file used by
  three SKILL.md files). The same two defects exist there, confirmed by a
  side-by-side screenshot during this session, but fixing the canonical
  reference file is tracked as a separate follow-up, not part of this spec.
- Does not change `chem-3d-visualization/SKILL.md` or
  `chem-process-storyboard/SKILL.md`.
- Does not build the open equipment-library "sandbox" interaction style seen in
  the Nobook/THS virtual lab reference (`ths-chemistry-virtual-lab` site) — that
  remains a separate, much larger future skill decision.
- Does not add automated geometric/heuristic pass/fail assertions for
  visibility — deferred in favor of the manual checklist (see Part B).
- Does not modify the original `2026-06-24-chem-courseware-base-skill-design.md`
  spec file; this document is additive to it.

## Next step

Once `chem-courseware-base` is built (per the base spec plus this addendum),
revisit `sugar-h2so4-v2.html`: apply Part B's fixes first (auto-trigger position,
container legibility), re-run the same 3-checkpoint screenshots already taken
for the Part-A-style liquid/smoke/char effects, and only then judge whether
those effects read as "wow" — the prior judgement was made on a scene where the
phenomenon wasn't visible, so it wasn't a fair test.
