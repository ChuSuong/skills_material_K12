# Chem courseware base skill — design spec

Date: 2026-06-24
Scope: `chem-courseware-skill/`

## Background

`chem-courseware-skill/` generates self-contained chemistry HTML lessons through three
content skills (`chem-3d-experiment`, `chem-3d-visualization`, `chem-process-storyboard`).
An audit of the repo (README gaps, SKILL.md diffs, and the six lessons already in
`generated/`) surfaced concrete bottlenecks in the output layer:

1. **Not actually offline.** Every generated lesson imports `three.js` and
   `OrbitControls` from `cdn.jsdelivr.net` via an inline `importmap`. This directly
   contradicts `chem-3d-experiment/SKILL.md`'s own "Rendering fidelity note"
   ("avoid dependencies that require HTTP fetches"). No `three` dependency exists
   anywhere in the repo to vendor from.
2. **Visual theme has already drifted.** The "Visual theme (standard)" block was
   copy-pasted verbatim into three separate SKILL.md files. The drift it warns
   against has already happened in generated output: `anh-huong-nong-do-toc-do-phan-ung`
   uses `h1 { font-size: 21px }` with no accent color, while
   `hinh-hoc-phan-tu-ch4-nh3-h2o` uses `font-size: 18px; color: var(--accent)` for
   the same role.
3. **~70–90% boilerplate per file.** Each generated `index.html` (389–956 lines)
   reimplements the same CSS theme, HUD markup, and Three.js scene/renderer setup
   from scratch. There is no shared shell to assemble from.
4. **`metadata.json` was promised, never built.** README step 7 says to save
   "the output HTML plus `metadata.json`" — no such file exists in any of the six
   `generated/**/` lesson directories. There is no machine-readable way to query
   which skill/level/topic a lesson used.
5. **No draft/final separation.** Two of six lesson directories mix
   `screenshot-broken*.png` / `screenshot-jar-bad.png` alongside the accepted
   final screenshots, with no naming or folder convention distinguishing them.
6. Separately (not addressed by this spec): `agents/grader.md`,
   `agents/verification-reviewer.md`, `agents/ui-ux-tester.md` are referenced by
   README but do not exist in the repo, and there is no skill registry for
   "what local skills exist." These are tracked as follow-up work, not part of
   this design.

## Decision: additive infrastructure, not a retrofit

This design only touches problems 1–5 (the output-template layer). It does **not**
modify the three existing content skills or migrate the six lessons already in
`generated/`. Those stay exactly as they are. The fix ships as a new, separate
skill that the existing skills may opt into later — adoption is a future decision,
not part of this change.

## New skill: `chem-courseware-base`

An infrastructure skill that owns the shared theme, vendored 3D runtime, and the
build step that assembles a lesson's content into the standard `generated/`
output shape. It is built with `skill-creator`
(`/home/sofier/skills_material_K12/.claude/skill-creator`), using the three
existing chemistry skills' conventions — the "Common output contract" and
"Default UI contract" sections in `chem-courseware-orchestrator/SKILL.md`
(`#statusText`, `#statusSub`, `#pourBtn`/`[data-action="autoplay"]`,
`#resetBtn`/`[data-action="reset"]`, Vietnamese learner-facing copy,
self-contained/offline output) — as the base reference material that
`chem-courseware-base` must stay consistent with.

### Bundled resources

```
chem-courseware-base/
├── SKILL.md
├── templates/
│   ├── theme.css        ← extracted from examples/visual-theme-template.html
│   └── shell.html        ← fixed <head>/<body> skeleton with placeholders
├── vendor/
│   └── three/
│       ├── three.module.js
│       └── OrbitControls.js
└── scripts/
    └── assemble-courseware.mjs
```

`examples/visual-theme-template.html` is the single source `theme.css` is
extracted from (not `examples/sugar-h2so4.html`, and not "any file under
`generated/`" — both of those are dropped as reference sources to stop the
drift described in problem 2).

### Authoring contract (what a content skill writes)

Instead of writing one complete `index.html` by hand, a content skill produces
three small inputs per lesson:

- `<slug>.hud.html` — the HUD fragment only (contents of `.panel`/`.legend`
  elements), no `<style>`/`<head>`.
- `<slug>.scene.js` — scene setup, animation, and interaction logic.
- `<slug>.meta.json` — `{ topic, level, skill, renderMode, themeVersion }`,
  where `renderMode` is `"threejs"` or `"dom"`.

### Build step

`scripts/assemble-courseware.mjs <kind> <slug>` reads the three input files and
writes:

```
generated/<kind>/<slug>/
├── index.html      ← shell.html + inlined theme.css + HUD fragment + a
│                       relative-path <script> reference to scene.js
├── scene.js         ← copied as-is (not inlined)
└── metadata.json    ← meta.json input + created_at + verify_status: "pending"
```

Two rules that resolve the scaling risks identified during design review:

- **`theme.css` is always inlined** into `<style>` — it's small and CSS only,
  so duplicating it per lesson is cheap and keeps each `index.html` readable
  standalone.
- **`vendor/three/*` is never inlined.** When `renderMode === "threejs"`, the
  build step adds a `<script type="importmap">` pointing at a relative path
  into `vendor/three/`, not the CDN, and not an inlined copy. This keeps every
  lesson runnable with no network access while avoiding a ~600KB+ duplicate of
  `three.module.js` in every generated lesson. "Self-contained" is treated as
  "no network calls," not "exactly one file." When `renderMode === "dom"`,
  nothing from `vendor/three/` is referenced at all — the shell has no
  hardcoded Three.js dependency, so a future non-3D content skill (e.g. a
  chart-based or classification-based format) can reuse the same base without
  carrying dead weight.

### `metadata.json` schema

Minimum required fields, written by the build step:

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

`themeVersion` lets future tooling detect which lessons were built against an
older `theme.css` if the theme changes later — no migration logic exists yet,
just the field needed to make migration possible.

### Draft/final screenshot convention

Verification screenshots that are not the accepted final state go in a
`iterations/` subfolder under the lesson directory; only screenshots that
passed verification stay alongside `index.html`. This is a convention enforced
by future verification scripts, not by `assemble-courseware.mjs` itself (the
build step does not touch screenshots).

### Testing

- New `tests/assemble-courseware.test.mjs` (does not touch the existing
  `tests/courseware-format.test.mjs`): given sample `.hud.html`/`.scene.js`/
  `.meta.json` input, assert the build step produces a valid `index.html`,
  copies `scene.js`, writes `metadata.json` with all required fields, and
  switches the Three.js `<script type="importmap">` on/off correctly based on
  `renderMode`.
- New `scripts/pw-assert-offline.mjs`: opens a built lesson via `file://` with
  network access blocked in Playwright and asserts it still renders — concrete
  proof that problem 1 is resolved for lessons built through this path.
- `package.json`: add a `build:courseware` script that runs
  `assemble-courseware.mjs`.

## Explicitly out of scope

- Editing `chem-3d-experiment/SKILL.md`, `chem-3d-visualization/SKILL.md`, or
  `chem-process-storyboard/SKILL.md`.
- Migrating the six existing lessons in `generated/` to the new output shape.
- The missing `agents/*.md` reviewer prompts and the missing skill registry
  (tracked separately; not solved by an output-template change).
- Designing a fourth courseware content type (data/chart, classification, or
  quantitative-practice format). `chem-courseware-base` is built to not block
  that decision later, but does not make it now.

## Next step

Use `skill-creator` to draft `chem-courseware-base`'s `SKILL.md` and bundled
resources, following this spec and using the three existing chemistry skills
as base reference material for conventions to stay consistent with.
